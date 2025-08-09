import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { LogEntry } from './types';

interface FoodLogDB extends DBSchema {
  logs: {
    key: string;
    value: LogEntry;
    indexes: { 'by-date': Date };
  };
}

class StorageManager {
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
    
    // Convert dates to proper Date objects before saving
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
    
    // Convert dates to proper Date objects before saving
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

  // Get logs by date range
  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    const db = await this.init();
    const range = IDBKeyRange.bound(startDate, endDate);
    return await db.getAllFromIndex('logs', 'by-date', range);
  }

  // Get today's logs
  async getTodaysLogs(): Promise<LogEntry[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return await this.getLogsByDateRange(startOfDay, endOfDay);
  }
}

export const storageManager = new StorageManager();
