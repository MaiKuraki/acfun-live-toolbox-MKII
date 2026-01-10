import * as fs from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { DataManager } from '../persistence/DataManager';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'error' | 'warn' | 'debug';
  source: string;
  message: string;
  correlationId?: string;
}

export interface LogManager {
  addLog(source: string, message: string, level: 'info' | 'error' | 'warn' | 'debug', correlationId?: string): void;
  getRecentLogs(count?: number): LogEntry[];
  getLogFiles(): string[];
  sanitizeMessage(message: string): string;
}

class EnhancedLogManager implements LogManager {
  private readonly logDir: string;
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB
  private readonly maxFiles = 5;
  private readonly recentLogs: LogEntry[] = [];
  private readonly maxRecentLogs = 1000;
  private currentLogFile: string;
  private currentFileSize = 0;
  private readonly dataManager = DataManager.getInstance();

  // 敏感信息脱敏模式
  private readonly sensitivePatterns = [
    /token["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /auth["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /cookie["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /password["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /secret["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /authorization["\s]*[:=]["\s]*[^"\s,}]+/gi,
    /bearer\s+[a-zA-Z0-9._-]+/gi,
    /acfun[_-]?token["\s]*[:=]["\s]*[^"\s,}]+/gi,
  ];

  constructor() {
    // 在根目录生成日志，每次启动生成新文件
    this.logDir = path.join(process.cwd(), 'logs');
    this.ensureLogDirectory();
    this.currentLogFile = this.getCurrentLogFile();
    this.initializeCurrentFileSize();
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getCurrentLogFile(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-'); // YYYY-MM-DDTHH-mm-ss-sssZ
    return path.join(this.logDir, `runtime-${timestamp}.log`);
  }

  private initializeCurrentFileSize(): void {
    try {
      if (fs.existsSync(this.currentLogFile)) {
        const stats = fs.statSync(this.currentLogFile);
        this.currentFileSize = stats.size;
      } else {
        this.currentFileSize = 0;
      }
    } catch (error: any) {
      this.currentFileSize = 0;
    }
  }

  private rotateLogFiles(): void {
    try {
      const files = fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          mtime: fs.statSync(path.join(this.logDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      // 删除超过最大文件数的旧日志
      if (files.length >= this.maxFiles) {
        const filesToDelete = files.slice(this.maxFiles - 1);
        filesToDelete.forEach(file => {
          try {
            fs.unlinkSync(file.path);
          } catch (error) {
            console.error(`Failed to delete old log file ${file.name}:`, error);
          }
        });
      }

      // 创建新的日志文件
      this.currentLogFile = this.getCurrentLogFile();
      this.currentFileSize = 0;
    } catch (error: any) {
      console.error('Failed to rotate log files:', error);
    }
  }

  sanitizeMessage(message: string): string {
    let sanitized = message;
    
    this.sensitivePatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, (match) => {
        const parts = match.split(/[:=]/);
        if (parts.length >= 2) {
          return `${parts[0]}:***REDACTED***`;
        }
        return '***REDACTED***';
      });
    });

    return sanitized;
  }

  addLog(source: string, message: string, level: 'info' | 'error' | 'warn' | 'debug', correlationId?: string): void {
    const timestamp = new Date().toISOString();
    const sanitizedMessage = this.sanitizeMessage(message);
    
    const logEntry: LogEntry = {
      timestamp,
      level,
      source,
      message: sanitizedMessage,
      correlationId
    };

    // 添加到内存中的最近日志
    this.recentLogs.push(logEntry);
    if (this.recentLogs.length > this.maxRecentLogs) {
      this.recentLogs.shift();
    }

    // 格式化日志消息
    const correlationPart = correlationId ? ` [${correlationId}]` : '';
    const logMessage = `[${timestamp}] [${level.toUpperCase()}] [${source}]${correlationPart} ${sanitizedMessage}\n`;

    // 移除控制台直接输出，避免与重写的 console.* 重复打印

    // 写入文件
    this.writeToFile(logMessage);

    try {
      this.dataManager.publish('system:logs', logEntry as any, { ttlMs: 5 * 60 * 1000, persist: false, meta: { kind: 'system-log' } });
    } catch {}
  }

  private writeToFile(logMessage: string): void {
    try {
      // 检查是否需要轮转日志文件
      if (this.currentFileSize + Buffer.byteLength(logMessage, 'utf8') > this.maxFileSize) {
        this.rotateLogFiles();
      }

      // 写入当前日志文件
      fs.appendFileSync(this.currentLogFile, logMessage, 'utf8');
      this.currentFileSize += Buffer.byteLength(logMessage, 'utf8');
    } catch (error: any) {
      console.error('Failed to write to log file:', error);
    }
  }

  getRecentLogs(count: number = 100): LogEntry[] {
    return this.recentLogs.slice(-count);
  }

  getLogFiles(): string[] {
    try {
      return fs.readdirSync(this.logDir)
        .filter(file => file.startsWith('app-') && file.endsWith('.log'))
        .map(file => path.join(this.logDir, file))
        .sort((a, b) => {
          const statsA = fs.statSync(a);
          const statsB = fs.statSync(b);
          return statsB.mtime.getTime() - statsA.mtime.getTime();
        });
    } catch (error: any) {
      console.error('Failed to get log files:', error);
      return [];
    }
  }
}

let logManagerInstance: LogManager | null = null;

export function getLogManager(): LogManager {
  if (!logManagerInstance) {
    logManagerInstance = new EnhancedLogManager();
  }
  return logManagerInstance;
}