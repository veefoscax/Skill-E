/**
 * File Logger for Portable Mode Debugging
 * 
 * Logs to console AND to a file in the temp directory
 * so we can debug issues in the portable executable.
 */

import { writeTextFile, mkdir, BaseDirectory } from '@tauri-apps/plugin-fs';

let logBuffer: string[] = [];
let logFilePath: string | null = null;

/**
 * Initialize the file logger
 */
export async function initFileLogger(): Promise<void> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    logFilePath = `skill-e-logs/session-${timestamp}.log`;
    
    // Create logs directory
    await mkdir('skill-e-logs', { baseDir: BaseDirectory.Temp, recursive: true });
    
    console.log('📁 File logger initialized:', logFilePath);
    await writeLog('🚀 Skill-E File Logger Started\n');
  } catch (e) {
    console.error('Failed to init file logger:', e);
  }
}

/**
 * Write a log entry to file
 */
async function writeLog(message: string): Promise<void> {
  if (!logFilePath) return;
  
  const timestamp = new Date().toLocaleTimeString();
  const logLine = `[${timestamp}] ${message}\n`;
  
  logBuffer.push(logLine);
  
  // Flush every 10 lines or on important logs
  if (logBuffer.length >= 10 || message.includes('🎤') || message.includes('ERROR')) {
    await flushLogs();
  }
}

/**
 * Flush buffered logs to file
 */
async function flushLogs(): Promise<void> {
  if (!logFilePath || logBuffer.length === 0) return;
  
  try {
    const content = logBuffer.join('');
    await writeTextFile(logFilePath, content, { 
      baseDir: BaseDirectory.Temp,
      append: true 
    });
    logBuffer = [];
  } catch (e) {
    console.error('Failed to flush logs:', e);
  }
}

/**
 * Log function that logs to both console and file
 */
export function log(level: 'info' | 'warn' | 'error', ...args: any[]): void {
  const message = args.join(' ');
  
  // Always log to console
  console[level](...args);
  
  // Also log to file
  writeLog(`${level.toUpperCase()}: ${message}`).catch(() => {
    // Silent fail
  });
}

/**
 * Force flush all pending logs
 */
export async function flushAllLogs(): Promise<void> {
  await flushLogs();
}

// Convenience methods
export const logger = {
  info: (...args: any[]) => log('info', ...args),
  warn: (...args: any[]) => log('warn', ...args),
  error: (...args: any[]) => log('error', ...args),
};

/**
 * Simple file log function - for direct use
 * Logs to console and tries to write to file
 */
export async function fileLog(message: string, level: 'info' | 'error' | 'warn' = 'info'): Promise<void> {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  // Always log to console
  console[level](logEntry);
  
  // Try to write to file
  try {
    await writeLog(`${level.toUpperCase()}: ${message}`);
  } catch (e) {
    // Silent fail - console log is enough
  }
}
