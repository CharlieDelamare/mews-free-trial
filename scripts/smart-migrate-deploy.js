#!/usr/bin/env node

/**
 * Smart migration deployment - checks if migrations are needed first
 * Significantly speeds up deployments when no new migrations exist
 */

const { execSync } = require('child_process');

function runCommand(command, silent = false) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output };
  } catch (error) {
    return {
      success: false,
      stdout: error.stdout,
      stderr: error.stderr
    };
  }
}

function checkMigrationStatus() {
  console.log('🔍 Checking migration status...');

  const result = runCommand('npx prisma migrate status', true);

  if (result.success && result.output) {
    const output = result.output.toString();

    if (output.includes('Database schema is up to date')) {
      console.log('✅ Database already up to date - no migrations needed');
      return false;
    }

    if (output.includes('pending migration')) {
      console.log('⚠️  Pending migrations detected - running migrations');
      return true;
    }
  }

  console.log('⚠️  Cannot determine status - running migrations to be safe');
  return true;
}

async function main() {
  if (!checkMigrationStatus()) {
    process.exit(0);
  }

  console.log('🔄 Running migration deployment...');
  const result = runCommand('node scripts/migrate-deploy.js');

  process.exit(result.success ? 0 : 1);
}

main().catch(() => process.exit(1));
