import { generateClient } from 'aws-amplify/api';
import { GraphQLResult } from '@aws-amplify/api-graphql';
import { type LogEntry, type User, type StageType } from './types';
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
  const mappedInput = {
    id: form.id,
    date: ensureDate(form.date).toISOString(),
    dateCreated: ensureDate(form.dateCreated || form.date).toISOString(),
    lastTextEntry: ensureDate(form.lastTextEntry || form.date).toISOString(),
    formType: form.formType,
    formInitial: form.formInitial,
    status: form.status.toUpperCase().replace(' ', '_'),
    title: form.title,
    entries: form.entries.filter(entry => entry && typeof entry === 'object').map(entry => {
        // Base entry with common fields
      const baseEntry = {
        type: entry.type || '',
        rack: entry.rack || '',
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
      };

      // Add form-specific fields for Piroshki forms
      if (form.formType === 'PIROSHKI_CALZONE_EMPANADA') {
        const piroshkiEntry = entry as any; // Type assertion for form-specific fields
        return {
          ...baseEntry,
          heatTreating: piroshkiEntry.heatTreating ? {
            temperature: piroshkiEntry.heatTreating.temp ? parseFloat(piroshkiEntry.heatTreating.temp) : null,
            time: piroshkiEntry.heatTreating.time ? convertTimeStringToDateTime(piroshkiEntry.heatTreating.time, form.date) : null,
            isValid: true,
            correctiveAction: '',
            employeeInitials: piroshkiEntry.heatTreating.initial || '',
            notes: '',
            dataLog: false
          } : null,
          ccp2_126: piroshkiEntry.ccp2_126 ? {
            temperature: piroshkiEntry.ccp2_126.temp ? parseFloat(piroshkiEntry.ccp2_126.temp) : null,
            time: piroshkiEntry.ccp2_126.time ? convertTimeStringToDateTime(piroshkiEntry.ccp2_126.time, form.date) : null,
            isValid: true,
            correctiveAction: '',
            employeeInitials: piroshkiEntry.ccp2_126.initial || '',
            notes: '',
            dataLog: false
          } : null,
          ccp2_80: piroshkiEntry.ccp2_80 ? {
            temperature: piroshkiEntry.ccp2_80.temp ? parseFloat(piroshkiEntry.ccp2_80.temp) : null,
            time: piroshkiEntry.ccp2_80.time ? convertTimeStringToDateTime(piroshkiEntry.ccp2_80.time, form.date) : null,
            isValid: true,
            correctiveAction: '',
            employeeInitials: piroshkiEntry.ccp2_80.initial || '',
            notes: '',
            dataLog: false
          } : null,
          ccp2_55: piroshkiEntry.ccp2_55 ? {
            temperature: piroshkiEntry.ccp2_55.temp ? parseFloat(piroshkiEntry.ccp2_55.temp) : null,
            time: piroshkiEntry.ccp2_55.time ? convertTimeStringToDateTime(piroshkiEntry.ccp2_55.time, form.date) : null,
            isValid: true,
            correctiveAction: '',
            employeeInitials: piroshkiEntry.ccp2_55.initial || '',
            notes: '',
            dataLog: false
          } : null
        };
      }

      // Return base entry for other form types
      return baseEntry;
    }),
    thermometerNumber: form.thermometerNumber || '',
    ingredients: JSON.stringify(form.ingredients || { beef: '', chicken: '', liquidEggs: '' }),
    lotNumbers: JSON.stringify(form.lotNumbers || { beef: '', chicken: '', liquidEggs: '' }),
    correctiveActionsComments: form.correctiveActionsComments,
    // For Piroshki form - Quantity and Flavor
    quantityAndFlavor: (form as any).quantityAndFlavor ? JSON.stringify((form as any).quantityAndFlavor) : null,
    
    // For Piroshki form - Pre Shipment Review
    preShipmentReview: (form as any).preShipmentReview ? {
      date: (form as any).preShipmentReview.date,
      initials: (form as any).preShipmentReview.initials,
      results: (form as any).preShipmentReview.results
    } : null,
    
    // For Bagel Dog form - Frank Flavor/Size Table
    frankFlavorSizeTable: (form as any).frankFlavorSizeTable ? JSON.stringify((form as any).frankFlavorSizeTable) : null,
    
    // For Bagel Dog form - Pre Shipment Review
    bagelDogPreShipmentReview: (form as any).bagelDogPreShipmentReview ? {
      date: (form as any).bagelDogPreShipmentReview.date,
      results: (form as any).bagelDogPreShipmentReview.results,
      signature: (form as any).bagelDogPreShipmentReview.signature
    } : null,
    
    adminComments: form.adminComments?.filter(comment => comment && comment.id && comment.adminInitial && comment.comment)?.map(comment => ({
      id: comment.id,
      adminInitial: comment.adminInitial,
      timestamp: ensureDate(comment.timestamp).toISOString(),
      comment: comment.comment
    })) || [],
    resolvedErrors: form.resolvedErrors || []
  };

  // Debug: Log what's being sent to AWS
  console.log('🔍 AWS Service - Mapping form to GraphQL input:', {
    formId: form.id,
    formType: form.formType,
    entriesCount: form.entries?.length || 0,
    mappedEntriesCount: mappedInput.entries.length,
    firstEntry: mappedInput.entries[0],
    hasStageData: mappedInput.entries[0]?.ccp1 || mappedInput.entries[0]?.ccp2
  });

  return mappedInput;
}

// Map GraphQL result to frontend PaperFormEntry
function mapGraphQLResultToPaperFormEntry(result: any): PaperFormEntry {
  console.log('=== MAPPING FORM DEBUG ===');
  console.log('Mapping form ID:', result.id);
  console.log('Mapping form type:', result.formType);
  console.log('Mapping form entries count:', result.entries?.length);
  
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

  // Parse JSON fields that are stored as strings in DynamoDB
  let parsedIngredients = { beef: '', chicken: '', liquidEggs: '' };
  let parsedLotNumbers = { beef: '', chicken: '', liquidEggs: '' };
  let parsedQuantityAndFlavor: any = null;
  let parsedFrankFlavorSizeTable: any = null;

  try {
    if (result.ingredients && typeof result.ingredients === 'string') {
      parsedIngredients = JSON.parse(result.ingredients);
    } else if (result.ingredients && typeof result.ingredients === 'object') {
      parsedIngredients = result.ingredients;
    }
  } catch (e) {
    console.warn('Failed to parse ingredients:', e);
  }

  try {
    if (result.lotNumbers && typeof result.lotNumbers === 'string') {
      parsedLotNumbers = JSON.parse(result.lotNumbers);
    } else if (result.lotNumbers && typeof result.lotNumbers === 'object') {
      parsedLotNumbers = result.lotNumbers;
    }
  } catch (e) {
    console.warn('Failed to parse lotNumbers:', e);
  }

  try {
    if (result.quantityAndFlavor && typeof result.quantityAndFlavor === 'string') {
      parsedQuantityAndFlavor = JSON.parse(result.quantityAndFlavor);
    } else if (result.quantityAndFlavor && typeof result.quantityAndFlavor === 'object') {
      parsedQuantityAndFlavor = result.quantityAndFlavor;
    }
  } catch (e) {
    console.warn('Failed to parse quantityAndFlavor:', e);
  }

  try {
    if (result.frankFlavorSizeTable && typeof result.frankFlavorSizeTable === 'string') {
      parsedFrankFlavorSizeTable = JSON.parse(result.frankFlavorSizeTable);
    } else if (result.frankFlavorSizeTable && typeof result.frankFlavorSizeTable === 'object') {
      parsedFrankFlavorSizeTable = result.frankFlavorSizeTable;
    }
  } catch (e) {
    console.warn('Failed to parse frankFlavorSizeTable:', e);
  }


  
  const mappedForm = {
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
  rack: entry.rack || '',
      // Piroshki-specific fields
      heatTreating: entry.heatTreating ? {
        temp: entry.heatTreating.temperature?.toString() || '',
        time: entry.heatTreating.time || '',
        initial: entry.heatTreating.employeeInitials || '',
        type: entry.heatTreating.type || ''
      } : undefined,
      ccp2_126: entry.ccp2_126 ? {
        temp: entry.ccp2_126.temperature?.toString() || '',
        time: entry.ccp2_126.time || '',
        initial: entry.ccp2_126.employeeInitials || ''
      } : undefined,
      ccp2_80: entry.ccp2_80 ? {
        temp: entry.ccp2_80.temperature?.toString() || '',
        time: entry.ccp2_80.time || '',
        initial: entry.ccp2_80.employeeInitials || ''
      } : undefined,
      ccp2_55: entry.ccp2_55 ? {
        temp: entry.ccp2_55.temperature?.toString() || '',
        time: entry.ccp2_55.time || '',
        initial: entry.ccp2_55.employeeInitials || ''
      } : undefined,
      // Standard CCP fields
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
  date: (entry.finalChill as any)?.date ? new Date((entry.finalChill as any).date) : undefined,
        initial: entry.finalChill?.employeeInitials || '',
        dataLog: entry.finalChill?.dataLog || false
      }
    })),
    thermometerNumber: result.thermometerNumber || '',
    ingredients: parsedIngredients,
    lotNumbers: parsedLotNumbers,
    correctiveActionsComments: result.correctiveActionsComments || '',
    // Piroshki-specific fields
    quantityAndFlavor: parsedQuantityAndFlavor,
    preShipmentReview: result.preShipmentReview ? {
      date: result.preShipmentReview.date || '',
      initials: result.preShipmentReview.initials || '',
      results: result.preShipmentReview.results || ''
    } : undefined,
    // Bagel Dog-specific fields
    frankFlavorSizeTable: parsedFrankFlavorSizeTable,
    bagelDogPreShipmentReview: result.bagelDogPreShipmentReview ? {
      date: result.bagelDogPreShipmentReview.date || '',
      results: result.bagelDogPreShipmentReview.results || '',
      signature: result.bagelDogPreShipmentReview.signature || ''
    } : undefined,
    adminComments: result.adminComments?.map((comment: any) => ({
      id: comment.id,
      adminInitial: comment.adminInitial,
      timestamp: new Date(comment.timestamp),
      comment: comment.comment
    })) || [],
    resolvedErrors: result.resolvedErrors || []
  };
  
  console.log('=== MAPPED FORM RESULT ===');
  console.log('Mapped form ID:', mappedForm.id);
  console.log('Mapped form has heatTreating:', !!mappedForm.entries?.[0]?.heatTreating);
  console.log('Mapped form has ccp2_126:', !!mappedForm.entries?.[0]?.ccp2_126);
  console.log('Mapped form has quantityAndFlavor:', !!mappedForm.quantityAndFlavor);
  console.log('Mapped form has preShipmentReview:', !!mappedForm.preShipmentReview);
  console.log('Mapped form has frankFlavorSizeTable:', !!mappedForm.frankFlavorSizeTable);
  console.log('Mapped form has bagelDogPreShipmentReview:', !!mappedForm.bagelDogPreShipmentReview);
  console.log('=== END MAPPED FORM RESULT ===');
  
  return mappedForm as PaperFormEntry;
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
        query: queries.listCookingCoolingFormEntries,
        variables: { limit: 1 }
      }) as GraphQLResult<any>;
      
      console.log('AWS connection test successful');
      
      // Test if mutations are accessible
      if (mutations.createCookingCoolingFormEntry) {
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

  // Log Entry Methods - Temporarily disabled due to missing GraphQL mutations
  // async saveLog(log: LogEntry): Promise<void> {
  //   try {
  //     const input = mapLogEntryToGraphQLInput(log);
  //     
  //     // Check if log exists
  //     const existingLog = await this.getLog(log.id);
  //     
  //     if (existingLog) {
  //       // Update existing log
  //       await client.graphql({
  //         query: mutations.updateLogEntry,
  //         variables: { input }
  //       });
  //     } else {
  //       // Create new log
  //       await client.graphql({
  //         query: mutations.createLogEntry,
  //         variables: { input }
  //       });
  //     }
  //   } catch (error) {
  //     console.error('Error saving log:', error);
  //     throw error;
  //   }
  // }

  // async saveLogs(logs: LogEntry[]): Promise<void> {
  //   try {
  //     // Save logs one by one (could be optimized with batch operations)
  //     await Promise.all(logs.map(log => this.saveLog(log)));
  //   } catch (error) {
  //     console.error('Error saving logs:', error);
  //     throw error;
  //   }
  // }

  // async getLog(id: string): Promise<LogEntry | undefined> {
  //   try {
  //     const result = await client.graphql({
  //       query: queries.getLogEntry,
  //       variables: { id }
  //   }) as GraphQLResult<any>;
  //
  //     if (result.data?.getLogEntry) {
  //       return mapGraphQLResultToLogEntry(result.data.getLogEntry);
  //     }
  //     return undefined;
  //   } catch (error) {
  //     console.error('Error getting log:', error);
  //     return undefined;
  //   }
  // }

  // async getLogs(): Promise<LogEntry[]> {
  //   try {
  //     const result = await client.graphql({
  //       query: queries.listLogEntries
  //   }) as GraphQLResult<any>;
  //
  //     if (result.data?.listLogEntries?.items) {
  //       return result.data.listLogEntries.items.map(mapGraphQLResultToLogEntry);
  //     }
  //     return [];
  //   } catch (error) {
  //     console.error('Error getting logs:', error);
  //     return [];
  //   }
  // }

  // async deleteLog(id: string): Promise<void> {
  //   try {
  //     await client.graphql({
  //       query: mutations.deleteLogEntry,
  //       variables: { input: { id } }
  //     });
  //   } catch (error) {
  //     console.error('Error deleting log:', error);
  //     throw error;
  //   }
  // }

  // async clearAllLogs(): Promise<void> {
  //   try {
  //     const logs = await this.getLogs();
  //     await Promise.all(logs.map(log => this.deleteLog(log.id)));
  //   } catch (error) {
  //     console.error('Error clearing all logs:', error);
  //     throw error;
  //   }
  // }

  // Paper Form Methods - Temporarily disabled due to missing generic GraphQL mutations
  async savePaperForm(form: PaperFormEntry): Promise<void> {
    console.warn('Paper form saving is temporarily disabled - GraphQL mutations not available');
    throw new Error('Paper form saving is temporarily disabled - GraphQL mutations not available');
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

  // async getPaperForm(id: string): Promise<PaperFormEntry | undefined> {
  //   try {
  //     const result = await client.graphql({
  //       query: queries.getPaperFormEntry,
  //       variables: { id }
  //     }) as GraphQLResult<any>;
  //
  //     if (result.data?.getPaperFormEntry) {
  //       return mapGraphQLResultToPaperFormEntry(result.data.getPaperFormEntry);
  //     }
  //     return undefined;
  //   } catch (error) {
  //     console.error('Error getting paper form:', error);
  //     return undefined;
  //   }
  // }

    async getPaperForms(): Promise<PaperFormEntry[]> {
    console.warn('Paper form retrieval is temporarily disabled - GraphQL queries not available');
    return [];
  }

  async deletePaperForm(id: string): Promise<void> {
    try {
      // First, we need to determine the form type to use the correct delete mutation
      // Since we don't have the form type, we'll try to delete from all three tables
      // This is not ideal but necessary given the current architecture
      
      // Try to delete from cooking cooling forms first
      try {
        await client.graphql({
          query: mutations.deleteCookingCoolingFormEntry,
          variables: { input: { id } }
        });
        console.log(`Successfully deleted cooking cooling form: ${id}`);
        return;
      } catch (error) {
        console.log(`Form ${id} not found in cooking cooling forms, trying piroshki forms...`);
      }
      
      // Try to delete from piroshki forms
      try {
        await client.graphql({
          query: mutations.deletePiroshkiFormEntry,
          variables: { input: { id } }
        });
        console.log(`Successfully deleted piroshki form: ${id}`);
        return;
      } catch (error) {
        console.log(`Form ${id} not found in piroshki forms, trying bagel dog forms...`);
      }
      
      // Try to delete from bagel dog forms
      try {
        await client.graphql({
          query: mutations.deleteBagelDogFormEntry,
          variables: { input: { id } }
        });
        console.log(`Successfully deleted bagel dog form: ${id}`);
        return;
      } catch (error) {
        console.log(`Form ${id} not found in bagel dog forms`);
      }
      
      // If we get here, the form wasn't found in any table
      throw new Error(`Form with ID ${id} not found in any form table`);
      
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
      const allForms: PaperFormEntry[] = [];
      
      // Get cooking cooling forms by date range
      try {
        const cookingCoolingResult = await client.graphql({
          query: queries.getCookingCoolingFormsByDateRange,
          variables: { 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString() 
          }
        }) as GraphQLResult<any>;

        if (cookingCoolingResult.data?.getCookingCoolingFormsByDateRange) {
          const cookingCoolingForms = cookingCoolingResult.data.getCookingCoolingFormsByDateRange.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...cookingCoolingForms);
        }
      } catch (error) {
        console.error('Error getting cooking cooling forms by date range:', error);
      }
      
      // Get piroshki forms by date range
      try {
        const piroshkiResult = await client.graphql({
          query: queries.getPiroshkiFormsByDateRange,
          variables: { 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString() 
          }
        }) as GraphQLResult<any>;

        if (piroshkiResult.data?.getPiroshkiFormsByDateRange) {
          const piroshkiForms = piroshkiResult.data.getPiroshkiFormsByDateRange.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...piroshkiForms);
        }
      } catch (error) {
        console.error('Error getting piroshki forms by date range:', error);
      }
      
      // Get bagel dog forms by date range
      try {
        const bagelDogResult = await client.graphql({
          query: queries.getBagelDogFormsByDateRange,
          variables: { 
            startDate: startDate.toISOString(), 
            endDate: endDate.toISOString() 
          }
        }) as GraphQLResult<any>;

        if (bagelDogResult.data?.getBagelDogFormsByDateRange) {
          const bagelDogForms = bagelDogResult.data.getBagelDogFormsByDateRange.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...bagelDogForms);
        }
      } catch (error) {
        console.error('Error getting bagel dog forms by date range:', error);
      }
      
      return allForms;
    } catch (error) {
      console.error('Error getting paper forms by date range:', error);
      return [];
    }
  }

  async getTodaysPaperForms(): Promise<PaperFormEntry[]> {
    try {
      const allForms: PaperFormEntry[] = [];
      
      // Get today's cooking cooling forms
      try {
        const cookingCoolingResult = await client.graphql({
          query: queries.getTodaysCookingCoolingForms
        }) as GraphQLResult<any>;

        if (cookingCoolingResult.data?.getTodaysCookingCoolingForms) {
          const cookingCoolingForms = cookingCoolingResult.data.getTodaysCookingCoolingForms.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...cookingCoolingForms);
        }
      } catch (error) {
        console.error('Error getting today\'s cooking cooling forms:', error);
      }
      
      // Get today's piroshki forms
      try {
        const piroshkiResult = await client.graphql({
          query: queries.getTodaysPiroshkiForms
        }) as GraphQLResult<any>;

        if (piroshkiResult.data?.getTodaysPiroshkiForms) {
          const piroshkiForms = piroshkiResult.data.getTodaysPiroshkiForms.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...piroshkiForms);
        }
      } catch (error) {
        console.error('Error getting today\'s piroshki forms:', error);
      }
      
      // Get today's bagel dog forms
      try {
        const bagelDogResult = await client.graphql({
          query: queries.getTodaysBagelDogForms
        }) as GraphQLResult<any>;

        if (bagelDogResult.data?.getTodaysBagelDogForms) {
          const bagelDogForms = bagelDogResult.data.getTodaysBagelDogForms.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...bagelDogForms);
        }
      } catch (error) {
        console.error('Error getting today\'s bagel dog forms:', error);
      }
      
      return allForms;
    } catch (error) {
      console.error('Error getting today\'s paper forms:', error);
      return [];
    }
  }

  async getPaperFormsByStatus(status: string): Promise<PaperFormEntry[]> {
    try {
      const allForms: PaperFormEntry[] = [];
      const formattedStatus = status.toUpperCase().replace(' ', '_');
      
      // Get cooking cooling forms by status
      try {
        const cookingCoolingResult = await client.graphql({
          query: queries.getCookingCoolingFormsByStatus,
          variables: { status: formattedStatus }
        }) as GraphQLResult<any>;

        if (cookingCoolingResult.data?.getCookingCoolingFormsByStatus) {
          const cookingCoolingForms = cookingCoolingResult.data.getCookingCoolingFormsByStatus.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...cookingCoolingForms);
        }
      } catch (error) {
        console.error('Error getting cooking cooling forms by status:', error);
      }
      
      // Get piroshki forms by status
      try {
        const piroshkiResult = await client.graphql({
          query: queries.getPiroshkiFormsByStatus,
          variables: { status: formattedStatus }
        }) as GraphQLResult<any>;

        if (piroshkiResult.data?.getPiroshkiFormsByStatus) {
          const piroshkiForms = piroshkiResult.data.getPiroshkiFormsByStatus.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...piroshkiForms);
        }
      } catch (error) {
        console.error('Error getting piroshki forms by status:', error);
      }
      
      // Get bagel dog forms by status
      try {
        const bagelDogResult = await client.graphql({
          query: queries.getBagelDogFormsByStatus,
          variables: { status: formattedStatus }
        }) as GraphQLResult<any>;

        if (bagelDogResult.data?.getBagelDogFormsByStatus) {
          const bagelDogForms = bagelDogResult.data.getBagelDogFormsByStatus.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...bagelDogForms);
        }
      } catch (error) {
        console.error('Error getting bagel dog forms by status:', error);
      }
      
      return allForms;
    } catch (error) {
      console.error('Error getting paper forms by status:', error);
      return [];
    }
  }

  async getPaperFormsByInitial(initial: string): Promise<PaperFormEntry[]> {
    try {
      const allForms: PaperFormEntry[] = [];
      
      // Get cooking cooling forms by initial
      try {
        const cookingCoolingResult = await client.graphql({
          query: queries.getCookingCoolingFormsByInitial,
          variables: { initial }
        }) as GraphQLResult<any>;

        if (cookingCoolingResult.data?.getCookingCoolingFormsByInitial) {
          const cookingCoolingForms = cookingCoolingResult.data.getCookingCoolingFormsByInitial.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...cookingCoolingForms);
        }
      } catch (error) {
        console.error('Error getting cooking cooling forms by initial:', error);
      }
      
      // Get piroshki forms by initial
      try {
        const piroshkiResult = await client.graphql({
          query: queries.getPiroshkiFormsByInitial,
          variables: { initial }
        }) as GraphQLResult<any>;

        if (piroshkiResult.data?.getPiroshkiFormsByInitial) {
          const piroshkiForms = piroshkiResult.data.getPiroshkiFormsByInitial.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...piroshkiForms);
        }
      } catch (error) {
        console.error('Error getting piroshki forms by initial:', error);
      }
      
      // Get bagel dog forms by initial
      try {
        const bagelDogResult = await client.graphql({
          query: queries.getBagelDogFormsByInitial,
          variables: { initial }
        }) as GraphQLResult<any>;

        if (bagelDogResult.data?.getBagelDogFormsByInitial) {
          const bagelDogForms = bagelDogResult.data.getBagelDogFormsByInitial.map(mapGraphQLResultToPaperFormEntry);
          allForms.push(...bagelDogForms);
        }
      } catch (error) {
        console.error('Error getting bagel dog forms by initial:', error);
      }
      
      return allForms;
    } catch (error) {
      console.error('Error getting paper forms by initial:', error);
      return [];
    }
  }

  // Custom mutations for paper forms
  async updatePaperFormStatus(formId: string, status: string): Promise<PaperFormEntry> {
    try {
      const formattedStatus = status.toUpperCase().replace(' ', '_');
      
      // Try to update cooking cooling form status first
      try {
        const result = await client.graphql({
          query: mutations.updateCookingCoolingFormStatus,
          variables: { 
            formId, 
            status: formattedStatus 
          }
        }) as GraphQLResult<any>;

        if (result.data?.updateCookingCoolingFormStatus) {
          return mapGraphQLResultToPaperFormEntry(result.data.updateCookingCoolingFormStatus);
        }
      } catch (error) {
        console.log(`Form ${formId} not found in cooking cooling forms, trying piroshki forms...`);
      }
      
      // Try to update piroshki form status
      try {
        const result = await client.graphql({
          query: mutations.updatePiroshkiFormStatus,
          variables: { 
            formId, 
            status: formattedStatus 
          }
        }) as GraphQLResult<any>;

        if (result.data?.updatePiroshkiFormStatus) {
          return mapGraphQLResultToPaperFormEntry(result.data.updatePiroshkiFormStatus);
        }
      } catch (error) {
        console.log(`Form ${formId} not found in piroshki forms, trying bagel dog forms...`);
      }
      
      // Try to update bagel dog form status
      try {
        const result = await client.graphql({
          query: mutations.updateBagelDogFormStatus,
          variables: { 
            formId, 
            status: formattedStatus 
          }
        }) as GraphQLResult<any>;

        if (result.data?.updateBagelDogFormStatus) {
          return mapGraphQLResultToPaperFormEntry(result.data.updateBagelDogFormStatus);
        }
      } catch (error) {
        console.log(`Form ${formId} not found in bagel dog forms`);
      }
      
      // If we get here, the form wasn't found in any table
      throw new Error(`Form with ID ${formId} not found in any form table`);
      
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
  // TODO: Implement log queries when GraphQL schema supports them
  // async getLogsByDateRange(startDate: Date, endDate: Date): Promise<LogEntry[]> {
  //   try {
  //     const result = await client.graphql({
  //       query: queries.getLogsByDateRange,
  //       variables: { 
  //         startDate: startDate.toISOString(), 
  //         endDate: endDate.toISOString() 
  //       }
  //     }) as GraphQLResult<any>;

  //     if (result.data?.getLogsByDateRange) {
  //       return result.data.getLogsByDateRange.map(mapGraphQLResultToLogEntry);
  //     }
  //     return [];
  //   } catch (error) {
  //     console.error('Error getting logs by date range:', error);
  //     return [];
  //   }
  // }

  // async getTodaysLogs(): Promise<LogEntry[]> {
  //   try {
  //     const result = await client.graphql({
  //       query: queries.getTodaysLogs
  //     }) as GraphQLResult<any>;

  //     if (result.data?.getTodaysLogs) {
  //       return result.data.getTodaysLogs.map(mapGraphQLResultToLogEntry);
  //       return [];
  //     }
  //   } catch (error) {
  //     console.error('Error getting todays logs:', error);
  //     return [];
  //   }
  // }

  // User Methods
  // TODO: Implement user creation when GraphQL schema supports it
  // async createUser(user: Omit<User, 'id'>): Promise<User> {
  //   try {
  //     const result = await client.graphql({
  //       query: mutations.createUser,
  //       variables: {
  //         input: {
  //           initials: user.initials,
  //           name: user.name,
  //           role: user.role.toUpperCase(),
  //           certificationNumber: user.certificationNumber,
  //           email: user.email,
  //           isActive: true
  //       }
  //     }) as GraphQLResult<any>;

  //     return result.data.createUser;
  //   } catch (error) {
  //     console.error('Error creating user:', error);
  //     throw error;
  //   }
  // }

  // TODO: Implement user retrieval when GraphQL schema supports it
  // async getUsers(): Promise<User[]> {
  //   try {
  //     const result = await client.graphql({
  //       query: queries.listUsers
  //     }) as GraphQLResult<any>;

  //     if (result.data?.listUsers?.items) {
  //       return result.data.listUsers.items.map((user: any) => ({
  //         ...user,
  //           role: user.role.toLowerCase()
  //         }));
  //       }
  //       return [];
  //     } catch (error) {
  //       console.error('Error getting users:', error);
  //       return [];
  //     }
  //   }



  // Workflow Methods - Temporarily disabled due to missing GraphQL mutations
  // async updateLogEntryStage(logEntryId: string, stage: StageType, stageData: any): Promise<LogEntry> {
  //   try {
  //     const result = await client.graphql({
  //       query: mutations.updateLogEntryStage,
  //       variables: {
  //         logEntryId,
  //         stage: stageMapping[stage],
  //         stageData: {
  //           temperature: stageData.temperature,
  //           time: stageData.time?.toISOString(),
  //           isValid: stageData.isValid,
  //           correctiveAction: stageData.correctiveAction,
  //           employeeInitials: stageData.employeeInitials,
  //           notes: stageData.notes
  //         }
  //       }
  //     }) as GraphQLResult<any>;
  //
  //     return mapGraphQLResultToLogEntry(result.data.updateLogEntryStage);
  //   } catch (error) {
  //     console.error('Error updating log entry stage:', error);
  //     throw error;
  //   }
  // }

  // async submitLogEntryForReview(logEntryId: string): Promise<LogEntry> {
  //   try {
  //     const result = await client.graphql({
  //       query: mutations.submitLogEntryForReview,
  //       variables: { logEntryId }
  //   }) as GraphQLResult<any>;
  //
  //     return mapGraphQLResultToLogEntry(result.data.submitLogEntryForReview);
  //   } catch (error) {
  //     console.error('Error submitting log entry for review:', error);
  //     throw error;
  //   }
  // }

  // async approveLogEntry(logEntryId: string, adminComments?: string, adminSignature?: string): Promise<LogEntry> {
  //   try {
  //     const result = await client.graphql({
  //       query: mutations.approveLogEntry,
  //       variables: { logEntryId, adminComments, adminSignature }
  //   }) as GraphQLResult<any>;
  //
  //     return mapGraphQLResultToLogEntry(result.data.approveLogEntry);
  //   } catch (error) {
  //     console.error('Error approving log entry:', error);
  //     throw error;
  //   }
  // }
}

export const awsStorageManager = new AWSStorageManager();
