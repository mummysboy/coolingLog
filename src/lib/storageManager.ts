import { LogEntry, InitialEntry, User } from './types';
import { awsStorageManager } from './awsService';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface FoodLogDB extends DBSchema {
  logs: {
    key: string;
    value: LogEntry;
    indexes: { 'by-date': Date };
  };
}

// Local IndexedDB implementation as fallback
class LocalStorageManager {
  private db: IDBPDatabase<FoodLogDB> | null = null;

  async init() {
    if (this.db) return this.db;

    this.db = await openDB<FoodLogDB>('food-chilling-log-db', 1, {
      upgrade(db) {
        const logStore = db.createObjectStore('logs', {
          keyPath: 'id',
        });
        logStore.createIndex('by-date', 'date');
      },
    });

    return this.db;
  }

  async saveLogs(logs: LogEntry[]): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('logs', 'readwrite');
    
    const logsWithDates = logs.map(log => ({
      ...log,
      date: new Date(log.date),
      stages: {
        cook: {
          ...log.stages.cook,
          time: log.stages.cook.time ? new Date(log.stages.cook.time) : log.stages.cook.time,
        },
        startCooling: {
          ...log.stages.startCooling,
          time: log.stages.startCooling.time ? new Date(log.stages.startCooling.time) : log.stages.startCooling.time,
        },
        to80: {
          ...log.stages.to80,
          time: log.stages.to80.time ? new Date(log.stages.to80.time) : log.stages.to80.time,
        },
        to54: {
          ...log.stages.to54,
          time: log.stages.to54.time ? new Date(log.stages.to54.time) : log.stages.to54.time,
        },
        finalChill: {
          ...log.stages.finalChill,
          time: log.stages.finalChill.time ? new Date(log.stages.finalChill.time) : log.stages.finalChill.time,
        },
      },
    }));
    
    await Promise.all([
      ...logsWithDates.map(log => tx.store.put(log)),
      tx.done,
    ]);
  }

  async saveLog(log: LogEntry): Promise<void> {
    const db = await this.init();
    
    const logWithDates = {
      ...log,
      date: new Date(log.date),
      stages: {
        cook: {
          ...log.stages.cook,
          time: log.stages.cook.time ? new Date(log.stages.cook.time) : log.stages.cook.time,
        },
        startCooling: {
          ...log.stages.startCooling,
          time: log.stages.startCooling.time ? new Date(log.stages.startCooling.time) : log.stages.startCooling.time,
        },
        to80: {
          ...log.stages.to80,
          time: log.stages.to80.time ? new Date(log.stages.to80.time) : log.stages.to80.time,
        },
        to54: {
          ...log.stages.to54,
          time: log.stages.to54.time ? new Date(log.stages.to54.time) : log.stages.to54.time,
        },
        finalChill: {
          ...log.stages.finalChill,
          time: log.stages.finalChill.time ? new Date(log.stages.finalChill.time) : log.stages.finalChill.time,
        },
      },
    };
    
    await db.put('logs', logWithDates);
  }

  async getLogs(): Promise<LogEntry[]> {
    const db = await this.init();
    return await db.getAll('logs');
  }

  async getLog(id: string): Promise<LogEntry | undefined> {
    const db = await this.init();
    return await db.get('logs', id);
  }

  async deleteLog(id: string): Promise<void> {
    const db = await this.init();
    await db.delete('logs', id);
  }

  async clearAllLogs(): Promise<void> {
    const db = await this.init();
    await db.clear('logs');
  }

  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    const db = await this.init();
    const range = IDBKeyRange.bound(startDate, endDate);
    return await db.getAllFromIndex('logs', 'by-date', range);
  }

  async getTodaysLogs(): Promise<LogEntry[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return await this.getLogsByDateRange(startOfDay, endOfDay);
  }
}

// Hybrid storage manager that tries AWS first, falls back to local
class HybridStorageManager {
  private localManager = new LocalStorageManager();
  private useAWS = true;

  private async tryAWS<T>(operation: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
    if (!this.useAWS) {
      return fallback();
    }

    try {
      return await operation();
    } catch (error) {
      console.warn('AWS operation failed, falling back to local storage:', error);
      this.useAWS = false; // Disable AWS for this session
      return fallback();
    }
  }

  async saveLogs(logs: LogEntry[]): Promise<void> {
    return this.tryAWS(
      () => awsStorageManager.saveLogs(logs),
      () => this.localManager.saveLogs(logs)
    );
  }

  async saveLog(log: LogEntry): Promise<void> {
    return this.tryAWS(
      () => awsStorageManager.saveLog(log),
      () => this.localManager.saveLog(log)
    );
  }

  async getLogs(): Promise<LogEntry[]> {
    return this.tryAWS(
      () => awsStorageManager.getLogs(),
      () => this.localManager.getLogs()
    );
  }

  async getLog(id: string): Promise<LogEntry | undefined> {
    return this.tryAWS(
      () => awsStorageManager.getLog(id),
      () => this.localManager.getLog(id)
    );
  }

  async deleteLog(id: string): Promise<void> {
    return this.tryAWS(
      () => awsStorageManager.deleteLog(id),
      () => this.localManager.deleteLog(id)
    );
  }

  async clearAllLogs(): Promise<void> {
    return this.tryAWS(
      () => awsStorageManager.clearAllLogs(),
      () => this.localManager.clearAllLogs()
    );
  }

  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    return this.tryAWS(
      () => awsStorageManager.getLogsByDateRange(startDate, endDate),
      () => this.localManager.getLogsByDateRange(startDate, endDate)
    );
  }

  async getTodaysLogs(): Promise<LogEntry[]> {
    return this.tryAWS(
      () => awsStorageManager.getTodaysLogs(),
      () => this.localManager.getTodaysLogs()
    );
  }

  // AWS-specific methods (fallback to mock data for local)
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    if (this.useAWS) {
      try {
        return await awsStorageManager.createUser(user);
      } catch (error) {
        console.warn('AWS user creation failed:', error);
        this.useAWS = false;
      }
    }

    // Return mock user for local fallback
    return {
      id: `mock-${Date.now()}`,
      ...user
    };
  }

  async getUsers(): Promise<User[]> {
    return this.tryAWS(
      () => awsStorageManager.getUsers(),
      async () => {
        // Return mock users for local fallback
        const { MOCK_USERS } = await import('./types');
        return MOCK_USERS;
      }
    );
  }

  async createInitialEntry(entry: Omit<InitialEntry, 'id' | 'createdAt'>): Promise<InitialEntry> {
    if (this.useAWS) {
      try {
        return await awsStorageManager.createInitialEntry(entry);
      } catch (error) {
        console.warn('AWS initial entry creation failed:', error);
        this.useAWS = false;
      }
    }

    // Return mock entry for local fallback
    return {
      id: `mock-${Date.now()}`,
      createdAt: new Date(),
      ...entry
    };
  }

  async getInitialEntries(): Promise<InitialEntry[]> {
    return this.tryAWS(
      () => awsStorageManager.getInitialEntries(),
      async () => {
        // Return mock entries for local fallback
        const { MOCK_INITIALS } = await import('./types');
        return MOCK_INITIALS;
      }
    );
  }

  // Check if we're using AWS or local storage
  isUsingAWS(): boolean {
    return this.useAWS;
  }

  // Force re-enable AWS (for testing purposes)
  enableAWS(): void {
    this.useAWS = true;
  }
}

export const storageManager = new HybridStorageManager();
