/**
 * Customer Service - Automatically creates sample customers in Mews trial environments
 *
 * This service is triggered automatically when a webhook receives an access token
 * from Mews after creating a trial environment. It creates 300 predetermined
 * customer profiles using the Mews Connector API.
 */

import { prisma } from './prisma';
import { getSampleCustomers, SampleCustomer } from './sample-customers';

// Hardcoded configuration for Mews demo environment
const MEWS_CLIENT_TOKEN = 'B7DB2BC5307849758EB9B00A00E85B69-77E0E354A6E058C0E1A456B5238BFA0';
const MEWS_API_URL = 'https://api.mews-demo.com';
const CONCURRENCY = 5; // Process 5 customers at a time to avoid overwhelming API

/**
 * Result of creating a single customer
 */
interface CustomerResult {
  email: string;
  success: boolean;
  customerId?: string;
  error?: string;
}

/**
 * Result of the entire customer creation batch
 */
interface CustomerCreationResult {
  id: number;
  enterpriseId: string;
  totalCustomers: number;
  successCount: number;
  failureCount: number;
  startedAt: Date;
  completedAt: Date;
  status: string;
  customerResults: CustomerResult[];
}

/**
 * Main entry point: Create 300 sample customers in a Mews trial environment
 *
 * This function is called automatically from the webhook handler after receiving
 * an access token. It processes customers in batches with concurrency control.
 *
 * @param accessToken - Access token received from webhook for this specific enterprise
 * @param enterpriseId - Enterprise ID to create customers in
 * @param accessTokenId - Database ID of the access token record
 * @returns Promise resolving to the customer creation log
 */
export async function createSampleCustomers(
  accessToken: string,
  enterpriseId: string,
  accessTokenId: number
): Promise<CustomerCreationResult> {
  const startTime = Date.now();

  // Get sample customers (defaults to 300)
  const customers = getSampleCustomers();

  console.log(`[CUSTOMERS] Starting creation of ${customers.length} customers for:`, enterpriseId);

  // Create log entry with status 'processing'
  const log = await prisma.customerCreationLog.create({
    data: {
      enterpriseId,
      accessTokenId,
      totalCustomers: customers.length,
      successCount: 0,
      failureCount: 0,
      status: 'processing',
      customerResults: []
    }
  });

  try {

    // Process in batches with concurrency control
    const results = await processBatch(customers, accessToken, CONCURRENCY);

    // Calculate success/failure counts
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log(`[CUSTOMERS] ✅ Complete:`, {
      success: successCount,
      failed: failureCount,
      duration: `${durationSeconds}s`
    });

    // Update log with final results
    const updatedLog = await prisma.customerCreationLog.update({
      where: { id: log.id },
      data: {
        successCount,
        failureCount,
        completedAt: new Date(),
        status: failureCount === 0 ? 'completed' : 'completed',
        customerResults: results as any,
        errorSummary: failureCount > 0
          ? `${failureCount} customers failed to create. See customerResults for details.`
          : null
      }
    });

    return {
      id: updatedLog.id,
      enterpriseId: updatedLog.enterpriseId,
      totalCustomers: updatedLog.totalCustomers,
      successCount: updatedLog.successCount,
      failureCount: updatedLog.failureCount,
      startedAt: updatedLog.startedAt,
      completedAt: updatedLog.completedAt!,
      status: updatedLog.status,
      customerResults: results
    };

  } catch (error) {
    console.error('[CUSTOMERS] ❌ Fatal error during customer creation:', error);

    // Update log with failure status
    await prisma.customerCreationLog.update({
      where: { id: log.id },
      data: {
        completedAt: new Date(),
        status: 'failed',
        errorSummary: error instanceof Error ? error.message : String(error)
      }
    });

    throw error;
  }
}

/**
 * Process customers in batches with concurrency control
 *
 * Uses Promise.allSettled to continue processing even if some customers fail.
 * Processes customers in chunks to avoid overwhelming the Mews API.
 *
 * @param customers - Array of customer profiles to create
 * @param accessToken - Access token for Mews API
 * @param concurrency - Number of customers to process simultaneously
 * @returns Array of customer creation results
 */
async function processBatch(
  customers: SampleCustomer[],
  accessToken: string,
  concurrency: number
): Promise<CustomerResult[]> {
  const results: CustomerResult[] = [];

  // Process in chunks to control concurrency
  for (let i = 0; i < customers.length; i += concurrency) {
    const chunk = customers.slice(i, i + concurrency);

    // Process this chunk in parallel
    const promises = chunk.map(customer => createSingleCustomer(accessToken, customer));
    const settledResults = await Promise.allSettled(promises);

    // Extract results from settled promises
    const chunkResults = settledResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        // Promise was rejected
        return {
          email: chunk[index].Email,
          success: false,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason)
        };
      }
    });

    results.push(...chunkResults);

    // Small delay between chunks to be nice to the API
    if (i + concurrency < customers.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return results;
}

/**
 * Create a single customer in Mews via the Connector API
 *
 * Makes a POST request to /api/connector/v1/customers/add with the customer data.
 * Returns success/failure result with customer ID or error message.
 *
 * @param accessToken - Access token for authentication
 * @param customer - Customer profile to create
 * @returns Promise resolving to customer creation result
 */
async function createSingleCustomer(
  accessToken: string,
  customer: SampleCustomer
): Promise<CustomerResult> {
  try {
    const requestBody = {
      ClientToken: MEWS_CLIENT_TOKEN,
      AccessToken: accessToken,
      Client: 'Mews Free Trial App - Sample Data',
      FirstName: customer.FirstName,
      LastName: customer.LastName,
      Email: customer.Email,
      Phone: customer.Phone,
      BirthDate: customer.BirthDate,
      Sex: customer.Sex,
      Title: customer.Title,
      NationalityCode: customer.NationalityCode,
      PreferredLanguageCode: customer.PreferredLanguageCode,
      CompanyIdentifier: customer.CompanyIdentifier,
      Classifications: customer.Classifications,
      Notes: customer.Notes
    };

    const response = await fetch(`${MEWS_API_URL}/api/connector/v1/customers/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (response.ok && data.Id) {
      // Success
      return {
        email: customer.Email,
        success: true,
        customerId: data.Id
      };
    } else {
      // API returned error
      console.error(`[CUSTOMERS] Failed to create ${customer.Email}:`, data);
      return {
        email: customer.Email,
        success: false,
        error: data.Message || data.error || 'Unknown API error'
      };
    }

  } catch (error) {
    // Network error or other exception
    console.error(`[CUSTOMERS] Exception creating ${customer.Email}:`, error);
    return {
      email: customer.Email,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
