import { generateClient } from 'aws-amplify/api';
import { GraphQLResult } from '@aws-amplify/api-graphql';
import { type LogEntry, type User, type InitialEntry, type StageType } from './types';
import { type PaperFormEntry, FormType, ensureDate } from './paperFormTypes';
import * as queries from '../graphql/queries';
import * as mutations from '../graphql/mutations';

// AWS API Client
const client = generateClient();

// Helper function to convert time string (HH:MM) to DateTime
function convertTimeStringToDateTime(timeString: string, baseDate: Date): string | null {
  if (!timeString || !baseDate) return null;
  
  try {
    const [hours, minutes] = timeString.split(':').map(Number);
    const dateTime = new Date(baseDate);
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime.toISOString();
  } catch (error) {
    console.warn('Failed to convert time string to DateTime:', timeString, error);
    return null;
  }
}

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

// Map frontend PaperFormEntry to GraphQL input
function mapPaperFormEntryToGraphQLInput(form: PaperFormEntry): any {
  return {
    id: form.id,
    date: ensureDate(form.date).toISOString(),
    dateCreated: ensureDate(form.dateCreated || form.date).toISOString(),
    lastTextEntry: ensureDate(form.lastTextEntry || form.date).toISOString(),
    formType: form.formType,
    formInitial: form.formInitial,
    status: form.status.toUpperCase().replace(' ', '_'),
    title: form.title,
    entries: form.entries.filter(entry => entry && typeof entry === 'object' && entry.type !== undefined).map(entry => ({
      type: entry.type,
      rack: entry.rack || '1st Rack',
      // Map all stage data
      heatTreating: entry.heatTreating ? {
        temperature: entry.heatTreating.temp ? parseFloat(entry.heatTreating.temp) : null,
        time: entry.heatTreating.time ? convertTimeStringToDateTime(entry.heatTreating.time, form.date) : null,
        isValid: true,
        correctiveAction: '',
        employeeInitials: entry.heatTreating.initial || '',
        notes: '',
        dataLog: false
      } : null,
      ccp2_126: entry.ccp2_126 ? {
        temperature: entry.ccp2_126.temp ? parseFloat(entry.ccp2_126.temp) : null,
        time: entry.ccp2_126.time ? convertTimeStringToDateTime(entry.ccp2_126.time, form.date) : null,
        isValid: true,
        correctiveAction: '',
        employeeInitials: entry.ccp2_126.initial || '',
        notes: '',
        dataLog: false
      } : null,
      ccp2_80: entry.ccp2_80 ? {
        temperature: entry.ccp2_80.temp ? parseFloat(entry.ccp2_80.temp) : null,
        time: entry.ccp2_80.time ? convertTimeStringToDateTime(entry.ccp2_80.time, form.date) : null,
        isValid: true,
        correctiveAction: '',
        employeeInitials: entry.ccp2_80.initial || '',
        notes: '',
        dataLog: false
      } : null,
      ccp2_55: entry.ccp2_55 ? {
        temperature: entry.ccp2_55.temp ? parseFloat(entry.ccp2_55.temp) : null,
        time: entry.ccp2_55.time ? convertTimeStringToDateTime(entry.ccp2_55.time, form.date) : null,
        isValid: true,
        correctiveAction: '',
        employeeInitials: entry.ccp2_55.initial || '',
        notes: '',
        dataLog: false
      } : null,
      ccp1: entry.ccp1 ? {
        temperature: entry.ccp1.temp ? parseFloat(entry.ccp1.temp) : null,
        time: entry.ccp1.time ? convertTimeStringToDateTime(entry.ccp1.time, form.date) : null,
        isValid: entry.ccp1.dataLog || false,
        correctiveAction: '',
        employeeInitials: entry.ccp1.initial || '',
        notes: '',
        dataLog: entry.ccp1.dataLog || false
      } : null,
      ccp2: entry.ccp2 ? {
        temperature: entry.ccp2.temp ? parseFloat(entry.ccp2.temp) : null,
        time: entry.ccp2.time ? convertTimeStringToDateTime(entry.ccp2.time, form.date) : null,
        isValid: entry.ccp2.dataLog || false,
        correctiveAction: '',
        employeeInitials: entry.ccp2.initial || '',
        notes: '',
        dataLog: entry.ccp2.dataLog || false
      } : null,
      coolingTo80: entry.coolingTo80 ? {
        temperature: entry.coolingTo80.temp ? parseFloat(entry.coolingTo80.temp) : null,
        time: entry.coolingTo80.time ? convertTimeStringToDateTime(entry.coolingTo80.time, form.date) : null,
        isValid: entry.coolingTo80.dataLog || false,
        correctiveAction: '',
        employeeInitials: entry.coolingTo80.initial || '',
        notes: '',
        dataLog: entry.coolingTo80.dataLog || false
      } : null,
      coolingTo54: entry.coolingTo54 ? {
        temperature: entry.coolingTo54.temp ? parseFloat(entry.coolingTo54.temp) : null,
        time: entry.coolingTo54.time ? convertTimeStringToDateTime(entry.coolingTo54.time, form.date) : null,
        isValid: entry.coolingTo54.dataLog || false,
        correctiveAction: '',
        employeeInitials: entry.coolingTo54.initial || '',
        notes: '',
        dataLog: entry.coolingTo54.dataLog || false
      } : null,
      finalChill: entry.finalChill ? {
        temperature: entry.finalChill.temp ? parseFloat(entry.finalChill.temp) : null,
        time: entry.finalChill.time ? convertTimeStringToDateTime(entry.finalChill.time, form.date) : null,
        isValid: entry.finalChill.dataLog || false,
        correctiveAction: '',
        employeeInitials: entry.finalChill.initial || '',
        notes: '',
        dataLog: entry.finalChill.dataLog || false
      } : null
    })),
    thermometerNumber: form.thermometerNumber || '',
    ingredients: JSON.stringify(form.ingredients || { beef: '', chicken: '', liquidEggs: '' }),
    lotNumbers: JSON.stringify(form.lotNumbers || { beef: '', chicken: '', liquidEggs: '' }),
    correctiveActionsComments: form.correctiveActionsComments,
    // For Piroshki form - Quantity and Flavor
    quantityAndFlavor: form.quantityAndFlavor ? JSON.stringify(form.quantityAndFlavor) : null,
    
    // For Piroshki form - Pre Shipment Review
    preShipmentReview: form.preShipmentReview ? {
      date: form.preShipmentReview.date,
      initials: form.preShipmentReview.initials,
      results: form.preShipmentReview.results
    } : null,
    
    // For Bagel Dog form - Frank Flavor/Size Table
    frankFlavorSizeTable: form.frankFlavorSizeTable ? JSON.stringify(form.frankFlavorSizeTable) : null,
    
    // For Bagel Dog form - Pre Shipment Review
    bagelDogPreShipmentReview: form.bagelDogPreShipmentReview ? {
      date: form.bagelDogPreShipmentReview.date,
      results: form.bagelDogPreShipmentReview.results,
      signature: form.bagelDogPreShipmentReview.signature
    } : null,
    
    adminComments: form.adminComments?.filter(comment => comment && comment.id && comment.adminInitial && comment.comment)?.map(comment => ({
      id: comment.id,
      adminInitial: comment.adminInitial,
      timestamp: ensureDate(comment.timestamp).toISOString(),
      comment: comment.comment
    })) || [],
    resolvedErrors: form.resolvedErrors?.filter(error => error && typeof error === 'string') || []
  };
}

// Map GraphQL result to frontend PaperFormEntry
function mapGraphQLResultToPaperFormEntry(result: any): PaperFormEntry {
  // Map status from database values to frontend values
  let mappedStatus: 'Complete' | 'In Progress' | 'Error';
  if (!result.status) {
    mappedStatus = 'In Progress'; // Default for null/undefined status
  } else if (result.status === 'COMPLETE') {
    mappedStatus = 'Complete';
  } else if (result.status === 'In_Progress') {
    mappedStatus = 'In Progress';
  } else if (result.status === 'ERROR') {
    mappedStatus = 'Error';
  } else {
    // Handle any other status values by converting to title case
    mappedStatus = result.status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) as any;
  }

  return {
    id: result.id,
    date: new Date(result.date),
    dateCreated: result.dateCreated ? new Date(result.dateCreated) : new Date(result.date), // Fallback to date if not available
    lastTextEntry: result.lastTextEntry ? new Date(result.lastTextEntry) : new Date(result.date), // Fallback to date if not available
    formType: result.formType as FormType,
    formInitial: result.formInitial,
    status: mappedStatus,
    title: result.title || '',
    entries: (result.entries || []).map((entry: any) => ({
      type: entry.type || '',
      rack: entry.rack || '1st Rack',
      ccp1: {
        temp: entry.ccp1?.temperature?.toString() || '',
        time: entry.ccp1?.time || '',
        initial: entry.ccp1?.employeeInitials || '',
        dataLog: entry.ccp1?.dataLog || false
      },
      ccp2: {
        temp: entry.ccp2?.temperature?.toString() || '',
        time: entry.ccp2?.time || '',
        initial: entry.ccp2?.employeeInitials || '',
        dataLog: entry.ccp2?.dataLog || false
      },
      coolingTo80: {
        temp: entry.coolingTo80?.temperature?.toString() || '',
        time: entry.coolingTo80?.time || '',
        initial: entry.coolingTo80?.employeeInitials || '',
        dataLog: entry.coolingTo80?.dataLog || false
      },
      coolingTo54: {
        temp: entry.coolingTo54?.temperature?.toString() || '',
        time: entry.coolingTo54?.time || '',
        initial: entry.coolingTo54?.employeeInitials || '',
        dataLog: entry.coolingTo54?.dataLog || false
      },
      finalChill: {
        temp: entry.finalChill?.temperature?.toString() || '',
        time: entry.finalChill?.time || '',
        initial: entry.finalChill?.employeeInitials || '',
        dataLog: entry.finalChill?.dataLog || false
      }
    })),
    thermometerNumber: result.thermometerNumber || '',
    ingredients: result.ingredients || { beef: '', chicken: '', liquidEggs: '' },
    lotNumbers: result.lotNumbers || { beef: '', chicken: '', liquidEggs: '' },
    correctiveActionsComments: result.correctiveActionsComments || '',
    adminComments: result.adminComments?.map((comment: any) => ({
      id: comment.id,
      adminInitial: comment.adminInitial,
      timestamp: new Date(comment.timestamp),
      comment: comment.comment
    })) || [],
    resolvedErrors: result.resolvedErrors || []
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
  // Helper method to convert time string (HH:MM) to DateTime
  private convertTimeStringToDateTime(timeString: string, baseDate: Date): string | null {
    if (!timeString || !baseDate) return null;
    
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const dateTime = new Date(baseDate);
      dateTime.setHours(hours, minutes, 0, 0);
      return dateTime.toISOString();
    } catch (error) {
      console.warn('Failed to convert time string to DateTime:', timeString, error);
      return null;
    }
  }

  // Test AWS connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing AWS connection...');
      
      // Try a simple query to test connection
      const result = await client.graphql({
        query: queries.listPaperFormEntries,
        variables: { limit: 1 }
      }) as GraphQLResult<any>;
      
      console.log('AWS connection test successful');
      
      // Test if mutations are accessible
      if (mutations.createPaperFormEntry) {
        console.log('✅ Mutations are available');
      } else {
        console.log('❌ Mutations are not available');
      }
      
      return true;
    } catch (error) {
      console.error('AWS connection test failed:', error);
      return false;
    }
  }

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

  // Paper Form Methods
  async savePaperForm(form: PaperFormEntry): Promise<void> {
    try {
      // Validate form data before mapping
      if (!form || !form.entries || !Array.isArray(form.entries)) {
        throw new Error('Invalid form data: missing or invalid entries array');
      }
      
      console.log('=== FORM SAVE DEBUG ===');
      console.log('Form ID:', form.id);
      console.log('Form type:', form.formType);
      console.log('Form entries count:', form.entries.length);
      console.log('Form entries:', form.entries);
      console.log('Form has title:', !!form.title);
      console.log('Form has initial:', !!form.formInitial);
      
      const input = mapPaperFormEntryToGraphQLInput(form);
      console.log('Saving form to AWS DynamoDB:', { id: form.id, type: form.formType, status: form.status });
      
      // Check if form exists
      const existingForm = await this.getPaperForm(form.id);
      
      if (existingForm) {
        // Update existing form
        console.log('=== UPDATE FORM ===');
        console.log('Form ID:', form.id);
        console.log('Mutation available:', !!mutations.updatePaperFormEntry);
        console.log('Mutation type:', typeof mutations.updatePaperFormEntry);
        console.log('Input structure:', {
          id: input.id,
          date: input.date,
          formType: input.formType,
          entriesCount: input.entries?.length,
          hasEntries: !!input.entries
        });
        
        try {
          const result = await client.graphql({
            query: mutations.updatePaperFormEntry,
            variables: { input }
          }) as GraphQLResult<any>;
                  // Check for GraphQL errors in the result
        if (result.errors && result.errors.length > 0) {
          console.error('GraphQL errors in update result:', result.errors);
          throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
        }
      } catch (graphqlError) {
        console.error('GraphQL update failed:', graphqlError);
        throw graphqlError;
      }
    } else {
      // Create new form
      try {
        // Log the input data before making the GraphQL call
        console.log('=== GRAPHQL CREATE INPUT ===');
        console.log('Input ID:', input.id);
        console.log('Input formType:', input.formType);
        console.log('Input status:', input.status);
        console.log('Input entries count:', input.entries?.length);
        console.log('Input keys:', Object.keys(input));
        
        // Check for any problematic values
        const problematicFields: string[] = [];
        Object.entries(input).forEach(([key, value]) => {
          if (value === null || value === undefined) {
            problematicFields.push(`${key}: ${value}`);
          }
        });
        if (problematicFields.length > 0) {
          console.log('⚠️ Input contains null/undefined fields:', problematicFields);
        }
        
        // Validate required fields according to GraphQL schema
        const requiredFields = ['date', 'dateCreated', 'lastTextEntry', 'formType', 'formInitial', 'status', 'entries'];
        const missingFields = requiredFields.filter(field => !input[field]);
        if (missingFields.length > 0) {
          console.log('❌ Missing required fields:', missingFields);
        }
        
        // Validate entries array
        if (!Array.isArray(input.entries) || input.entries.length === 0) {
          console.log('❌ Entries must be a non-empty array');
        }
        
        // Validate each entry has required fields
        input.entries?.forEach((entry: any, index: number) => {
          if (!entry.type || !entry.rack) {
            console.log(`⚠️ Entry ${index} missing type or rack:`, entry);
          }
        });
        
        // For create operations, remove the id field since it's optional in the schema
        const createInput = { ...input };
        delete createInput.id;
        
        console.log('Create input without ID:', createInput);
        
        const result = await client.graphql({
          query: mutations.createPaperFormEntry,
          variables: { input: createInput }
        }) as GraphQLResult<any>;
        
        // Check for GraphQL errors in the result
        if (result.errors && result.errors.length > 0) {
          console.error('GraphQL errors in create result:', result.errors);
          throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join(', ')}`);
        }
      } catch (graphqlError) {
          // Log detailed error information before Next.js devtools can intercept it
          console.log('=== GRAPHQL CREATE ERROR DETAILS ===');
          console.log('Error type:', typeof graphqlError);
          console.log('Error constructor:', graphqlError?.constructor?.name);
          
          if (graphqlError instanceof Error) {
            console.log('Error name:', graphqlError.name);
            console.log('Error message:', graphqlError.message);
            console.log('Error stack:', graphqlError.stack);
          }
          
          // Try to extract GraphQL-specific error information
          if (graphqlError && typeof graphqlError === 'object') {
            const errorObj = graphqlError as any;
            console.log('Error object keys:', Object.keys(errorObj));
            
            if (errorObj.errors) {
              console.log('GraphQL errors:', errorObj.errors);
            }
            if (errorObj.message) {
              console.log('Error message:', errorObj.message);
            }
            if (errorObj.extensions) {
              console.log('Error extensions:', errorObj.extensions);
            }
            if (errorObj.cause) {
              console.log('Error cause:', errorObj.cause);
            }
            
            // Log the full error object as a string
            try {
              console.log('Full error object:', JSON.stringify(errorObj, null, 2));
            } catch (stringifyError) {
              console.log('Could not stringify error object:', stringifyError);
            }
          }
          
          console.error('GraphQL create failed:', graphqlError);
          throw graphqlError;
        }
      }
    } catch (error) {
      console.error('Failed to save paper form:', error);
      throw error;
    }
  }

  async savePaperForms(forms: PaperFormEntry[]): Promise<void> {
    try {
      // Save forms one by one (could be optimized with batch operations)
      await Promise.all(forms.map(form => this.savePaperForm(form)));
    } catch (error) {
      console.error('Error saving paper forms:', error);
      throw error;
    }
  }

  async getPaperForm(id: string): Promise<PaperFormEntry | undefined> {
    try {
      const result = await client.graphql({
        query: queries.getPaperFormEntry,
        variables: { id }
      }) as GraphQLResult<any>;

      if (result.data?.getPaperFormEntry) {
        return mapGraphQLResultToPaperFormEntry(result.data.getPaperFormEntry);
      }
      return undefined;
    } catch (error) {
      console.error('Error getting paper form:', error);
      return undefined;
    }
  }

  async getPaperForms(): Promise<PaperFormEntry[]> {
    try {
      const result = await client.graphql({
        query: queries.listPaperFormEntries
      }) as GraphQLResult<any>;

      if (result.data?.listPaperFormEntries?.items) {
        const forms = result.data.listPaperFormEntries.items.map(mapGraphQLResultToPaperFormEntry);
        console.log('Successfully mapped forms:', forms);
        return forms;
      }
      
      console.log('No forms found in result');
      return [];
    } catch (error) {
      console.error('Error getting paper forms:', error);
      console.error('Error details:', {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack trace',
        details: error
      });
      // Return empty array instead of throwing to prevent cascading failures
      return [];
    }
  }

  async deletePaperForm(id: string): Promise<void> {
    try {
      await client.graphql({
        query: mutations.deletePaperFormEntry,
        variables: { input: { id } }
      });
    } catch (error) {
      console.error('Error deleting paper form:', error);
      throw error;
    }
  }

  async clearAllPaperForms(): Promise<void> {
    try {
      // First try to get all forms
      const forms = await this.getPaperForms();
      
      if (forms.length === 0) {
        console.log('No forms found to clear');
        return;
      }
      
      console.log(`Found ${forms.length} forms to delete`);
      
      // Delete forms one by one with better error handling
      const deletePromises = forms.map(async (form) => {
        try {
          await this.deletePaperForm(form.id);
          console.log(`Successfully deleted form: ${form.id}`);
          return { success: true, id: form.id };
        } catch (error) {
          console.error(`Failed to delete form ${form.id}:`, error);
          return { success: false, id: form.id, error };
        }
      });
      
      const results = await Promise.allSettled(deletePromises);
      
      // Log results
      const successful = results.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      const failed = results.filter(result => 
        result.status === 'fulfilled' && !result.value.success
      ).length;
      const rejected = results.filter(result => result.status === 'rejected').length;
      
      console.log(`Clear operation completed: ${successful} successful, ${failed} failed, ${rejected} rejected`);
      
      if (failed > 0 || rejected > 0) {
        throw new Error(`Failed to delete ${failed + rejected} forms`);
      }
      
    } catch (error) {
      console.error('Error clearing all paper forms:', error);
      throw error;
    }
  }

  // Date-based queries for paper forms
  async getPaperFormsByDateRange(startDate: Date, endDate: Date): Promise<PaperFormEntry[]> {
    try {
      const result = await client.graphql({
        query: queries.getPaperFormsByDateRange,
        variables: { 
          startDate: startDate.toISOString(), 
          endDate: endDate.toISOString() 
        }
      }) as GraphQLResult<any>;

      if (result.data?.getPaperFormsByDateRange) {
        return result.data.getPaperFormsByDateRange.map(mapGraphQLResultToPaperFormEntry);
      }
      return [];
    } catch (error) {
      console.error('Error getting paper forms by date range:', error);
      return [];
    }
  }

  async getTodaysPaperForms(): Promise<PaperFormEntry[]> {
    try {
      const result = await client.graphql({
        query: queries.getTodaysPaperForms
      }) as GraphQLResult<any>;

      if (result.data?.getTodaysPaperForms) {
        return result.data.getTodaysPaperForms.map(mapGraphQLResultToPaperFormEntry);
      }
      return [];
    } catch (error) {
      console.error('Error getting todays paper forms:', error);
      return [];
    }
  }

  async getPaperFormsByStatus(status: string): Promise<PaperFormEntry[]> {
    try {
      const result = await client.graphql({
        query: queries.getPaperFormsByStatus,
        variables: { status: status.toUpperCase().replace(' ', '_') }
      }) as GraphQLResult<any>;

      if (result.data?.getPaperFormsByStatus) {
        return result.data.getPaperFormsByStatus.map(mapGraphQLResultToPaperFormEntry);
      }
      return [];
    } catch (error) {
      console.error('Error getting paper forms by status:', error);
      return [];
    }
  }

  async getPaperFormsByInitial(initial: string): Promise<PaperFormEntry[]> {
    try {
      const result = await client.graphql({
        query: queries.getPaperFormsByInitial,
        variables: { initial }
      }) as GraphQLResult<any>;

      if (result.data?.getPaperFormsByInitial) {
        return result.data.getPaperFormsByInitial.map(mapGraphQLResultToPaperFormEntry);
      }
      return [];
    } catch (error) {
      console.error('Error getting paper forms by initial:', error);
      return [];
    }
  }

  // Custom mutations for paper forms
  async updatePaperFormStatus(formId: string, status: string): Promise<PaperFormEntry> {
    try {
      const result = await client.graphql({
        query: mutations.updatePaperFormStatus,
        variables: { 
          formId, 
          status: status.toUpperCase().replace(' ', '_') 
        }
      }) as GraphQLResult<any>;

      return mapGraphQLResultToPaperFormEntry(result.data.updatePaperFormStatus);
    } catch (error) {
      console.error('Error updating paper form status:', error);
      throw error;
    }
  }

  async addAdminComment(formId: string, comment: any): Promise<PaperFormEntry> {
    try {
      const result = await client.graphql({
        query: mutations.addAdminComment,
        variables: { formId, comment }
      }) as GraphQLResult<any>;

      return mapGraphQLResultToPaperFormEntry(result.data.addAdminComment);
    } catch (error) {
      console.error('Error adding admin comment:', error);
      throw error;
    }
  }

  async resolveError(formId: string, errorId: string): Promise<PaperFormEntry> {
    try {
      const result = await client.graphql({
        query: mutations.resolveError,
        variables: { formId, errorId }
      }) as GraphQLResult<any>;

      return mapGraphQLResultToPaperFormEntry(result.data.resolveError);
    } catch (error) {
      console.error('Error resolving error:', error);
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
