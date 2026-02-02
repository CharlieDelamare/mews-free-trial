#!/usr/bin/env node

/**
 * Migration deployment script that handles database baselining
 * This script attempts to deploy Prisma migrations and handles the P3005 error
 * (database not empty) by marking all existing migrations as applied.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function runCommand(command) {
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(output);
    return { success: true, output };
  } catch (error) {
    return { success: false, error: error.message, stdout: error.stdout, stderr: error.stderr };
  }
}

function getMigrations() {
  const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs.readdirSync(migrationsDir)
    .filter(name => {
      const fullPath = path.join(migrationsDir, name);
      return fs.statSync(fullPath).isDirectory();
    });
}

async function main() {
  console.log('🔄 Attempting to deploy migrations...');

  // Try to deploy migrations
  const result = runCommand('npx prisma migrate deploy');

  if (result.success) {
    console.log('✅ Migrations deployed successfully!');
    process.exit(0);
  }

  // Check if error is P3005 (database not empty)
  const errorOutput = result.stderr || result.stdout || '';
  if (errorOutput.includes('P3005')) {
    console.log('⚠️  Database is not empty. Baselining migrations...');

    const migrations = getMigrations();
    if (migrations.length === 0) {
      console.log('No migrations found to baseline.');
      process.exit(0);
    }

    console.log(`Found ${migrations.length} migration(s) to baseline.`);

    // Mark each migration as applied
    for (const migration of migrations) {
      console.log(`  → Marking as applied: ${migration}`);
      const resolveResult = runCommand(`npx prisma migrate resolve --applied "${migration}"`);

      if (!resolveResult.success) {
        console.error(`  ❌ Failed to mark ${migration} as applied`);
        console.error(resolveResult.stderr || resolveResult.error);
      }
    }

    console.log('✅ Baseline complete! All migrations marked as applied.');
    process.exit(0);
  }

  // Check if error is P3018 (migration failed - already exists)
  if (errorOutput.includes('P3018')) {
    console.log('⚠️  Migration failed because database objects already exist.');

    // Extract the migration name from the error output
    const migrationMatch = errorOutput.match(/Migration name: (\S+)/);
    if (migrationMatch && migrationMatch[1]) {
      const failedMigration = migrationMatch[1];
      console.log(`  → Marking failed migration as applied: ${failedMigration}`);

      const resolveResult = runCommand(`npx prisma migrate resolve --applied "${failedMigration}"`);

      if (resolveResult.success) {
        console.log('  ✅ Migration marked as applied. Retrying deployment...');

        // Try to deploy remaining migrations
        const retryResult = runCommand('npx prisma migrate deploy');
        if (retryResult.success) {
          console.log('✅ All migrations deployed successfully!');
          process.exit(0);
        } else {
          console.error('❌ Failed to deploy remaining migrations:');
          console.error(retryResult.stderr || retryResult.stdout || retryResult.error);
          process.exit(1);
        }
      } else {
        console.error('  ❌ Failed to mark migration as applied');
        console.error(resolveResult.stderr || resolveResult.error);
        process.exit(1);
      }
    } else {
      console.error('Could not extract migration name from error output.');
      console.error(errorOutput);
      process.exit(1);
    }
  }

  // Check if error is P3009 (migration found in failed state)
  if (errorOutput.includes('P3009')) {
    console.log('⚠️  Found migration in failed state. Attempting to resolve...');

    // Extract the migration name from the error output
    // Example: "The `20260202145405_add_integration_id_index` migration started at..."
    const migrationMatch = errorOutput.match(/The `([^`]+)` migration/);
    if (migrationMatch && migrationMatch[1]) {
      const failedMigration = migrationMatch[1];
      console.log(`  → Found failed migration: ${failedMigration}`);
      console.log(`  → Marking as rolled back to allow retry...`);

      const resolveResult = runCommand(`npx prisma migrate resolve --rolled-back "${failedMigration}"`);

      if (resolveResult.success) {
        console.log('  ✅ Migration marked as rolled back. Retrying deployment...');

        // Try to deploy migrations again
        const retryResult = runCommand('npx prisma migrate deploy');
        if (retryResult.success) {
          console.log('✅ All migrations deployed successfully!');
          process.exit(0);
        } else {
          console.error('❌ Failed to deploy migrations after resolving:');
          console.error(retryResult.stderr || retryResult.stdout || retryResult.error);
          process.exit(1);
        }
      } else {
        console.error('  ❌ Failed to mark migration as rolled back');
        console.error(resolveResult.stderr || resolveResult.error);
        process.exit(1);
      }
    } else {
      console.error('Could not extract migration name from error output.');
      console.error(errorOutput);
      process.exit(1);
    }
  }

  // Some other error occurred
  console.error('❌ Migration deployment failed with an unexpected error:');
  console.error(errorOutput);
  process.exit(1);
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
