import { generateClient } from 'aws-amplify/api';
import { GraphQLResult } from '@aws-amplify/api-graphql';
import { 
  type PaperFormEntry, 
  FormType, 
  ensureDate,
  isCookingCoolingForm,
  isPiroshkiForm,
  isBagelDogForm
} from './paperFormTypes';

// AWS API Client
const client = generateClient();

// Attempt to get a serialized, server-assigned form id. This expects a backend
// mutation like `getNextFormId` that returns { nextId: String }. If the
// mutation isn't available (common until backend is updated), this helper
// gracefully falls back to a locally-generated unique id.
async function requestNextFormIdFromServer(): Promise<string> {
  try {
    const result = await client.graphql({
      query: `mutation GetNextFormId { getNextFormId { nextId } }`
    });

    // Best-effort extraction. Different backends may return slightly
    // different shapes, so check common locations.
    const nextId = (result as any)?.data?.getNextFormId?.nextId || (result as any)?.data?.getNextFormId || null;
    if (nextId && typeof nextId === 'string') {
      console.log('Received server-assigned form id:', nextId);
      return nextId;
    }
    console.warn('Server did not return a nextId, falling back to local id generation');
  } catch (err) {
    // This is expected if the backend doesn't expose the mutation yet.
    console.warn('Request for server-assigned form id failed:', err);
  }

  // Fallback: generate a reasonably-unique id client-side to avoid collisions
  // in practice. This is not strictly serialized but prevents easy duplicates.
  const fallback = `form-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  console.log('Using fallback generated form id:', fallback);
  return fallback;
}

// Helper function to convert time string (HH:MM) to DateTime
function convertTimeStringToDateTime(timeString: string, baseDate: Date): string | null {
  if (!timeString || !baseDate) return null;
  
  try {
    // Validate time string format
    if (typeof timeString !== 'string') {
      console.warn('Invalid time string type:', typeof timeString, timeString);
      return null;
    }
    
    // Check if time string matches HH:MM format
    if (!/^\d{1,2}:\d{2}$/.test(timeString)) {
      console.warn('Invalid time string format:', timeString);
      return null;
    }
    
    const [hours, minutes] = timeString.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) {
      console.warn('Invalid time values:', { hours, minutes, timeString });
      return null;
    }
    
    // Validate hour and minute ranges
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn('Time values out of range:', { hours, minutes, timeString });
      return null;
    }
    
    const dateTime = new Date(baseDate);
    if (isNaN(dateTime.getTime())) {
      console.warn('Invalid base date:', baseDate);
      return null;
    }
    
    dateTime.setHours(hours, minutes, 0, 0);
    return dateTime.toISOString();
  } catch (error) {
    console.warn('Failed to convert time string to DateTime:', timeString, error);
    return null;
  }
}

// Helper function to convert DateTime back to time string (HH:MM)
function convertDateTimeToTimeString(dateTimeString: string | null): string {
  if (!dateTimeString) return '';
  
  try {
    const date = new Date(dateTimeString);
    if (isNaN(date.getTime())) return '';
    
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.warn('Failed to convert DateTime to time string:', dateTimeString, error);
    return '';
  }
}

// Safely stringify objects (handles circular refs)
function safeStringify(obj: any, space = 2) {
  const seen = new WeakSet();
  return JSON.stringify(obj, function (_key, value) {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) return '[Circular]';
      seen.add(value);
    }
    if (typeof value === 'function') return `[Function: ${value.name || 'anonymous'}]`;
    return value;
  }, space);
}

// Helper function to ensure consistent date handling
function ensureValidDate(dateValue: any): Date {
  if (!dateValue) return new Date();
  
  try {
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) {
      console.warn('Invalid date value, using current date:', dateValue);
      return new Date();
    }
    return date;
  } catch (error) {
    console.warn('Error parsing date, using current date:', dateValue, error);
    return new Date();
  }
}

// Sanitize a stage object so it only contains fields allowed by StageDataInput
function sanitizeStageInput(stage: any, formDate?: Date) {
  if (!stage || typeof stage !== 'object') return null;

  const temperature = (typeof stage.temperature === 'number') ? stage.temperature : (stage.temperature ? parseFloat(stage.temperature) : null);
  const time = stage.time || null;
  const isValid = !!stage.isValid;
  const correctiveAction = stage.correctiveAction || '';
  const employeeInitials = stage.employeeInitials || stage.initial || '';
  const notes = stage.notes || '';
  const dataLog = !!stage.dataLog;

  return {
    temperature,
    time,
    isValid,
    correctiveAction,
    employeeInitials,
    notes,
    dataLog
  };
}

// Map frontend PaperFormEntry to GraphQL input based on form type
function mapPaperFormEntryToGraphQLInput(form: PaperFormEntry): any {
  console.log('mapPaperFormEntryToGraphQLInput called with form:', {
    id: form.id,
    title: form.title,
    status: form.status,
    formType: form.formType,
    formInitial: form.formInitial,
    date: form.date,
    dateCreated: form.dateCreated,
    lastTextEntry: form.lastTextEntry,
    entriesCount: form.entries?.length || 0
  });
  
  const baseInput = {
    id: form.id,
    date: ensureDate(form.date).toISOString(),
    dateCreated: ensureDate(form.dateCreated || form.date).toISOString(),
    lastTextEntry: ensureDate(form.lastTextEntry || form.date).toISOString(),
    formInitial: form.formInitial,
    status: form.status.toUpperCase().replace(' ', '_'),
    title: form.title,
  // Approval metadata
  approvedBy: form.approvedBy || null,
  approvedAt: form.approvedAt ? ensureDate(form.approvedAt).toISOString() : null,
  entries: form.entries.filter(entry => entry && typeof entry === 'object' && entry.type !== undefined).map(entry => ({
  type: entry.type,
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
    })),
    thermometerNumber: form.thermometerNumber || '',
    ingredients: JSON.stringify(form.ingredients || { beef: '', chicken: '', liquidEggs: '' }),
    lotNumbers: JSON.stringify(form.lotNumbers || { beef: '', chicken: '', liquidEggs: '' }),
    correctiveActionsComments: form.correctiveActionsComments,
    adminComments: form.adminComments?.filter(comment => comment && comment.id && comment.adminInitial && comment.comment)?.map(comment => ({
      id: comment.id,
      adminInitial: comment.adminInitial,
      timestamp: ensureDate(comment.timestamp).toISOString(),
      comment: comment.comment
    })) || [],
    resolvedErrors: form.resolvedErrors?.filter(error => error && typeof error === 'string') || []
  };
  // Sanitize every stage in each entry so we never send fields the GraphQL schema doesn't accept
  try {
    baseInput.entries = (baseInput.entries || []).map((entry: any) => {
      const sanitized: any = { type: entry.type, rack: entry.rack || '' };

      // Choose allowed stage keys based on the form type to match GraphQL input
      let stageKeys = ['ccp1','ccp2','coolingTo80','coolingTo54','finalChill'];
      if (isPiroshkiForm(form)) {
        stageKeys = ['heatTreating','ccp2_126','ccp2_80','ccp2_55','ccp1','ccp2','coolingTo80','coolingTo54','finalChill'];
      } else if (isBagelDogForm(form)) {
        stageKeys = ['ccp1','ccp2','coolingTo80','coolingTo54','finalChill'];
      } else if (isCookingCoolingForm(form)) {
        stageKeys = ['ccp1','ccp2','coolingTo80','coolingTo54','finalChill'];
      }

      for (const key of stageKeys) {
        sanitized[key] = sanitizeStageInput(entry[key], ensureDate(baseInput.date));
      }
      return sanitized;
    });
  } catch (e) {
    console.warn('Failed to sanitize baseInput entries:', e);
  }

  console.log('Base input created:', {
    id: baseInput.id,
    date: baseInput.date,
    formInitial: baseInput.formInitial,
    status: baseInput.status,
    title: baseInput.title,
    entriesCount: baseInput.entries.length
  });

  // Add form-specific fields
  if (isPiroshkiForm(form)) {
    console.log('Processing as Piroshki form...');
    const result = {
      ...baseInput,
      quantityAndFlavor: form.quantityAndFlavor ? JSON.stringify(form.quantityAndFlavor) : null,
      preShipmentReview: form.preShipmentReview ? {
        date: form.preShipmentReview.date,
        initials: form.preShipmentReview.initials,
        results: form.preShipmentReview.results
      } : null,
      // Add Piroshki-specific entry fields
      entries: form.entries.map(entry => ({
        ...baseInput.entries.find((e: any) => e.type === entry.type),
        heatTreating: entry.heatTreating ? {
          temperature: entry.heatTreating.temp ? parseFloat(entry.heatTreating.temp) : null,
          time: entry.heatTreating.time ? convertTimeStringToDateTime(entry.heatTreating.time, form.date) : null,
          isValid: true,
          correctiveAction: '',
          employeeInitials: entry.heatTreating.initial || '',
          notes: '',
          dataLog: false,
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
        } : null
      }))
    };
    console.log('Piroshki form result:', {
      id: result.id,
      date: result.date,
      formInitial: result.formInitial,
      status: result.status,
      title: result.title,
      entriesCount: result.entries.length
    });
    return result;
  }

  if (isBagelDogForm(form)) {
    console.log('Processing as Bagel Dog form...');
    const result = {
      ...baseInput,
      frankFlavorSizeTable: form.frankFlavorSizeTable ? JSON.stringify(form.frankFlavorSizeTable) : null,
      bagelDogPreShipmentReview: form.bagelDogPreShipmentReview ? {
        date: form.bagelDogPreShipmentReview.date,
        results: form.bagelDogPreShipmentReview.results,
        signature: form.bagelDogPreShipmentReview.signature
      } : null
    };
    console.log('Bagel Dog form result:', {
      id: result.id,
      date: result.date,
      formInitial: result.formInitial,
      status: result.status,
      title: result.title,
      entriesCount: result.entries.length
    });
    return result;
  }

  // Default to cooking and cooling form
  console.log('Processing as Cooking and Cooling form...');
  console.log('Final base input result:', {
    id: baseInput.id,
    date: baseInput.date,
    formInitial: baseInput.formInitial,
    status: baseInput.status,
    title: baseInput.title,
    entriesCount: baseInput.entries.length
  });
  return baseInput;
}

// Map GraphQL result to frontend PaperFormEntry based on form type
function mapGraphQLResultToPaperFormEntry(result: any, formType: FormType): PaperFormEntry {
  // Map status from database values to frontend values
  let mappedStatus: 'Complete' | 'In Progress' | 'Error';
  if (!result.status) {
    mappedStatus = 'In Progress';
  } else if (result.status === 'COMPLETE') {
    mappedStatus = 'Complete';
  } else if (result.status === 'IN_PROGRESS') {
    mappedStatus = 'In Progress';
  } else if (result.status === 'ERROR') {
    mappedStatus = 'Error';
  } else {
    mappedStatus = result.status.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) as any;
  }

  // Parse JSON fields that are stored as strings in DynamoDB
  let parsedIngredients = { beef: '', chicken: '', liquidEggs: '' };
  let parsedLotNumbers = { beef: '', chicken: '', liquidEggs: '' };

  try {
    if (result.ingredients && typeof result.ingredients === 'string') {
      parsedIngredients = JSON.parse(result.ingredients);
    } else if (result.ingredients && typeof result.ingredients === 'object') {
      parsedIngredients = result.ingredients;
    }
  } catch (e: any) {
    console.warn('Failed to parse ingredients:', e);
  }

  try {
    if (result.lotNumbers && typeof result.lotNumbers === 'string') {
      parsedLotNumbers = JSON.parse(result.lotNumbers);
    } else if (result.lotNumbers && typeof result.lotNumbers === 'object') {
      parsedLotNumbers = result.lotNumbers;
    }
  } catch (e: any) {
    console.warn('Failed to parse lotNumbers:', e);
  }

  const baseForm = {
    id: result.id,
    date: ensureValidDate(result.date),
    dateCreated: ensureValidDate(result.dateCreated || result.date),
    lastTextEntry: ensureValidDate(result.lastTextEntry || result.date),
    formType,
    formInitial: result.formInitial || '',
    status: mappedStatus,
    title: result.title || '',
  entries: (result.entries || []).map((entry: any) => ({
  type: entry.type || '',
  rack: entry.rack || '',
      ccp1: {
        temp: entry.ccp1?.temperature?.toString() || '',
        time: convertDateTimeToTimeString(entry.ccp1?.time) || '',
        initial: entry.ccp1?.employeeInitials || '',
        dataLog: entry.ccp1?.dataLog || false
      },
      ccp2: {
        temp: entry.ccp2?.temperature?.toString() || '',
        time: convertDateTimeToTimeString(entry.ccp2?.time) || '',
        initial: entry.ccp2?.employeeInitials || '',
        dataLog: entry.ccp2?.dataLog || false
      },
      coolingTo80: {
        temp: entry.coolingTo80?.temperature?.toString() || '',
        time: convertDateTimeToTimeString(entry.coolingTo80?.time) || '',
        initial: entry.coolingTo80?.employeeInitials || '',
        dataLog: entry.coolingTo80?.dataLog || false
      },
      coolingTo54: {
        temp: entry.coolingTo54?.temperature?.toString() || '',
        time: convertDateTimeToTimeString(entry.coolingTo54?.time) || '',
        initial: entry.coolingTo54?.employeeInitials || '',
        dataLog: entry.coolingTo54?.dataLog || false
      },
      finalChill: {
        temp: entry.finalChill?.temperature?.toString() || '',
  time: convertDateTimeToTimeString(entry.finalChill?.time) || '',
  date: (entry.finalChill as any)?.date ? new Date((entry.finalChill as any).date) : undefined,
        initial: entry.finalChill?.employeeInitials || '',
        dataLog: entry.finalChill?.dataLog || false
      }
    })),
    thermometerNumber: result.thermometerNumber || '',
    ingredients: parsedIngredients,
    lotNumbers: parsedLotNumbers,
  // Map approval metadata from DB result
  approvedBy: result.approvedBy || '',
  approvedAt: result.approvedAt ? ensureValidDate(result.approvedAt) : undefined,
    correctiveActionsComments: result.correctiveActionsComments || '',
    adminComments: result.adminComments?.map((comment: any) => ({
      id: comment.id,
      adminInitial: comment.adminInitial,
      timestamp: ensureValidDate(comment.timestamp),
      comment: comment.comment
    })) || [],
    resolvedErrors: result.resolvedErrors || []
  };

  if (formType === FormType.PIROSHKI_CALZONE_EMPANADA) {
    let parsedQuantityAndFlavor: any = null;
    try {
      if (result.quantityAndFlavor && typeof result.quantityAndFlavor === 'string') {
        parsedQuantityAndFlavor = JSON.parse(result.quantityAndFlavor);
      } else if (result.quantityAndFlavor && typeof result.quantityAndFlavor === 'object') {
        parsedQuantityAndFlavor = result.quantityAndFlavor;
      }
    } catch (e: any) {
      console.warn('Failed to parse quantityAndFlavor:', e);
    }

    return {
      ...baseForm,
      entries: (result.entries || []).map((entry: any) => ({
        ...baseForm.entries.find((e: any) => e.type === entry.type),
        heatTreating: entry.heatTreating ? {
          temp: entry.heatTreating.temperature?.toString() || '',
          time: convertDateTimeToTimeString(entry.heatTreating.time) || '',
          initial: entry.heatTreating.employeeInitials || '',
          type: entry.heatTreating.type || ''
        } : undefined,
        ccp2_126: entry.ccp2_126 ? {
          temp: entry.ccp2_126.temperature?.toString() || '',
          time: convertDateTimeToTimeString(entry.ccp2_126.time) || '',
          initial: entry.ccp2_126.employeeInitials || ''
        } : undefined,
        ccp2_80: entry.ccp2_80 ? {
          temp: entry.ccp2_80.temperature?.toString() || '',
          time: convertDateTimeToTimeString(entry.ccp2_80.time) || '',
          initial: entry.ccp2_80.employeeInitials || ''
        } : undefined,
        ccp2_55: entry.ccp2_55 ? {
          temp: entry.ccp2_55.temperature?.toString() || '',
          time: convertDateTimeToTimeString(entry.ccp2_55.time) || '',
          initial: entry.ccp2_55.employeeInitials || ''
        } : undefined
      })),
      quantityAndFlavor: parsedQuantityAndFlavor,
      preShipmentReview: result.preShipmentReview ? {
        date: result.preShipmentReview.date || '',
        initials: result.preShipmentReview.initials || '',
        results: result.preShipmentReview.results || ''
      } : undefined
    } as any;
  }

  if (formType === FormType.BAGEL_DOG_COOKING_COOLING) {
    let parsedFrankFlavorSizeTable: any = null;
    try {
      if (result.frankFlavorSizeTable && typeof result.frankFlavorSizeTable === 'string') {
        parsedFrankFlavorSizeTable = JSON.parse(result.frankFlavorSizeTable);
      } else if (result.frankFlavorSizeTable && typeof result.frankFlavorSizeTable === 'object') {
        parsedFrankFlavorSizeTable = result.frankFlavorSizeTable;
      }
    } catch (e: any) {
      console.warn('Failed to parse frankFlavorSizeTable:', e);
    }

    return {
      ...baseForm,
      frankFlavorSizeTable: parsedFrankFlavorSizeTable,
      bagelDogPreShipmentReview: result.bagelDogPreShipmentReview ? {
        date: result.bagelDogPreShipmentReview.date || '',
        results: result.bagelDogPreShipmentReview.results || '',
        signature: result.bagelDogPreShipmentReview.signature || ''
      } : undefined
    } as any;
  }

  return baseForm as any;
}

class MultiTableStorageManager {
  // Test AWS connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing AWS connection...');
      
      // Try a simple query to test connection
      const result = await client.graphql({
        query: `query TestConnection { __typename }`
      }) as GraphQLResult<any>;
      
      console.log('AWS connection test successful');
      return true;
    } catch (error) {
      console.error('AWS connection test failed:', error);
      return false;
    }
  }

  // Paper Form Methods with table routing
  async savePaperForm(form: PaperFormEntry): Promise<void> {
    try {
      console.log(`Saving form to table: ${form.formType}`);
      console.log('Form data being saved:', {
        id: form.id,
        title: form.title,
        status: form.status,
        entriesCount: form.entries?.length || 0,
        formType: form.formType
      });
      
      // Validate form data before processing
      if (!form.id || !form.formType || !form.status) {
        throw new Error('Invalid form data: missing required fields (id, formType, or status)');
      }
      
      if (!form.entries || !Array.isArray(form.entries)) {
        throw new Error('Invalid form data: entries must be an array');
      }
      
      if (form.entries.length === 0) {
        throw new Error('Invalid form data: entries array cannot be empty');
      }
      
      // Additional validation for form properties
      console.log('Form validation details:');
      console.log('- form.id:', form.id, 'type:', typeof form.id);
      console.log('- form.formType:', form.formType, 'type:', typeof form.formType);
      console.log('- form.status:', form.status, 'type:', typeof form.status);
      console.log('- form.title:', form.title, 'type:', typeof form.title);
      console.log('- form.formInitial:', form.formInitial, 'type:', typeof form.formInitial);
      console.log('- form.date:', form.date, 'type:', typeof form.date);
      console.log('- form.entries:', form.entries, 'type:', typeof form.entries, 'length:', form.entries?.length);
      
      // Check for undefined or null values (title and formInitial can be empty strings initially)
      const requiredFields = ['id', 'formType', 'status', 'date'];
      const missingFields = requiredFields.filter(field => !form[field as keyof PaperFormEntry]);
      if (missingFields.length > 0) {
        throw new Error(`Invalid form data: missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Check that title and formInitial are strings (can be empty)
      if (typeof form.title !== 'string') {
        throw new Error('Invalid form data: title must be a string');
      }
      if (typeof form.formInitial !== 'string') {
        throw new Error('Invalid form data: formInitial must be a string');
      }
      
      // Test GraphQL client connectivity
      try {
        console.log('Testing GraphQL client connectivity...');
        const testResult = await client.graphql({
          query: `query TestConnection { __typename }`
        });
        console.log('GraphQL client test result:', testResult);
      } catch (testError) {
        // If the GraphQL client fails (commonly because Amplify isn't configured
        // in local/dev environments), treat this as non-fatal and keep the
        // form locally rather than blocking the user with an exception.
        console.warn('GraphQL client connectivity test failed; skipping remote save:', testError);
        return;
      }
      
      const input = mapPaperFormEntryToGraphQLInput(form);
      console.log('Transformed GraphQL input:', input);
      
      // Validate transformed input with detailed logging
      console.log('Validating transformed input fields:');
      console.log('- id:', input.id);
      console.log('- date:', input.date);
      console.log('- formInitial:', input.formInitial);
      console.log('- status:', input.status);
      console.log('- title:', input.title);
      console.log('- entries count:', input.entries?.length || 0);
      
      if (!input.id) {
        throw new Error('Missing required field: id');
      }
      if (!input.date) {
        throw new Error('Missing required field: date');
      }
      if (typeof input.formInitial !== 'string') {
        throw new Error('Missing required field: formInitial');
      }
      if (!input.status) {
        throw new Error('Missing required field: status');
      }
      if (typeof input.title !== 'string') {
        throw new Error('Missing required field: title');
      }
      if (!input.entries || !Array.isArray(input.entries)) {
        throw new Error('Missing or invalid required field: entries');
      }
      
      // Route to appropriate table based on form type
      if (isCookingCoolingForm(form)) {
        // Use cooking and cooling table
        const existingForm = await this.getPaperForm(form.id, form.formType);
        console.log('Existing form found:', existingForm ? 'Yes' : 'No');
        
  if (existingForm) {
          console.log('Updating existing cooking/cooling form...');
          try {
            // Remove fields not present in the Update input type (backend schema may not include approval fields yet)
            const graphqlInput = { ...input };
            if ('approvedBy' in graphqlInput) { delete (graphqlInput as any).approvedBy; console.log('Stripped approvedBy from GraphQL update input'); }
            if ('approvedAt' in graphqlInput) { delete (graphqlInput as any).approvedAt; console.log('Stripped approvedAt from GraphQL update input'); }
            const result = await client.graphql({
              query: `mutation UpdateCookingCoolingFormEntry($input: UpdateCookingCoolingFormEntryInput!) {
                updateCookingCoolingFormEntry(input: $input) { id }
              }`,
              variables: { input: graphqlInput }
            });
            console.log('Update result:', result);
          } catch (graphqlError) {
            const errObj: any = graphqlError || {};
            const gqlErrors = errObj.errors || errObj.graphQLErrors || (errObj.response && errObj.response.errors) || undefined;
            const message = errObj.message || (Array.isArray(gqlErrors) && gqlErrors.length > 0 ? gqlErrors.map((e: any) => e.message || String(e)).join('; ') : (typeof errObj === 'string' ? errObj : 'Unknown GraphQL error'));
            try {
              console.error('GraphQL update error (cooking/cooling) - detailed:', safeStringify(errObj));
            } catch (e) {
              console.error('GraphQL update error (cooking/cooling):', errObj);
            }

            // Fallback: attempt to create the form if update failed (helps when record isn't present or update mutation misbehaves)
            try {
              console.log('Attempting fallback create for cooking/cooling form after update failure...');
              const createResult = await client.graphql({
                query: `mutation CreateCookingCoolingFormEntry($input: CreateCookingCoolingFormEntryInput!) { createCookingCoolingFormEntry(input: $input) { id } }`,
                variables: { input }
              });
              console.log('Fallback create result:', createResult);
              const returnedId = (createResult as any)?.data?.createCookingCoolingFormEntry?.id;
              if (returnedId) {
                form.id = returnedId;
                input.id = returnedId;
                console.log('Fallback create succeeded, updated form id to:', returnedId);
                return;
              }
            } catch (createErr) {
              console.error('Fallback create also failed (cooking/cooling):', createErr);
            }

            throw new Error(`Failed to update cooking/cooling form: ${message}`);
          }
        } else {
          console.log('Creating new cooking/cooling form...');
          try {
            // Request a server-assigned serialized id, falling back if not available
            const serverId = await requestNextFormIdFromServer();
            // Update both the form input and the original form object id so
            // callers can learn the final assigned id.
            input.id = serverId;
            form.id = serverId;

            // Log the full input object for debugging
            console.log('GraphQL create input (cooking/cooling):', input);
            // Strip unknown fields before create as well (schema may not accept approval metadata)
            const createInput = { ...input };
            if ('approvedBy' in createInput) { delete (createInput as any).approvedBy; console.log('Stripped approvedBy from GraphQL create input'); }
            if ('approvedAt' in createInput) { delete (createInput as any).approvedAt; console.log('Stripped approvedAt from GraphQL create input'); }
            const result = await client.graphql({
              query: `mutation CreateCookingCoolingFormEntry($input: CreateCookingCoolingFormEntryInput!) {
                createCookingCoolingFormEntry(input: $input) { id }
              }`,
              variables: { input: createInput }
            });
            console.log('Create result:', result);

            // If server returned a different id, prefer the server value and
            // update the in-memory form as well.
            const returnedId = (result as any)?.data?.createCookingCoolingFormEntry?.id;
            if (returnedId && returnedId !== serverId) {
              console.log('Server returned different id, updating form id to server value:', returnedId);
              form.id = returnedId;
            }
          } catch (graphqlError) {
            // Normalize the error object
            const errObj: any = graphqlError || {};
            const gqlErrors = errObj.errors || errObj.graphQLErrors || (errObj.response && errObj.response.errors) || undefined;
            const message = errObj.message || errObj.msg || (Array.isArray(gqlErrors) && gqlErrors.length > 0 ? gqlErrors.map((e: any) => e.message || String(e)).join('; ') : (typeof errObj === 'string' ? errObj : 'Unknown GraphQL error'));

            // Log a stringified version first so Next DevTools and other consoles show useful content
            try {
              console.error('Raw caught GraphQL error (cooking/cooling):', safeStringify({ message, gqlErrors, stack: errObj.stack || undefined }));
            } catch (e) {
              // Fallback to safer logging if stringify fails
              console.error('Raw caught GraphQL error (cooking/cooling):', message, { gqlErrors });
            }

            // Also log the original object for developers who inspect the console
            console.error('Full GraphQL error object (developer):', errObj);
            console.error('GraphQL create error while creating cooking/cooling form - input preview:', { id: input.id, title: input.title, entriesCount: input.entries?.length });

            // Build a more informative thrown Error that preserves relevant info
            const thrownMessage = `Failed to create cooking/cooling form: ${message}${gqlErrors ? ' | GraphQLErrors: ' + safeStringify(gqlErrors) : ''}`;
            const newError: any = new Error(thrownMessage);
            // Merge original stack if available for better debugging
            if (errObj && errObj.stack) {
              newError.stack = `${errObj.stack}\n---\n${newError.stack}`;
            }
            throw newError;
          }
        }
      } else if (isPiroshkiForm(form)) {
        // Use Piroshki table
        const existingForm = await this.getPaperForm(form.id, form.formType);
        console.log('Existing form found:', existingForm ? 'Yes' : 'No');
        
  if (existingForm) {
          console.log('Updating existing piroshki form...');
          try {
            const graphqlInput = { ...input };
            if ('approvedBy' in graphqlInput) { delete (graphqlInput as any).approvedBy; console.log('Stripped approvedBy from GraphQL update input (piroshki)'); }
            if ('approvedAt' in graphqlInput) { delete (graphqlInput as any).approvedAt; console.log('Stripped approvedAt from GraphQL update input (piroshki)'); }
            const result = await client.graphql({
              query: `mutation UpdatePiroshkiFormEntry($input: UpdatePiroshkiFormEntryInput!) {
                updatePiroshkiFormEntry(input: $input) { id }
              }`,
              variables: { input: graphqlInput }
            });
            console.log('Update result:', result);
          } catch (graphqlError) {
            const errObj: any = graphqlError || {};
            const gqlErrors = errObj.errors || errObj.graphQLErrors || (errObj.response && errObj.response.errors) || undefined;
            const message = errObj.message || (Array.isArray(gqlErrors) && gqlErrors.length > 0 ? gqlErrors.map((e: any) => e.message || String(e)).join('; ') : (typeof errObj === 'string' ? errObj : 'Unknown GraphQL error'));
            try {
              console.error('GraphQL update error (piroshki) - detailed:', safeStringify(errObj));
            } catch (e) {
              console.error('GraphQL update error (piroshki):', errObj);
            }

            try {
              console.log('Attempting fallback create for piroshki form after update failure...');
              const createResult = await client.graphql({
                query: `mutation CreatePiroshkiFormEntry($input: CreatePiroshkiFormEntryInput!) { createPiroshkiFormEntry(input: $input) { id } }`,
                variables: { input }
              });
              console.log('Fallback create result (piroshki):', createResult);
              const returnedId = (createResult as any)?.data?.createPiroshkiFormEntry?.id;
              if (returnedId) {
                form.id = returnedId;
                input.id = returnedId;
                console.log('Fallback create succeeded (piroshki), updated form id to:', returnedId);
                return;
              }
            } catch (createErr) {
              console.error('Fallback create also failed (piroshki):', createErr);
            }

            throw new Error(`Failed to update piroshki form: ${message}`);
          }
        } else {
          console.log('Creating new piroshki form...');
          try {
            const serverId = await requestNextFormIdFromServer();
            input.id = serverId;
            form.id = serverId;

            const createInput = { ...input };
            if ('approvedBy' in createInput) { delete (createInput as any).approvedBy; console.log('Stripped approvedBy from GraphQL create input (piroshki)'); }
            if ('approvedAt' in createInput) { delete (createInput as any).approvedAt; console.log('Stripped approvedAt from GraphQL create input (piroshki)'); }
            const result = await client.graphql({
              query: `mutation CreatePiroshkiFormEntry($input: CreatePiroshkiFormEntryInput!) {
                createPiroshkiFormEntry(input: $input) { id }
              }`,
              variables: { input: createInput }
            });
            console.log('Create result:', result);

            const returnedId = (result as any)?.data?.createPiroshkiFormEntry?.id;
            if (returnedId && returnedId !== serverId) {
              console.log('Server returned different id, updating form id to server value:', returnedId);
              form.id = returnedId;
            }
          } catch (graphqlError) {
            const errObj: any = graphqlError || {};
            const message = errObj.message || errObj.msg || (typeof errObj === 'string' ? errObj : 'Unknown GraphQL error');
            const gqlErrors = errObj.errors || errObj.graphQLErrors || (errObj.response && errObj.response.errors) || undefined;
            console.error('GraphQL create error while creating piroshki form:', {
              message,
              gqlErrors,
              errorObject: errObj,
              errorSerialized: safeStringify(errObj),
              inputPreview: { id: input.id, title: input.title, entriesCount: input.entries?.length }
            });
            throw new Error(`Failed to create piroshki form: ${message}`);
          }
        }
      } else if (isBagelDogForm(form)) {
        // Use Bagel Dog table
        const existingForm = await this.getPaperForm(form.id, form.formType);
        console.log('Existing form found:', existingForm ? 'Yes' : 'No');
        
  if (existingForm) {
          console.log('Updating existing bagel dog form...');
          try {
            const graphqlInput = { ...input };
            if ('approvedBy' in graphqlInput) { delete (graphqlInput as any).approvedBy; console.log('Stripped approvedBy from GraphQL update input (bagel dog)'); }
            if ('approvedAt' in graphqlInput) { delete (graphqlInput as any).approvedAt; console.log('Stripped approvedAt from GraphQL update input (bagel dog)'); }
            const result = await client.graphql({
              query: `mutation UpdateBagelDogFormEntry($input: UpdateBagelDogFormEntryInput!) {
                updateBagelDogFormEntry(input: $input) { id }
              }`,
              variables: { input: graphqlInput }
            });
            console.log('Update result:', result);
          } catch (graphqlError) {
            const errObj: any = graphqlError || {};
            const gqlErrors = errObj.errors || errObj.graphQLErrors || (errObj.response && errObj.response.errors) || undefined;
            const message = errObj.message || (Array.isArray(gqlErrors) && gqlErrors.length > 0 ? gqlErrors.map((e: any) => e.message || String(e)).join('; ') : (typeof errObj === 'string' ? errObj : 'Unknown GraphQL error'));
            try {
              console.error('GraphQL update error (bagel dog) - detailed:', safeStringify(errObj));
            } catch (e) {
              console.error('GraphQL update error (bagel dog):', errObj);
            }

            try {
              console.log('Attempting fallback create for bagel dog form after update failure...');
              const createResult = await client.graphql({
                query: `mutation CreateBagelDogFormEntry($input: CreateBagelDogFormEntryInput!) { createBagelDogFormEntry(input: $input) { id } }`,
                variables: { input }
              });
              console.log('Fallback create result (bagel dog):', createResult);
              const returnedId = (createResult as any)?.data?.createBagelDogFormEntry?.id;
              if (returnedId) {
                form.id = returnedId;
                input.id = returnedId;
                console.log('Fallback create succeeded (bagel dog), updated form id to:', returnedId);
                return;
              }
            } catch (createErr) {
              console.error('Fallback create also failed (bagel dog):', createErr);
            }

            throw new Error(`Failed to update bagel dog form: ${message}`);
          }
        } else {
          console.log('Creating new bagel dog form...');
          try {
            const serverId = await requestNextFormIdFromServer();
            input.id = serverId;
            form.id = serverId;

            const createInput = { ...input };
            if ('approvedBy' in createInput) { delete (createInput as any).approvedBy; console.log('Stripped approvedBy from GraphQL create input (bagel dog)'); }
            if ('approvedAt' in createInput) { delete (createInput as any).approvedAt; console.log('Stripped approvedAt from GraphQL create input (bagel dog)'); }
            const result = await client.graphql({
              query: `mutation CreateBagelDogFormEntry($input: CreateBagelDogFormEntryInput!) {
                createBagelDogFormEntry(input: $input) { id }
              }`,
              variables: { input: createInput }
            });
            console.log('Create result:', result);

            const returnedId = (result as any)?.data?.createBagelDogFormEntry?.id;
            if (returnedId && returnedId !== serverId) {
              console.log('Server returned different id, updating form id to server value:', returnedId);
              form.id = returnedId;
            }
          } catch (graphqlError) {
            const errObj: any = graphqlError || {};
            const message = errObj.message || errObj.msg || (typeof errObj === 'string' ? errObj : 'Unknown GraphQL error');
            const gqlErrors = errObj.errors || errObj.graphQLErrors || (errObj.response && errObj.response.errors) || undefined;
            console.error('GraphQL create error while creating bagel dog form:', {
              message,
              gqlErrors,
              errorObject: errObj,
              errorSerialized: safeStringify(errObj),
              inputPreview: { id: input.id, title: input.title, entriesCount: input.entries?.length }
            });
            throw new Error(`Failed to create bagel dog form: ${message}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to save paper form:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        name: error instanceof Error ? error.name : 'Unknown error type',
        formData: {
          id: form.id,
          title: form.title,
          formType: form.formType,
          status: form.status
        }
      });
      throw error;
    }
  }

  async getPaperForm(id: string, formType: FormType): Promise<PaperFormEntry | undefined> {
    try {
      console.log(`Getting form from table: ${formType}`);
      
      // Route to appropriate table based on form type
      if (formType === FormType.COOKING_AND_COOLING) {
        const result = await client.graphql({
          query: `query GetCookingCoolingFormEntry($id: ID!) {
            getCookingCoolingFormEntry(id: $id) { id date formInitial status title }
          }`,
          variables: { id }
        }) as GraphQLResult<any>;

        if (result.data?.getCookingCoolingFormEntry) {
          return mapGraphQLResultToPaperFormEntry(result.data.getCookingCoolingFormEntry, formType);
        }
      } else if (formType === FormType.PIROSHKI_CALZONE_EMPANADA) {
        const result = await client.graphql({
          query: `query GetPiroshkiFormEntry($id: ID!) {
            getPiroshkiFormEntry(id: $id) { id date formInitial status title }
          }`,
          variables: { id }
        }) as GraphQLResult<any>;

        if (result.data?.getPiroshkiFormEntry) {
          return mapGraphQLResultToPaperFormEntry(result.data.getPiroshkiFormEntry, formType);
        }
      } else if (formType === FormType.BAGEL_DOG_COOKING_COOLING) {
        const result = await client.graphql({
          query: `query GetBagelDogFormEntry($id: ID!) {
            getBagelDogFormEntry(id: $id) { id date formInitial status title }
          }`,
          variables: { id }
        }) as GraphQLResult<any>;

        if (result.data?.getBagelDogFormEntry) {
          return mapGraphQLResultToPaperFormEntry(result.data.getBagelDogFormEntry, formType);
        }
      }
      
      return undefined;
    } catch (error) {
      console.error('Error getting paper form:', error);
      return undefined;
    }
  }

  async getPaperForms(): Promise<PaperFormEntry[]> {
    try {
      const allForms: PaperFormEntry[] = [];
      
      console.log('🔍 Starting to fetch all paper forms from all tables...');
      
      // Get forms from all tables
      const [cookingForms, piroshkiForms, bagelDogForms] = await Promise.all([
        this.getCookingCoolingForms(),
        this.getPiroshkiForms(),
        this.getBagelDogForms()
      ]);
      
      console.log('🔍 Forms retrieved from tables:', {
        cookingForms: cookingForms.length,
        piroshkiForms: piroshkiForms.length,
        bagelDogForms: bagelDogForms.length
      });
      
      // Log the form types being returned from each table
      if (cookingForms.length > 0) {
        console.log('🔍 Cooking forms types:', cookingForms.map(f => ({ id: f.id, type: f.formType, title: f.title })));
      }
      if (piroshkiForms.length > 0) {
        console.log('🔍 Piroshki forms types:', piroshkiForms.map(f => ({ id: f.id, type: f.formType, title: f.title })));
      }
      if (bagelDogForms.length > 0) {
        console.log('🔍 Bagel dog forms types:', bagelDogForms.map(f => ({ id: f.id, type: f.formType, title: f.title })));
      }
      
      allForms.push(...cookingForms, ...piroshkiForms, ...bagelDogForms);
      
      console.log('🔍 Total forms returned:', allForms.length);
      console.log('🔍 Final form types:', allForms.map(f => ({ id: f.id, type: f.formType, title: f.title })));
      
      return allForms;
    } catch (error) {
      console.error('Error getting all paper forms:', error);
      return [];
    }
  }

  private async getCookingCoolingForms(): Promise<PaperFormEntry[]> {
    try {
      console.log('Attempting to fetch cooking cooling forms...');
      
      // First, get the basic list of cooking cooling forms
      const listResult = await client.graphql({
        query: `query ListCookingCoolingFormEntries {
          listCookingCoolingFormEntries {
            items {
              id
              date
              dateCreated
              lastTextEntry
              formInitial
              status
              title
              thermometerNumber
              ingredients
              lotNumbers
              correctiveActionsComments
              resolvedErrors
              createdAt
              updatedAt
            }
          }
        }`
      }) as GraphQLResult<any>;

      console.log('Cooking cooling forms list result:', listResult);

      if (!listResult.data?.listCookingCoolingFormEntries?.items) {
        console.log('No cooking cooling forms found in list result');
        return [];
      }

      // For each form, fetch the complete details including entries
      const formsWithDetails = await Promise.all(
        listResult.data.listCookingCoolingFormEntries.items.map(async (item: any) => {
          try {
            const detailResult = await client.graphql({
              query: `query GetCookingCoolingFormEntry($id: ID!) {
                getCookingCoolingFormEntry(id: $id) {
                  id
                  date
                  dateCreated
                  lastTextEntry
                  formInitial
                  status
                  title
                  entries {
                    type
                    rack
                    ccp1 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    ccp2 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    coolingTo80 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    coolingTo54 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    finalChill {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                  }
                  thermometerNumber
                  ingredients
                  lotNumbers
                  correctiveActionsComments
                  adminComments {
                    id
                    adminInitial
                    timestamp
                    comment
                  }
                  resolvedErrors
                  createdAt
                  updatedAt
                }
              }`,
              variables: { id: item.id }
            }) as GraphQLResult<any>;

            if (detailResult.data?.getCookingCoolingFormEntry) {
              return detailResult.data.getCookingCoolingFormEntry;
            }
            return item; // Fallback to basic item if detail fetch fails
          } catch (detailError) {
            console.warn(`Failed to fetch details for cooking cooling form ${item.id}:`, detailError);
            return item; // Fallback to basic item
          }
        })
      );

      // IMPORTANT: Only return forms that are actually of type COOKING_AND_COOLING
      // The cooking cooling table should only contain forms of this type
      const forms = formsWithDetails
        .filter((item: any) => {
          // Check if this form has the structure of a cooking cooling form
          // and doesn't have piroshki-specific fields
          const hasPiroshkiFields = item.quantityAndFlavor || item.preShipmentReview;
          const hasBagelDogFields = item.frankFlavorSizeTable || item.bagelDogPreShipmentReview;
          
          if (hasPiroshkiFields || hasBagelDogFields) {
            console.warn(`Form ${item.id} found in cooking cooling table but has fields from other form types. This suggests a data inconsistency.`);
            return false; // Skip forms that don't belong in this table
          }
          
          return true; // Include forms that belong in this table
        })
        .map((item: any) => 
          mapGraphQLResultToPaperFormEntry(item, FormType.COOKING_AND_COOLING)
        );

      console.log(`Retrieved ${forms.length} cooking cooling forms from table`);
      return forms;
    } catch (error) {
      console.error('Error getting cooking cooling forms:', error);
      return [];
    }
  }

  private async getPiroshkiForms(): Promise<PaperFormEntry[]> {
    try {
      console.log('Attempting to fetch piroshki forms...');
      
      // First, get the basic list of piroshki forms
      const listResult = await client.graphql({
        query: `query ListPiroshkiFormEntries {
          listPiroshkiFormEntries {
            items {
              id
              date
              dateCreated
              lastTextEntry
              formInitial
              status
              title
              thermometerNumber
              ingredients
              lotNumbers
              correctiveActionsComments
              quantityAndFlavor
              resolvedErrors
              createdAt
              updatedAt
            }
          }
        }`
      }) as GraphQLResult<any>;

      console.log('Piroshki forms list result:', listResult);

      if (!listResult.data?.listPiroshkiFormEntries?.items) {
        console.log('No piroshki forms found in list result');
        return [];
      }

      // For each form, fetch the complete details including entries
      const formsWithDetails = await Promise.all(
        listResult.data.listPiroshkiFormEntries.items.map(async (item: any) => {
          try {
            const detailResult = await client.graphql({
              query: `query GetPiroshkiFormEntry($id: ID!) {
                getPiroshkiFormEntry(id: $id) {
                  id
                  date
                  dateCreated
                  lastTextEntry
                  formInitial
                  status
                  title
                  entries {
                    type
                    rack
                    heatTreating {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                      type
                    }
                    ccp2_126 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    ccp2_80 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    ccp2_55 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    ccp1 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    ccp2 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    coolingTo80 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    coolingTo54 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    finalChill {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                  }
                  thermometerNumber
                  ingredients
                  lotNumbers
                  correctiveActionsComments
                  quantityAndFlavor
                  preShipmentReview {
                    date
                    initials
                    results
                  }
                  adminComments {
                    id
                    adminInitial
                    timestamp
                    comment
                  }
                  resolvedErrors
                  createdAt
                  updatedAt
                }
              }`,
              variables: { id: item.id }
            }) as GraphQLResult<any>;

            if (detailResult.data?.getPiroshkiFormEntry) {
              return detailResult.data.getPiroshkiFormEntry;
            }
            return item; // Fallback to basic item if detail fetch fails
          } catch (detailError) {
            console.warn(`Failed to fetch details for piroshki form ${item.id}:`, detailError);
            return item; // Fallback to basic item
          }
        })
      );

      // IMPORTANT: Only return forms that are actually of type PIROSHKI_CALZONE_EMPANADA
      // The piroshki table should only contain forms of this type
      const forms = formsWithDetails
        .filter((item: any) => {
          // Check if this form has the structure of a piroshki form
          // and doesn't have fields from other form types
          const hasPiroshkiFields = item.quantityAndFlavor || item.preShipmentReview;
          const hasBagelDogFields = item.frankFlavorSizeTable || item.bagelDogPreShipmentReview;
          
          if (!hasPiroshkiFields || hasBagelDogFields) {
            console.warn(`Form ${item.id} found in piroshki table but doesn't have piroshki-specific fields or has bagel dog fields. This suggests a data inconsistency.`);
            return false; // Skip forms that don't belong in this table
          }
          
          return true; // Include forms that belong in this table
        })
        .map((item: any) => 
          mapGraphQLResultToPaperFormEntry(item, FormType.PIROSHKI_CALZONE_EMPANADA)
        );

      console.log(`Retrieved ${forms.length} piroshki forms from table`);
      return forms;
    } catch (error) {
      console.error('Error getting piroshki forms:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      return [];
    }
  }

  private async getBagelDogForms(): Promise<PaperFormEntry[]> {
    try {
      console.log('Attempting to fetch bagel dog forms...');
      
      // First, get the basic list of bagel dog forms
      const listResult = await client.graphql({
        query: `query ListBagelDogFormEntries {
          listBagelDogFormEntries {
            items {
              id
              date
              dateCreated
              lastTextEntry
              formInitial
              status
              title
              thermometerNumber
              ingredients
              lotNumbers
              correctiveActionsComments
              frankFlavorSizeTable
              resolvedErrors
              createdAt
              updatedAt
            }
          }
        }`
      }) as GraphQLResult<any>;

      console.log('Bagel dog forms list result:', listResult);

      if (!listResult.data?.listBagelDogFormEntries?.items) {
        console.log('No bagel dog forms found in list result');
        return [];
      }

      // For each form, fetch the complete details including entries
      const formsWithDetails = await Promise.all(
        listResult.data.listBagelDogFormEntries.items.map(async (item: any) => {
          try {
            const detailResult = await client.graphql({
              query: `query GetBagelDogFormEntry($id: ID!) {
                getBagelDogFormEntry(id: $id) {
                  id
                  date
                  dateCreated
                  lastTextEntry
                  formInitial
                  status
                  title
                  entries {
                    type
                    rack
                    ccp1 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    ccp2 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    coolingTo80 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    coolingTo54 {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                    finalChill {
                      temperature
                      time
                      isValid
                      correctiveAction
                      employeeInitials
                      notes
                      dataLog
                    }
                  }
                  thermometerNumber
                  ingredients
                  lotNumbers
                  correctiveActionsComments
                  frankFlavorSizeTable
                  bagelDogPreShipmentReview {
                    date
                    results
                    signature
                  }
                  adminComments {
                    id
                    adminInitial
                    timestamp
                    comment
                  }
                  resolvedErrors
                  createdAt
                  updatedAt
                }
              }`,
              variables: { id: item.id }
            }) as GraphQLResult<any>;

            if (detailResult.data?.getBagelDogFormEntry) {
              return detailResult.data.getBagelDogFormEntry;
            }
            return item; // Fallback to basic item if detail fetch fails
          } catch (detailError) {
            console.warn(`Failed to fetch details for bagel dog form ${item.id}:`, detailError);
            return item; // Fallback to basic item
          }
        })
      );

      // IMPORTANT: Only return forms that are actually of type BAGEL_DOG_COOKING_COOLING
      // The bagel dog table should only contain forms of this type
      const forms = formsWithDetails
        .filter((item: any) => {
          // Check if this form has the structure of a bagel dog form
          // and doesn't have fields from other form types
          const hasBagelDogFields = item.frankFlavorSizeTable || item.bagelDogPreShipmentReview;
          const hasPiroshkiFields = item.quantityAndFlavor || item.preShipmentReview;
          
          if (!hasBagelDogFields || hasPiroshkiFields) {
            console.warn(`Form ${item.id} found in bagel dog table but doesn't have bagel dog-specific fields or has piroshki fields. This suggests a data inconsistency.`);
            return false; // Skip forms that don't belong in this table
          }
          
          return true; // Include forms that belong in this table
        })
        .map((item: any) => 
          mapGraphQLResultToPaperFormEntry(item, FormType.BAGEL_DOG_COOKING_COOLING)
        );

      console.log(`Retrieved ${forms.length} bagel dog forms from table`);
      return forms;
    } catch (error) {
      console.error('Error getting bagel dog forms:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      return [];
    }
  }

  // Additional methods for specific form types can be added here
  // For now, implementing the basic interface
  async savePaperForms(forms: PaperFormEntry[]): Promise<void> {
    await Promise.all(forms.map(form => this.savePaperForm(form)));
  }

  async deletePaperForm(id: string, formType: FormType): Promise<void> {
    try {
      console.log(`Deleting form ${id} from table for type ${formType}`);
      
      let mutation: string;
      
      switch (formType) {
        case FormType.COOKING_AND_COOLING:
          mutation = `mutation DeleteCookingCoolingFormEntry($input: DeleteCookingCoolingFormEntryInput!) {
            deleteCookingCoolingFormEntry(input: $input) { id }
          }`;
          break;
        case FormType.PIROSHKI_CALZONE_EMPANADA:
          mutation = `mutation DeletePiroshkiFormEntry($input: DeletePiroshkiFormEntryInput!) {
            deletePiroshkiFormEntry(input: $input) { id }
          }`;
          break;
        case FormType.BAGEL_DOG_COOKING_COOLING:
          mutation = `mutation DeleteBagelDogFormEntry($input: DeleteBagelDogFormEntryInput!) {
            deleteBagelDogFormEntry(input: $input) { id }
          }`;
          break;
        default:
          throw new Error(`Unknown form type: ${formType}`);
      }
      
      console.log(`Executing mutation for form type ${formType}:`, mutation);
      console.log(`Variables:`, { input: { id } });
      
      const result = await client.graphql({
        query: mutation,
        variables: { input: { id } }
      }) as GraphQLResult<any>;
      
      console.log(`Successfully deleted form ${id} from ${formType} table:`, result);
    } catch (error) {
      console.error(`Error deleting form ${id} from ${formType} table:`, error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
      throw error; // Re-throw to let the caller handle it
    }
  }

  async clearAllPaperForms(): Promise<void> {
    // Implementation would clear all tables
    console.log('Clearing all paper forms from all tables');
  }


}

export const multiDatabaseStorageManager = new MultiTableStorageManager();

