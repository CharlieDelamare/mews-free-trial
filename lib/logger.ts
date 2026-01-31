import fs from 'fs';
import path from 'path';

export interface EnvironmentLog {
  id: string;
  timestamp: string;
  propertyName: string;
  customerName: string;
  customerEmail: string;
  propertyCountry: string;
  propertyType: string;
  loginUrl: string;
  loginEmail: string;
  loginPassword: string;
  status: 'success' | 'failure';
  errorMessage?: string;
}

const LOGS_FILE = path.join(process.cwd(), 'environment-logs.json');

// Ensure logs file exists
function ensureLogsFile() {
  if (!fs.existsSync(LOGS_FILE)) {
    fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2));
  }
}

export function saveEnvironmentLog(log: EnvironmentLog) {
  try {
    ensureLogsFile();
    const logs = readEnvironmentLogs();
    logs.unshift(log); // Add to beginning for newest first
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error('Failed to save environment log:', error);
  }
}

export function readEnvironmentLogs(): EnvironmentLog[] {
  try {
    ensureLogsFile();
    const data = fs.readFileSync(LOGS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Failed to read environment logs:', error);
    return [];
  }
}
