import { generateClient } from 'aws-amplify/api';
import { GraphQLResult } from '@aws-amplify/api-graphql';
import { type LogEntry, type User, type InitialEntry, type StageType } from './types';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

// AWS API Client
const client = generateClient();

// Convert GraphQL stage names to frontend stage names
const stageMapping: Record<StageType, string> = {
  'cook': 'COOK',
  'startCooling': 'START_COOLING',
  'to80': 'TO_80',
  'to54': 'TO_54',
  'finalChill': 'FINAL_CHILL'
};

// Convert frontend stage names to GraphQL stage names
const reverseStageMapping: Record<string, StageType> = {
  'COOK': 'cook',
  'START_COOLING': 'startCooling',
  'TO_80': 'to80',
  'TO_54': 'to54',
  'FINAL_CHILL': 'finalChill'
};

// Map frontend LogEntry to GraphQL input
function mapLogEntryToGraphQLInput(log: LogEntry): any {
  return {
    id: log.id,
    date: log.date.toISOString(),
    shift: log.shift.toUpperCase(),
    product: log.product,
    productCode: log.productCode,
    supplier: log.supplier,
    receivedDate: log.receivedDate?.toISOString(),
    expirationDate: log.expirationDate?.toISOString(),
    thermometerNumber: log.thermometerNumber,
    lotNumber: log.lotNumber,
    batchSize: log.batchSize,
    packagingType: log.packagingType,
    employeeId: log.employeeId,
    employeeName: log.employeeName,
    employeeInitials: log.employeeInitials,
    supervisorInitials: log.supervisorInitials,
    
    // Stage data
    cookStage: log.stages.cook.temperature ? {
      temperature: log.stages.cook.temperature,
      time: log.stages.cook.time?.toISOString(),
      isValid: log.stages.cook.isValid,
      correctiveAction: log.stages.cook.correctiveAction,
      employeeInitials: log.stages.cook.employeeInitials,
      notes: log.stages.cook.notes
    } : null,
    
    startCoolingStage: log.stages.startCooling.temperature ? {
      temperature: log.stages.startCooling.temperature,
      time: log.stages.startCooling.time?.toISOString(),
      isValid: log.stages.startCooling.isValid,
      correctiveAction: log.stages.startCooling.correctiveAction,
      employeeInitials: log.stages.startCooling.employeeInitials,
      notes: log.stages.startCooling.notes
    } : null,
    
    to80Stage: log.stages.to80.temperature ? {
      temperature: log.stages.to80.temperature,
      time: log.stages.to80.time?.toISOString(),
      isValid: log.stages.to80.isValid,
      correctiveAction: log.stages.to80.correctiveAction,
      employeeInitials: log.stages.to80.employeeInitials,
      notes: log.stages.to80.notes
    } : null,
    
    to54Stage: log.stages.to54.temperature ? {
      temperature: log.stages.to54.temperature,
      time: log.stages.to54.time?.toISOString(),
      isValid: log.stages.to54.isValid,
      correctiveAction: log.stages.to54.correctiveAction,
      employeeInitials: log.stages.to54.employeeInitials,
      notes: log.stages.to54.notes
    } : null,
    
    finalChillStage: log.stages.finalChill.temperature ? {
      temperature: log.stages.finalChill.temperature,
      time: log.stages.finalChill.time?.toISOString(),
      isValid: log.stages.finalChill.isValid,
      correctiveAction: log.stages.finalChill.correctiveAction,
      employeeInitials: log.stages.finalChill.employeeInitials,
      notes: log.stages.finalChill.notes
    } : null,
    
    // HACCP
    ccp1Verified: log.haccp.ccp1Verified,
    ccp2Verified: log.haccp.ccp2Verified,
    monitoringCompleted: log.haccp.monitoringCompleted,
    correctiveActionsDocumented: log.haccp.correctiveActionsDocumented,
    
    // Visual inspection
    visualInspectionColor: log.visualInspection.color.toUpperCase(),
    visualInspectionTexture: log.visualInspection.texture.toUpperCase(),
    visualInspectionOdor: log.visualInspection.odor.toUpperCase(),
    visualInspectionNotes: log.visualInspection.notes,
    
    // Storage
    storageLocation: log.storageLocation,
    storageTemperature: log.storageTemperature,
    storageTime: log.storageTime?.toISOString(),
    
    // Workflow
    currentStage: stageMapping[log.currentStage],
    isComplete: log.isComplete,
    requiresReview: log.requiresReview,
    isApproved: log.isApproved,
    adminComments: log.adminComments,
    reviewedBy: log.reviewedBy,
    reviewDate: log.reviewDate?.toISOString(),
    
    // Compliance
    complianceIssues: log.complianceIssues,
    riskLevel: log.riskLevel.toUpperCase(),
    
    // Signatures
    employeeSignature: log.employeeSignature,
    supervisorSignature: log.supervisorSignature,
    adminSignature: log.adminSignature,
    completedAt: log.completedAt?.toISOString(),
    submittedAt: log.submittedAt?.toISOString(),
    
    // Additional
    photos: log.photos,
    attachments: log.attachments,
    notes: log.notes
  };
}

// Map GraphQL result to frontend LogEntry
function mapGraphQLResultToLogEntry(result: any): LogEntry {
  return {
    id: result.id,
    date: new Date(result.date),
    shift: result.shift.toLowerCase() as any,
    
    // Product info
    product: result.product,
    productCode: result.productCode,
    supplier: result.supplier,
    receivedDate: result.receivedDate ? new Date(result.receivedDate) : undefined,
    expirationDate: result.expirationDate ? new Date(result.expirationDate) : undefined,
    thermometerNumber: result.thermometerNumber,
    lotNumber: result.lotNumber,
    batchSize: result.batchSize,
    packagingType: result.packagingType,
    
    // Employee info
    employeeId: result.employeeId,
    employeeName: result.employeeName,
    employeeInitials: result.employeeInitials,
    supervisorInitials: result.supervisorInitials,
    
    // Stages
    stages: {
      cook: {
        temperature: result.cookStage?.temperature,
        time: result.cookStage?.time ? new Date(result.cookStage.time) : undefined,
        isValid: result.cookStage?.isValid,
        correctiveAction: result.cookStage?.correctiveAction,
        employeeInitials: result.cookStage?.employeeInitials,
        notes: result.cookStage?.notes
      },
      startCooling: {
        temperature: result.startCoolingStage?.temperature,
        time: result.startCoolingStage?.time ? new Date(result.startCoolingStage.time) : undefined,
        isValid: result.startCoolingStage?.isValid,
        correctiveAction: result.startCoolingStage?.correctiveAction,
        employeeInitials: result.startCoolingStage?.employeeInitials,
        notes: result.startCoolingStage?.notes
      },
      to80: {
        temperature: result.to80Stage?.temperature,
        time: result.to80Stage?.time ? new Date(result.to80Stage.time) : undefined,
        isValid: result.to80Stage?.isValid,
        correctiveAction: result.to80Stage?.correctiveAction,
        employeeInitials: result.to80Stage?.employeeInitials,
        notes: result.to80Stage?.notes
      },
      to54: {
        temperature: result.to54Stage?.temperature,
        time: result.to54Stage?.time ? new Date(result.to54Stage.time) : undefined,
        isValid: result.to54Stage?.isValid,
        correctiveAction: result.to54Stage?.correctiveAction,
        employeeInitials: result.to54Stage?.employeeInitials,
        notes: result.to54Stage?.notes
      },
      finalChill: {
        temperature: result.finalChillStage?.temperature,
        time: result.finalChillStage?.time ? new Date(result.finalChillStage.time) : undefined,
        isValid: result.finalChillStage?.isValid,
        correctiveAction: result.finalChillStage?.correctiveAction,
        employeeInitials: result.finalChillStage?.employeeInitials,
        notes: result.finalChillStage?.notes
      }
    },
    
    // HACCP
    haccp: {
      ccp1Verified: result.ccp1Verified,
      ccp2Verified: result.ccp2Verified,
      monitoringCompleted: result.monitoringCompleted,
      correctiveActionsDocumented: result.correctiveActionsDocumented
    },
    
    // Visual inspection
    visualInspection: {
      color: result.visualInspectionColor?.toLowerCase() as any || 'normal',
      texture: result.visualInspectionTexture?.toLowerCase() as any || 'normal',
      odor: result.visualInspectionOdor?.toLowerCase() as any || 'normal',
      notes: result.visualInspectionNotes
    },
    
    // Storage
    storageLocation: result.storageLocation,
    storageTemperature: result.storageTemperature,
    storageTime: result.storageTime ? new Date(result.storageTime) : undefined,
    
    // Workflow
    currentStage: reverseStageMapping[result.currentStage] || 'cook',
    isComplete: result.isComplete,
    requiresReview: result.requiresReview,
    isApproved: result.isApproved,
    adminComments: result.adminComments,
    reviewedBy: result.reviewedBy,
    reviewDate: result.reviewDate ? new Date(result.reviewDate) : undefined,
    
    // Compliance
    complianceIssues: result.complianceIssues || [],
    riskLevel: result.riskLevel?.toLowerCase() as any || 'low',
    
    // Signatures
    employeeSignature: result.employeeSignature,
    supervisorSignature: result.supervisorSignature,
    adminSignature: result.adminSignature,
    completedAt: result.completedAt ? new Date(result.completedAt) : undefined,
    submittedAt: result.submittedAt ? new Date(result.submittedAt) : undefined,
    
    // Additional
    photos: result.photos || [],
    attachments: result.attachments || [],
    notes: result.notes
  };
}

class AWSStorageManager {
  // Log Entry Methods
  async saveLog(log: LogEntry): Promise<void> {
    try {
      const input = mapLogEntryToGraphQLInput(log);
      
      // Check if log exists
      const existingLog = await this.getLog(log.id);
      
      if (existingLog) {
        // Update existing log
        await client.graphql({
          query: mutations.updateLogEntry,
          variables: { input }
        });
      } else {
        // Create new log
        await client.graphql({
          query: mutations.createLogEntry,
          variables: { input }
        });
      }
    } catch (error) {
      console.error('Error saving log:', error);
      throw error;
    }
  }

  async saveLogs(logs: LogEntry[]): Promise<void> {
    try {
      // Save logs one by one (could be optimized with batch operations)
      await Promise.all(logs.map(log => this.saveLog(log)));
    } catch (error) {
      console.error('Error saving logs:', error);
      throw error;
    }
  }

  async getLog(id: string): Promise<LogEntry | undefined> {
    try {
      const result = await client.graphql({
        query: queries.getLogEntry,
        variables: { id }
      }) as GraphQLResult<any>;

      if (result.data?.getLogEntry) {
        return mapGraphQLResultToLogEntry(result.data.getLogEntry);
      }
      return undefined;
    } catch (error) {
      console.error('Error getting log:', error);
      return undefined;
    }
  }

  async getLogs(): Promise<LogEntry[]> {
    try {
      const result = await client.graphql({
        query: queries.listLogEntries
      }) as GraphQLResult<any>;

      if (result.data?.listLogEntries?.items) {
        return result.data.listLogEntries.items.map(mapGraphQLResultToLogEntry);
      }
      return [];
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  async deleteLog(id: string): Promise<void> {
    try {
      await client.graphql({
        query: mutations.deleteLogEntry,
        variables: { input: { id } }
      });
    } catch (error) {
      console.error('Error deleting log:', error);
      throw error;
    }
  }

  async clearAllLogs(): Promise<void> {
    try {
      const logs = await this.getLogs();
      await Promise.all(logs.map(log => this.deleteLog(log.id)));
    } catch (error) {
      console.error('Error clearing all logs:', error);
      throw error;
    }
  }

  // Date-based queries
  async getLogsByDateRange(startDate: Date, endDate: Date): Promise<LogEntry[]> {
    try {
      const result = await client.graphql({
        query: queries.getLogsByDateRange,
        variables: { 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        }
      }) as GraphQLResult<any>;

      if (result.data?.getLogsByDateRange) {
        return result.data.getLogsByDateRange.map(mapGraphQLResultToLogEntry);
      }
      return [];
    } catch (error) {
      console.error('Error getting logs by date range:', error);
      return [];
    }
  }

  async getTodaysLogs(): Promise<LogEntry[]> {
    try {
      const result = await client.graphql({
        query: queries.getTodaysLogs
      }) as GraphQLResult<any>;

      if (result.data?.getTodaysLogs) {
        return result.data.getTodaysLogs.map(mapGraphQLResultToLogEntry);
      }
      return [];
    } catch (error) {
      console.error('Error getting todays logs:', error);
      return [];
    }
  }

  // User Methods
  async createUser(user: Omit<User, 'id'>): Promise<User> {
    try {
      const result = await client.graphql({
        query: mutations.createUser,
        variables: {
          input: {
            initials: user.initials,
            name: user.name,
            role: user.role.toUpperCase(),
            certificationNumber: user.certificationNumber,
            email: user.email,
            isActive: true
          }
        }
      }) as GraphQLResult<any>;

      return result.data.createUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async getUsers(): Promise<User[]> {
    try {
      const result = await client.graphql({
        query: queries.listUsers
      }) as GraphQLResult<any>;

      if (result.data?.listUsers?.items) {
        return result.data.listUsers.items.map((user: any) => ({
          ...user,
          role: user.role.toLowerCase()
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting users:', error);
      return [];
    }
  }

  // Initial Entry Methods
  async createInitialEntry(entry: Omit<InitialEntry, 'id' | 'createdAt'>): Promise<InitialEntry> {
    try {
      const result = await client.graphql({
        query: mutations.createInitialEntry,
        variables: {
          input: {
            initials: entry.initials,
            name: entry.name,
            isActive: entry.isActive,
            createdBy: entry.createdBy
          }
        }
      }) as GraphQLResult<any>;

      return {
        ...result.data.createInitialEntry,
        createdAt: new Date(result.data.createInitialEntry.createdAt)
      };
    } catch (error) {
      console.error('Error creating initial entry:', error);
      throw error;
    }
  }

  async getInitialEntries(): Promise<InitialEntry[]> {
    try {
      const result = await client.graphql({
        query: queries.listInitialEntries
      }) as GraphQLResult<any>;

      if (result.data?.listInitialEntries?.items) {
        return result.data.listInitialEntries.items.map((entry: any) => ({
          ...entry,
          createdAt: new Date(entry.createdAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error getting initial entries:', error);
      return [];
    }
  }

  async updateInitialEntry(entry: InitialEntry): Promise<InitialEntry> {
    try {
      const result = await client.graphql({
        query: mutations.updateInitialEntry,
        variables: {
          input: {
            id: entry.id,
            initials: entry.initials,
            name: entry.name,
            isActive: entry.isActive,
            createdBy: entry.createdBy
          }
        }
      }) as GraphQLResult<any>;

      return {
        ...result.data.updateInitialEntry,
        createdAt: new Date(result.data.updateInitialEntry.createdAt)
      };
    } catch (error) {
      console.error('Error updating initial entry:', error);
      throw error;
    }
  }

  // Workflow Methods
  async updateLogEntryStage(logEntryId: string, stage: StageType, stageData: any): Promise<LogEntry> {
    try {
      const result = await client.graphql({
        query: mutations.updateLogEntryStage,
        variables: {
          logEntryId,
          stage: stageMapping[stage],
          stageData: {
            temperature: stageData.temperature,
            time: stageData.time?.toISOString(),
            isValid: stageData.isValid,
            correctiveAction: stageData.correctiveAction,
            employeeInitials: stageData.employeeInitials,
            notes: stageData.notes
          }
        }
      }) as GraphQLResult<any>;

      return mapGraphQLResultToLogEntry(result.data.updateLogEntryStage);
    } catch (error) {
      console.error('Error updating log entry stage:', error);
      throw error;
    }
  }

  async submitLogEntryForReview(logEntryId: string): Promise<LogEntry> {
    try {
      const result = await client.graphql({
        query: mutations.submitLogEntryForReview,
        variables: { logEntryId }
      }) as GraphQLResult<any>;

      return mapGraphQLResultToLogEntry(result.data.submitLogEntryForReview);
    } catch (error) {
      console.error('Error submitting log entry for review:', error);
      throw error;
    }
  }

  async approveLogEntry(logEntryId: string, adminComments?: string, adminSignature?: string): Promise<LogEntry> {
    try {
      const result = await client.graphql({
        query: mutations.approveLogEntry,
        variables: { logEntryId, adminComments, adminSignature }
      }) as GraphQLResult<any>;

      return mapGraphQLResultToLogEntry(result.data.approveLogEntry);
    } catch (error) {
      console.error('Error approving log entry:', error);
      throw error;
    }
  }
}

export const awsStorageManager = new AWSStorageManager();
