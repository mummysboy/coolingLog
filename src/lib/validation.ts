import { PaperFormEntry, PaperFormRow } from './paperFormTypes';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface CellValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Array<{
    rowIndex: number;
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    compliantEntries: number;
    totalEntries: number;
  };
}

// Temperature validation rules based on the form requirements
export const TEMPERATURE_RULES = {
  // CCP 1 - Temperature Must reach 166°F or greater
  ccp1: {
    min: 166,
    description: 'Temperature must reach 166°F or greater (CCP 1)'
  },
  // CCP 2 - 127°F or greater
  ccp2: {
    min: 127,
    description: '127°F or greater (CCP 2)'
  },
  // 80°F or below within 105 minutes
  coolingTo80: {
    max: 80,
    timeLimit: 105, // minutes
    description: '80°F or below within 105 minutes (CCP 2)'
  },
  // 54°F or below within 4.75 hours
  coolingTo54: {
    max: 54,
    timeLimit: 4.75, // hours
    description: '54°F or below within 4.75 hours'
  },
  // Final chill - 39°F or below
  finalChill: {
    max: 39,
    description: 'Chill continuously to 39°F or below'
  }
};

// Parse temperature value (handles both string and number inputs)
export function parseTemperature(temp: string): number | null {
  if (!temp || temp.trim() === '') return null;
  const parsed = parseFloat(temp.replace(/[^\d.-]/g, ''));
  return isNaN(parsed) ? null : parsed;
}

// Parse time value and convert to minutes from start of day
export function parseTime(timeStr: string): number | null {
  if (!timeStr || timeStr.trim() === '') return null;
  
  const timePattern = /^(\d{1,2}):(\d{2})$/;
  const match = timeStr.match(timePattern);
  
  if (!match) return null;
  
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  
  return hours * 60 + minutes;
}

// Calculate time difference in minutes
export function getTimeDifferenceMinutes(startTime: string, endTime: string): number | null {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  if (start === null || end === null) return null;
  
  let diff = end - start;
  // Handle times crossing midnight
  if (diff < 0) {
    diff += 24 * 60; // Add 24 hours in minutes
  }
  
  return diff;
}

// Validate a single temperature cell
export function validateTemperatureCell(
  temp: string,
  stage: keyof typeof TEMPERATURE_RULES,
  referenceTime?: string,
  comparisonTime?: string
): CellValidationResult {
  const temperature = parseTemperature(temp);
  const rule = TEMPERATURE_RULES[stage];
  
  if (temperature === null) {
    return { isValid: true }; // Empty values are not errors, just incomplete
  }
  
  // Check temperature bounds
  if ('min' in rule && rule.min !== undefined && temperature < rule.min) {
    return {
      isValid: false,
      error: `Temperature ${temperature}°F is below minimum required ${rule.min}°F`
    };
  }
  
  if ('max' in rule && rule.max !== undefined && temperature > rule.max) {
    return {
      isValid: false,
      error: `Temperature ${temperature}°F is above maximum allowed ${rule.max}°F`
    };
  }
  
  // Check time limits for cooling stages
  if ('timeLimit' in rule && rule.timeLimit && referenceTime && comparisonTime) {
    const timeDiff = getTimeDifferenceMinutes(referenceTime, comparisonTime);
    
    if (timeDiff !== null) {
      const timeLimitMinutes = stage === 'coolingTo54' 
        ? rule.timeLimit * 60 // Convert hours to minutes for 54°F stage
        : rule.timeLimit; // Already in minutes for 80°F stage
      
      if (timeDiff > timeLimitMinutes) {
        const unit = stage === 'coolingTo54' ? 'hours' : 'minutes';
        const displayTime = stage === 'coolingTo54' 
          ? (timeDiff / 60).toFixed(2) 
          : timeDiff.toString();
        
        return {
          isValid: false,
          error: `Time limit exceeded: ${displayTime} ${unit} (limit: ${rule.timeLimit} ${unit})`
        };
      }
    }
  }
  
  return { isValid: true };
}

// Validate a complete form row
export function validateFormRow(row: PaperFormRow, rowIndex: number): FormValidationResult['errors'] {
  const errors: FormValidationResult['errors'] = [];
  
  // Skip validation if row has no data
  if (!row.type && !row.ccp1.temp && !row.ccp2.temp && 
      !row.coolingTo80.temp && !row.coolingTo54.temp && !row.finalChill.temp) {
    return errors;
  }
  
  // Validate CCP1 temperature
  if (row.ccp1.temp) {
    const result = validateTemperatureCell(row.ccp1.temp, 'ccp1');
    if (!result.isValid && result.error) {
      errors.push({
        rowIndex,
        field: 'ccp1.temp',
        message: result.error,
        severity: 'error'
      });
    }
  }
  
  // Validate CCP2 temperature
  if (row.ccp2.temp) {
    const result = validateTemperatureCell(row.ccp2.temp, 'ccp2');
    if (!result.isValid && result.error) {
      errors.push({
        rowIndex,
        field: 'ccp2.temp',
        message: result.error,
        severity: 'error'
      });
    }
  }
  
  // Validate cooling to 80°F with time check
  if (row.coolingTo80.temp) {
    const result = validateTemperatureCell(
      row.coolingTo80.temp,
      'coolingTo80',
      row.ccp2.time,
      row.coolingTo80.time
    );
    if (!result.isValid && result.error) {
      errors.push({
        rowIndex,
        field: 'coolingTo80.temp',
        message: result.error,
        severity: 'error'
      });
    }
  }
  
  // Validate cooling to 54°F with time check
  if (row.coolingTo54.temp) {
    const result = validateTemperatureCell(
      row.coolingTo54.temp,
      'coolingTo54',
      row.coolingTo80.time || row.ccp2.time,
      row.coolingTo54.time
    );
    if (!result.isValid && result.error) {
      errors.push({
        rowIndex,
        field: 'coolingTo54.temp',
        message: result.error,
        severity: 'error'
      });
    }
  }
  
  // Validate final chill temperature
  if (row.finalChill.temp) {
    const result = validateTemperatureCell(row.finalChill.temp, 'finalChill');
    if (!result.isValid && result.error) {
      errors.push({
        rowIndex,
        field: 'finalChill.temp',
        message: result.error,
        severity: 'error'
      });
    }
  }
  
  // Additional validation: check logical temperature progression
  if (row.ccp1.temp && row.ccp2.temp) {
    const ccp1Temp = parseTemperature(row.ccp1.temp);
    const ccp2Temp = parseTemperature(row.ccp2.temp);
    
    if (ccp1Temp && ccp2Temp && ccp2Temp > ccp1Temp) {
      errors.push({
        rowIndex,
        field: 'ccp2.temp',
        message: `CCP2 temperature (${ccp2Temp}°F) should not be higher than CCP1 temperature (${ccp1Temp}°F)`,
        severity: 'warning'
      });
    }
  }
  
  return errors;
}

// Validate entire form
export function validateForm(form: PaperFormEntry): FormValidationResult {
  let allErrors: FormValidationResult['errors'] = [];
  let compliantEntries = 0;
  let totalEntries = 0;
  
  form.entries.forEach((row, index) => {
    // Count entries that have any data
    const hasData = row.type || row.ccp1.temp || row.ccp2.temp || 
                   row.coolingTo80.temp || row.coolingTo54.temp || row.finalChill.temp;
    
    if (hasData) {
      totalEntries++;
      const rowErrors = validateFormRow(row, index);
      allErrors = allErrors.concat(rowErrors);
      
      // Count as compliant if no errors (warnings are ok)
      if (rowErrors.filter(e => e.severity === 'error').length === 0) {
        compliantEntries++;
      }
    }
  });
  
  const totalErrors = allErrors.filter(e => e.severity === 'error').length;
  const totalWarnings = allErrors.filter(e => e.severity === 'warning').length;
  
  return {
    isValid: totalErrors === 0,
    errors: allErrors,
    summary: {
      totalErrors,
      totalWarnings,
      compliantEntries,
      totalEntries
    }
  };
}

// Check if a specific cell should be highlighted
export function shouldHighlightCell(
  form: PaperFormEntry,
  rowIndex: number,
  field: string
): { highlight: boolean; severity: 'error' | 'warning' | null } {
  const validation = validateForm(form);
  const cellError = validation.errors.find(
    error => error.rowIndex === rowIndex && error.field === field
  );
  
  if (cellError) {
    return {
      highlight: true,
      severity: cellError.severity
    };
  }
  
  return {
    highlight: false,
    severity: null
  };
}

// Get validation errors for a specific form (for admin dashboard)
export function getFormValidationSummary(form: PaperFormEntry): {
  hasErrors: boolean;
  errorCount: number;
  warningCount: number;
  complianceRate: number;
  errors: Array<{ message: string; severity: 'error' | 'warning' }>;
} {
  const validation = validateForm(form);
  
  return {
    hasErrors: !validation.isValid,
    errorCount: validation.summary.totalErrors,
    warningCount: validation.summary.totalWarnings,
    complianceRate: validation.summary.totalEntries > 0 
      ? (validation.summary.compliantEntries / validation.summary.totalEntries) * 100 
      : 0,
    errors: validation.errors.map(error => ({
      message: `Row ${error.rowIndex + 1}: ${error.message}`,
      severity: error.severity
    }))
  };
}
