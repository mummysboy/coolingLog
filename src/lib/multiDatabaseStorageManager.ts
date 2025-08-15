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
          type: entry.heatTreating.type || ''
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
        initial: entry.finalChill?.employeeInitials || '',
        dataLog: entry.finalChill?.dataLog || false
      }
    })),
    thermometerNumber: result.thermometerNumber || '',
    ingredients: parsedIngredients,
    lotNumbers: parsedLotNumbers,
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
        console.error('GraphQL client connectivity test failed:', testError);
        throw new Error(`GraphQL client connectivity issue: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
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
            const result = await client.graphql({
              query: `mutation UpdateCookingCoolingFormEntry($input: UpdateCookingCoolingFormEntryInput!) {
                updateCookingCoolingFormEntry(input: $input) { id }
              }`,
              variables: { input }
            });
            console.log('Update result:', result);
          } catch (graphqlError) {
            console.error('GraphQL update error:', graphqlError);
            throw new Error(`Failed to update cooking/cooling form: ${graphqlError instanceof Error ? graphqlError.message : 'Unknown error'}`);
          }
        } else {
          console.log('Creating new cooking/cooling form...');
          try {
            const result = await client.graphql({
              query: `mutation CreateCookingCoolingFormEntry($input: CreateCookingCoolingFormEntryInput!) {
                createCookingCoolingFormEntry(input: $input) { id }
              }`,
              variables: { input }
            });
            console.log('Create result:', result);
          } catch (graphqlError) {
            console.error('GraphQL create error:', graphqlError);
            throw new Error(`Failed to create cooking/cooling form: ${graphqlError instanceof Error ? graphqlError.message : 'Unknown error'}`);
          }
        }
      } else if (isPiroshkiForm(form)) {
        // Use Piroshki table
        const existingForm = await this.getPaperForm(form.id, form.formType);
        console.log('Existing form found:', existingForm ? 'Yes' : 'No');
        
        if (existingForm) {
          console.log('Updating existing piroshki form...');
          try {
            const result = await client.graphql({
              query: `mutation UpdatePiroshkiFormEntry($input: UpdatePiroshkiFormEntryInput!) {
                updatePiroshkiFormEntry(input: $input) { id }
              }`,
              variables: { input }
            });
            console.log('Update result:', result);
          } catch (graphqlError) {
            console.error('GraphQL update error:', graphqlError);
            throw new Error(`Failed to update piroshki form: ${graphqlError instanceof Error ? graphqlError.message : 'Unknown error'}`);
          }
        } else {
          console.log('Creating new piroshki form...');
          try {
            const result = await client.graphql({
              query: `mutation CreatePiroshkiFormEntry($input: CreatePiroshkiFormEntryInput!) {
                createPiroshkiFormEntry(input: $input) { id }
              }`,
              variables: { input }
            });
            console.log('Create result:', result);
          } catch (graphqlError) {
            console.error('GraphQL create error:', graphqlError);
            throw new Error(`Failed to create piroshki form: ${graphqlError instanceof Error ? graphqlError.message : 'Unknown error'}`);
          }
        }
      } else if (isBagelDogForm(form)) {
        // Use Bagel Dog table
        const existingForm = await this.getPaperForm(form.id, form.formType);
        console.log('Existing form found:', existingForm ? 'Yes' : 'No');
        
        if (existingForm) {
          console.log('Updating existing bagel dog form...');
          try {
            const result = await client.graphql({
              query: `mutation UpdateBagelDogFormEntry($input: UpdateBagelDogFormEntryInput!) {
                updateBagelDogFormEntry(input: $input) { id }
              }`,
              variables: { input }
            });
            console.log('Update result:', result);
          } catch (graphqlError) {
            console.error('GraphQL update error:', graphqlError);
            throw new Error(`Failed to update bagel dog form: ${graphqlError instanceof Error ? graphqlError.message : 'Unknown error'}`);
          }
        } else {
          console.log('Creating new bagel dog form...');
          try {
            const result = await client.graphql({
              query: `mutation CreateBagelDogFormEntry($input: CreateBagelDogFormEntryInput!) {
                createBagelDogFormEntry(input: $input) { id }
              }`,
              variables: { input }
            });
            console.log('Create result:', result);
          } catch (graphqlError) {
            console.error('GraphQL create error:', graphqlError);
            throw new Error(`Failed to create bagel dog form: ${graphqlError instanceof Error ? graphqlError.message : 'Unknown error'}`);
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
      
      // Get forms from all tables
      const [cookingForms, piroshkiForms, bagelDogForms] = await Promise.all([
        this.getCookingCoolingForms(),
        this.getPiroshkiForms(),
        this.getBagelDogForms()
      ]);
      
      allForms.push(...cookingForms, ...piroshkiForms, ...bagelDogForms);
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

      const forms = formsWithDetails.map((item: any) => 
        mapGraphQLResultToPaperFormEntry(item, FormType.COOKING_AND_COOLING)
      );
      console.log('Mapped cooking cooling forms:', forms);
      return forms;
    } catch (error) {
      console.error('Error getting cooking cooling forms:', error);
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

      const forms = formsWithDetails.map((item: any) => 
        mapGraphQLResultToPaperFormEntry(item, FormType.PIROSHKI_CALZONE_EMPANADA)
      );
      console.log('Mapped piroshki forms:', forms);
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

      const forms = formsWithDetails.map((item: any) => 
        mapGraphQLResultToPaperFormEntry(item, FormType.BAGEL_DOG_COOKING_COOLING)
      );
      console.log('Mapped bagel dog forms:', forms);
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

