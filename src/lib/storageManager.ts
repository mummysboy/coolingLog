import { LogEntry, InitialEntry, User } from './types';
import { awsStorageManager } from './awsService';

// AWS-only storage manager - no local fallback
class AWSOnlyStorageManager {
  private useAWS = true;

  // Test AWS connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing AWS connection...');
      const isConnected = await awsStorageManager.testConnection();
      this.useAWS = isConnected;
      return isConnected;
    } catch (error) {
      console.error('AWS connection test failed:', error);
      this.useAWS = false;
      return false;
    }
  }

  // Ensure AWS is available before any operation
  private async ensureAWS(): Promise<void> {
    if (!this.useAWS) {
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('AWS DynamoDB is not available. Please check your connection and try again.');
      }
    }
  }

  async saveLogs(logs: LogEntry[]): Promise<void> {
    await this.ensureAWS();
    return awsStorageManager.saveLogs(logs);
  }

  async saveLog(log: LogEntry): Promise<void> {
    await this.ensureAWS();
    return awsStorageManager.saveLog(log);
  }

  async getLogs(): Promise<LogEntry[]> {
    await this.ensureAWS();
    return awsStorageManager.getLogs();
  }

  async getLog(id: string): Promise<LogEntry | undefined> {
    await this.ensureAWS();
    return awsStorageManager.getLog(id);
  }

  async deleteLog(id: string): Promise<void> {
    await this.ensureAWS();
    return awsStorageManager.deleteLog(id);
  }

  async clearAllLogs(): Promise<void> {
    await this.ensureAWS();
    return awsStorageManager.clearAllLogs();
  }

  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    await this.ensureAWS();
    return awsStorageManager.getLogsByDateRange(startDate, endDate);
  }

  async getTodaysLogs(): Promise<LogEntry[]> {
    await this.ensureAWS();
    return awsStorageManager.getTodaysLogs();
  }

  // AWS-specific methods
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    await this.ensureAWS();
    return awsStorageManager.createUser(user);
  }

  async getUsers(): Promise<User[]> {
    await this.ensureAWS();
    return awsStorageManager.getUsers();
  }

  async createInitialEntry(entry: Omit<InitialEntry, 'id' | 'createdAt'>): Promise<InitialEntry> {
    await this.ensureAWS();
    return awsStorageManager.createInitialEntry(entry);
  }

  async getInitialEntries(): Promise<InitialEntry[]> {
    await this.ensureAWS();
    return awsStorageManager.getInitialEntries();
  }

  // Check if we're using AWS
  isUsingAWS(): boolean {
    return this.useAWS;
  }

  // Force re-enable AWS (for testing purposes)
  async enableAWS(): Promise<void> {
    this.useAWS = true;
    await this.testConnection();
  }
}

export const storageManager = new AWSOnlyStorageManager();
