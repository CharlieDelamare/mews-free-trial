/**
 * Task Service - Automatically creates onboarding tasks in Mews trial sandboxes
 *
 * This service is triggered automatically after customers and reservations are created
 * in a new trial sandbox. It creates 8 onboarding tasks that guide prospects through
 * key Mews features (reservations, check-in/out, billing, etc.).
 */

import { prisma } from './prisma';
import { getOnboardingTasks, OnboardingTask } from './onboarding-tasks';
import { updateEnvironmentTaskStats } from './unified-logger';
import { log, logError } from './force-log';
import { fetchWithRateLimit } from './mews-rate-limiter';
import { getMewsClientToken, getMewsApiUrl } from './config';

const MEWS_CLIENT_TOKEN = getMewsClientToken();
const MEWS_API_URL = getMewsApiUrl();

/**
 * Result of creating a single task
 */
interface TaskResult {
  name: string;
  success: boolean;
  taskId?: string;
  error?: string;
}

/**
 * Result of the entire task creation batch
 */
interface TaskCreationResult {
  id: number;
  enterpriseId: string;
  totalTasks: number;
  successCount: number;
  failureCount: number;
  startedAt: Date;
  completedAt: Date;
  status: string;
  taskResults: TaskResult[];
}

/**
 * Main entry point: Create onboarding tasks in a Mews trial sandbox
 *
 * @param accessToken - Access token received from webhook for this specific enterprise
 * @param enterpriseId - Enterprise ID to create tasks in
 * @param accessTokenId - Database ID of the access token record
 * @param options - Optional parameters including logId for unified log updates
 * @returns Promise resolving to the task creation log
 */
export async function createOnboardingTasks(
  accessToken: string,
  enterpriseId: string,
  accessTokenId: number,
  options?: { logId?: string }
): Promise<TaskCreationResult> {
  const startTime = Date.now();
  const logId = options?.logId;

  const tasks = getOnboardingTasks();

  log.tasks('Starting onboarding task creation', {
    count: tasks.length,
    enterpriseId,
  });

  // Create log entry with status 'processing'
  const taskLog = await prisma.taskCreationLog.create({
    data: {
      enterpriseId,
      accessTokenId,
      totalTasks: tasks.length,
      successCount: 0,
      failureCount: 0,
      status: 'processing',
      taskResults: [],
    },
  });

  // Update unified log's operationDetails if logId provided
  if (logId) {
    try {
      await updateEnvironmentTaskStats(logId, {
        status: 'processing',
        total: tasks.length,
        success: 0,
        failed: 0,
      });
    } catch (error) {
      console.error('[TASKS] Failed to update unified log stats:', error);
    }
  }

  try {
    // Process all 8 tasks with Promise.allSettled (no chunking needed for just 8)
    const deadlineUtc = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const promises = tasks.map((task) => createSingleTask(accessToken, task, deadlineUtc));
    const settledResults = await Promise.allSettled(promises);

    const results: TaskResult[] = settledResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          name: tasks[index].Name,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        };
      }
    });

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    log.tasks('Task creation complete', {
      success: successCount,
      failed: failureCount,
      total: tasks.length,
      duration: `${durationSeconds}s`,
    });

    // Update log with final results
    const updatedLog = await prisma.taskCreationLog.update({
      where: { id: taskLog.id },
      data: {
        successCount,
        failureCount,
        completedAt: new Date(),
        status: failureCount === 0 ? 'completed' : 'failed',
        taskResults: results as any,
        errorSummary:
          failureCount > 0
            ? `${failureCount} tasks failed to create. See taskResults for details.`
            : null,
      },
    });

    // Update unified log's operationDetails if logId provided
    if (logId) {
      try {
        await updateEnvironmentTaskStats(logId, {
          status: 'completed',
          total: tasks.length,
          success: successCount,
          failed: failureCount,
        });
      } catch (error) {
        console.error('[TASKS] Failed to update unified log stats:', error);
      }
    }

    return {
      id: updatedLog.id,
      enterpriseId: updatedLog.enterpriseId,
      totalTasks: updatedLog.totalTasks,
      successCount: updatedLog.successCount,
      failureCount: updatedLog.failureCount,
      startedAt: updatedLog.startedAt,
      completedAt: updatedLog.completedAt!,
      status: updatedLog.status,
      taskResults: results,
    };
  } catch (error) {
    logError.tasks('Fatal error during task creation', error);

    // Update log with failure status
    await prisma.taskCreationLog.update({
      where: { id: taskLog.id },
      data: {
        completedAt: new Date(),
        status: 'failed',
        errorSummary: error instanceof Error ? error.message : String(error),
      },
    });

    // Update unified log's operationDetails if logId provided
    if (logId) {
      try {
        await updateEnvironmentTaskStats(logId, {
          status: 'failed',
          total: tasks.length,
          success: 0,
          failed: tasks.length,
        });
      } catch (updateError) {
        console.error('[TASKS] Failed to update unified log stats:', updateError);
      }
    }

    throw error;
  }
}

/**
 * Create a single task in Mews via the Connector API
 *
 * @param accessToken - Access token for authentication
 * @param task - Onboarding task template
 * @param deadlineUtc - ISO string for the task deadline
 * @returns Promise resolving to task creation result
 */
async function createSingleTask(
  accessToken: string,
  task: OnboardingTask,
  deadlineUtc: string
): Promise<TaskResult> {
  try {
    const requestBody = {
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Sandbox Filler 1.0.0',
      Name: task.Name,
      Description: task.Description,
      DeadlineUtc: deadlineUtc,
    };

    const response = await fetchWithRateLimit(
      `${MEWS_API_URL}/api/connector/v1/tasks/add`,
      accessToken,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      },
      'tasks/add'
    );

    const data = await response.json();

    if (response.ok && data.Id) {
      return {
        name: task.Name,
        success: true,
        taskId: data.Id,
      };
    } else {
      logError.tasks(`Failed to create "${task.Name}"`, data);
      return {
        name: task.Name,
        success: false,
        error: data.Message || data.error || 'Unknown API error',
      };
    }
  } catch (error) {
    logError.tasks(`Exception creating "${task.Name}"`, error);
    return {
      name: task.Name,
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
