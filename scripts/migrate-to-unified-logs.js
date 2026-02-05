#!/usr/bin/env node

/**
 * Data migration script to migrate existing logs to the UnifiedLog table.
 *
 * This script:
 * 1. Migrates EnvironmentLog entries to UnifiedLog (with embedded stats from CustomerCreationLog/ReservationCreationLog)
 * 2. Migrates ResetOperationLog entries to UnifiedLog
 * 3. Migrates ReservationCreationLog (demo_filler only) entries to UnifiedLog
 *
 * Run this after the database schema migration is applied.
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Map old status values to new normalized values
function normalizeStatus(status) {
  switch (status) {
    case 'building':
      return 'building';
    case 'Updating':
      return 'processing';
    case 'processing':
      return 'processing';
    case 'completed':
      return 'completed';
    case 'failure':
      return 'failed';
    case 'failed':
      return 'failed';
    default:
      return status;
  }
}

async function migrateEnvironmentLogs() {
  console.log('\n📋 Migrating EnvironmentLog entries...');

  const envLogs = await prisma.environmentLog.findMany({
    orderBy: { timestamp: 'asc' }
  });

  console.log(`   Found ${envLogs.length} environment logs to migrate`);

  // Get all customer and reservation creation logs for enrichment
  const customerLogs = await prisma.customerCreationLog.findMany();
  const reservationLogs = await prisma.reservationCreationLog.findMany({
    where: { operationType: 'automatic' }
  });

  // Create lookup maps by enterpriseId
  const customerLogMap = new Map();
  const reservationLogMap = new Map();

  for (const log of customerLogs) {
    const existing = customerLogMap.get(log.enterpriseId);
    if (!existing || log.startedAt > existing.startedAt) {
      customerLogMap.set(log.enterpriseId, log);
    }
  }

  for (const log of reservationLogs) {
    const existing = reservationLogMap.get(log.enterpriseId);
    if (!existing || log.startedAt > existing.startedAt) {
      reservationLogMap.set(log.enterpriseId, log);
    }
  }

  let successCount = 0;
  let errorCount = 0;

  for (const log of envLogs) {
    try {
      // Build operationDetails from customer/reservation logs
      const operationDetails = {};

      if (log.enterpriseId) {
        const customerLog = customerLogMap.get(log.enterpriseId);
        if (customerLog) {
          operationDetails.customers = {
            status: customerLog.status,
            total: customerLog.totalCustomers,
            success: customerLog.successCount,
            failed: customerLog.failureCount
          };
        }

        const reservationLog = reservationLogMap.get(log.enterpriseId);
        if (reservationLog) {
          // Parse reservation results to get byState breakdown
          let byState = null;
          if (reservationLog.reservationResults) {
            try {
              const results = typeof reservationLog.reservationResults === 'string'
                ? JSON.parse(reservationLog.reservationResults)
                : reservationLog.reservationResults;

              if (Array.isArray(results)) {
                byState = {};
                for (const r of results) {
                  if (r.desiredState) {
                    byState[r.desiredState] = (byState[r.desiredState] || 0) + 1;
                  }
                }
              }
            } catch (e) {
              // Ignore parse errors
            }
          }

          operationDetails.reservations = {
            status: reservationLog.status,
            total: reservationLog.totalReservations,
            success: reservationLog.successCount,
            failed: reservationLog.failureCount,
            ...(byState && Object.keys(byState).length > 0 ? { byState } : {})
          };
        }
      }

      await prisma.unifiedLog.create({
        data: {
          id: log.id, // Preserve original ID
          logType: 'environment',
          timestamp: log.timestamp,
          enterpriseId: log.enterpriseId,
          status: normalizeStatus(log.status),
          completedAt: log.status === 'completed' || log.status === 'failure' ? log.timestamp : null,
          errorMessage: log.errorMessage,
          propertyName: log.propertyName,
          customerName: log.customerName,
          customerEmail: log.customerEmail,
          propertyCountry: log.propertyCountry,
          propertyType: log.propertyType,
          loginUrl: log.loginUrl,
          loginEmail: log.loginEmail,
          loginPassword: log.loginPassword,
          requestorEmail: log.requestorEmail,
          durationDays: log.durationDays,
          roomCount: log.roomCount,
          dormCount: log.dormCount,
          apartmentCount: log.apartmentCount,
          bedCount: log.bedCount,
          timezone: log.timezone,
          salesforceAccountId: log.salesforceAccountId,
          operationDetails: Object.keys(operationDetails).length > 0 ? operationDetails : null,
        }
      });

      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to migrate environment log ${log.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`   ✅ Migrated ${successCount} environment logs (${errorCount} errors)`);
  return { success: successCount, errors: errorCount };
}

async function migrateResetLogs() {
  console.log('\n🔄 Migrating ResetOperationLog entries...');

  const resetLogs = await prisma.resetOperationLog.findMany({
    orderBy: { startedAt: 'asc' }
  });

  console.log(`   Found ${resetLogs.length} reset logs to migrate`);

  let successCount = 0;
  let errorCount = 0;

  for (const log of resetLogs) {
    try {
      await prisma.unifiedLog.create({
        data: {
          id: `reset-${log.id}`,
          logType: 'reset',
          timestamp: log.startedAt,
          enterpriseId: log.enterpriseId,
          status: normalizeStatus(log.status),
          completedAt: log.completedAt,
          errorMessage: log.errorSummary,
          currentStep: log.currentStep,
          totalSteps: log.totalSteps,
          accessTokenId: log.accessTokenId,
          operationDetails: log.operationDetails,
        }
      });

      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to migrate reset log ${log.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`   ✅ Migrated ${successCount} reset logs (${errorCount} errors)`);
  return { success: successCount, errors: errorCount };
}

async function migrateDemoFillerLogs() {
  console.log('\n🎯 Migrating demo_filler ReservationCreationLog entries...');

  const demoFillerLogs = await prisma.reservationCreationLog.findMany({
    where: { operationType: 'demo_filler' },
    orderBy: { startedAt: 'asc' }
  });

  console.log(`   Found ${demoFillerLogs.length} demo filler logs to migrate`);

  let successCount = 0;
  let errorCount = 0;

  for (const log of demoFillerLogs) {
    try {
      // Parse reservation results to get byState breakdown
      let byState = null;
      if (log.reservationResults) {
        try {
          const results = typeof log.reservationResults === 'string'
            ? JSON.parse(log.reservationResults)
            : log.reservationResults;

          if (Array.isArray(results)) {
            byState = {};
            for (const r of results) {
              if (r.desiredState) {
                byState[r.desiredState] = (byState[r.desiredState] || 0) + 1;
              }
            }
          }
        } catch (e) {
          // Ignore parse errors
        }
      }

      await prisma.unifiedLog.create({
        data: {
          id: `demo-filler-${log.id}`,
          logType: 'demo_filler',
          timestamp: log.startedAt,
          enterpriseId: log.enterpriseId,
          status: normalizeStatus(log.status),
          completedAt: log.completedAt,
          errorMessage: log.errorSummary,
          accessTokenId: log.accessTokenId,
          totalItems: log.totalReservations,
          successCount: log.successCount,
          failureCount: log.failureCount,
          operationDetails: byState && Object.keys(byState).length > 0 ? { byState } : null,
        }
      });

      successCount++;
    } catch (error) {
      console.error(`   ❌ Failed to migrate demo filler log ${log.id}:`, error.message);
      errorCount++;
    }
  }

  console.log(`   ✅ Migrated ${successCount} demo filler logs (${errorCount} errors)`);
  return { success: successCount, errors: errorCount };
}

async function verifyMigration() {
  console.log('\n🔍 Verifying migration...');

  const unifiedCount = await prisma.unifiedLog.count();
  const envCount = await prisma.environmentLog.count();
  const resetCount = await prisma.resetOperationLog.count();
  const demoFillerCount = await prisma.reservationCreationLog.count({
    where: { operationType: 'demo_filler' }
  });

  const expectedCount = envCount + resetCount + demoFillerCount;

  console.log(`   Source tables:`);
  console.log(`     - EnvironmentLog: ${envCount}`);
  console.log(`     - ResetOperationLog: ${resetCount}`);
  console.log(`     - ReservationCreationLog (demo_filler): ${demoFillerCount}`);
  console.log(`     - Expected total: ${expectedCount}`);
  console.log(`   UnifiedLog count: ${unifiedCount}`);

  if (unifiedCount === expectedCount) {
    console.log(`   ✅ Migration verified successfully!`);
    return true;
  } else {
    console.log(`   ⚠️  Count mismatch! Expected ${expectedCount}, got ${unifiedCount}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting data migration to UnifiedLog...');
  console.log('================================================');

  try {
    // Check if UnifiedLog table exists and is empty
    const existingCount = await prisma.unifiedLog.count();
    if (existingCount > 0) {
      console.log(`\n⚠️  UnifiedLog table already has ${existingCount} entries.`);
      console.log('   To re-run migration, first delete existing entries:');
      console.log('   DELETE FROM "UnifiedLog";');
      process.exit(1);
    }

    const envResult = await migrateEnvironmentLogs();
    const resetResult = await migrateResetLogs();
    const demoFillerResult = await migrateDemoFillerLogs();

    console.log('\n================================================');
    console.log('📊 Migration Summary:');
    console.log(`   Environment logs: ${envResult.success} success, ${envResult.errors} errors`);
    console.log(`   Reset logs: ${resetResult.success} success, ${resetResult.errors} errors`);
    console.log(`   Demo filler logs: ${demoFillerResult.success} success, ${demoFillerResult.errors} errors`);

    const totalSuccess = envResult.success + resetResult.success + demoFillerResult.success;
    const totalErrors = envResult.errors + resetResult.errors + demoFillerResult.errors;
    console.log(`   Total: ${totalSuccess} success, ${totalErrors} errors`);

    await verifyMigration();

    console.log('\n✅ Data migration complete!');
    console.log('\nNext steps:');
    console.log('1. Verify the logs page displays correctly');
    console.log('2. Test creating a new environment');
    console.log('3. Test reset and demo filler operations');
    console.log('4. Once verified, you can drop the old tables');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
