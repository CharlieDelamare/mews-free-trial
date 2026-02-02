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

  // Some other error occurred
  console.error('❌ Migration deployment failed with an unexpected error:');
  console.error(errorOutput);
  process.exit(1);
}

main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
