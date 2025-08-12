'use client';

import React from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperFormEntry, FormType, ensureDate } from '@/lib/paperFormTypes';
import { shouldHighlightCell, validateForm, getTimeDifferenceMinutes } from '@/lib/validation';
import { TimePicker } from './TimePicker';


interface PaperFormProps {
  formData?: PaperFormEntry;
  readOnly?: boolean;
  onSave?: () => void;
  onFormUpdate?: (formId: string, updates: Partial<PaperFormEntry>) => void;
}

export function PaperForm({ formData, readOnly = false, onSave, onFormUpdate }: PaperFormProps = {}) {
  const { currentForm, updateEntry, updateFormField, updateFormStatus, saveForm, updateAdminForm, savedForms } = usePaperFormStore();

  // Check if we're working with a form from the admin dashboard
  // isAdminForm should only be true when explicitly editing as an admin
  // The current logic was incorrectly treating regular form editing as admin editing
  const isAdminForm = false; // Temporarily disable admin form logic to fix lastTextEntry updates
  
  // For admin forms, always get the latest data from the store
  // For regular forms, use provided formData or fall back to currentForm from store
  const form = React.useMemo(() => {
    if (isAdminForm && formData) {
      return savedForms.find(f => f.id === formData.id) || formData;
    }
    // Always prioritize currentForm from store for real-time updates
    return currentForm || formData;
  }, [isAdminForm, formData, savedForms, currentForm]);
    
  // Track the resolved data snapshot to compare against new changes
  const [resolvedDataSnapshot, setResolvedDataSnapshot] = React.useState<any>(null);
  

  

  
  // NEW: Toast notification state for validation errors
  const [toasts, setToasts] = React.useState<Array<{
    id: string;
    type: 'error' | 'warning' | 'success' | 'info';
    message: string;
    rowIndex?: number;
    stage?: string;
  }>>([]);

  // Helper function to update corrective actions when dataLog is checked/unchecked
  const updateCorrectiveActionsForDataLog = (rowIndex: number, stage: string, dataLog: boolean) => {
    if (!form) return;
    
    const entry = form.entries[rowIndex];
    const rowNumber = rowIndex + 1;
    const type = entry.type || `Row ${rowNumber}`;
    const displayText = entry.type ? `Row ${rowNumber} ${entry.type}` : `Row ${rowNumber}`;
    const stageName = stage === 'ccp1' ? 'CCP1' : 
                     stage === 'ccp2' ? 'CCP2' : 
                     stage === 'coolingTo80' ? '80°F Cooling' : 
                     stage === 'coolingTo54' ? '54°F Cooling' : 
                     stage === 'finalChill' ? 'Final Chill' : stage;
    
    const targetComment = `Check datalog for ${displayText} (${stageName})`;
    const existingComments = form.correctiveActionsComments || '';
    
    if (dataLog) {
      // Add comment if it doesn't already exist
      if (!existingComments.includes(targetComment)) {
        const updatedComments = existingComments 
          ? `${existingComments}\n${targetComment}`
          : targetComment;
        
        handleFormFieldChange('correctiveActionsComments', updatedComments);
      }
    } else {
      // Remove comment if it exists
      if (existingComments.includes(targetComment)) {
        const updatedComments = existingComments
          .split('\n')
          .filter(comment => comment.trim() !== targetComment)
          .join('\n')
          .trim();
        
        handleFormFieldChange('correctiveActionsComments', updatedComments);
      }
    }
  };
  
  // Check if there are unresolved validation errors
  const hasUnresolvedErrors = React.useMemo(() => {
    if (!form) return false;
    const validation = validateForm(form);
    return validation.errors.some(error => {
      const errorId = `${error.rowIndex}-${error.field}-${error.message}`;
      return !(form.resolvedErrors || []).includes(errorId);
    });
  }, [form]);
  
  // Keep typing indicator visible once admin starts typing (until resolved)

  // NEW: Function to show toast notifications
  const showToast = (type: 'error' | 'warning' | 'success' | 'info', message: string, rowIndex?: number, stage?: string) => {
    const toast = {
      id: `toast-${Date.now()}-${Math.random()}`,
      type,
      message,
      rowIndex,
      stage
    };
    
    setToasts(prev => [...prev, toast]);
    
    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 5000);
  };

  // Monitor form status changes
  React.useEffect(() => {
    if (form) {
      console.log('Form status changed to:', form.status, 'Form ID:', form.id);
      
      // If form ID changes, clear the snapshot (different form)
      if (resolvedDataSnapshot && resolvedDataSnapshot.id !== form.id) {
        console.log('Form ID changed, clearing resolved snapshot');
        setResolvedDataSnapshot(null);
      }
    }
  }, [form?.status, form?.id, form?.id, resolvedDataSnapshot]);
  


  // Monitor resolvedDataSnapshot changes
  React.useEffect(() => {
    console.log('resolvedDataSnapshot changed:', !!resolvedDataSnapshot);
    if (resolvedDataSnapshot) {
      console.log('Snapshot has entries:', resolvedDataSnapshot.entries?.length);
    }
  }, [resolvedDataSnapshot]);



  // Function to check if there are new errors compared to the resolved snapshot
  const hasNewErrors = (currentForm: any, resolvedSnapshot: any) => {
    console.log('=== hasNewErrors FUNCTION CALLED ===');
    if (!resolvedSnapshot) {
      console.log('No resolved snapshot, returning false');
      return false;
    }
    
    console.log('Checking for new errors against resolved snapshot...');
    
    // Compare entries to see if there are new errors in newly modified data
    const currentEntries = currentForm.entries || [];
    const resolvedEntries = resolvedSnapshot.entries || [];
    
    for (let i = 0; i < currentEntries.length; i++) {
      const currentEntry = currentEntries[i];
      const resolvedEntry = resolvedEntries[i];
      
      if (!resolvedEntry) continue;
      
      // Check if this row has been modified since resolution
      const stages = ['ccp1', 'ccp2', 'coolingTo80', 'coolingTo54', 'finalChill'];
      
      for (const stage of stages) {
        const currentStage = currentEntry[stage];
        const resolvedStage = resolvedEntry[stage];
        
        if (!currentStage || !resolvedStage) continue;
        
        // Check if any field in this stage has been modified
        const fields = ['temp', 'time', 'initial'];
        for (const field of fields) {
          if (currentStage[field] !== resolvedStage[field]) {
            console.log(`Field ${stage}.${field} at row ${i + 1} was modified: "${resolvedStage[field]}" -> "${currentStage[field]}"`);
            
            // This field was modified, check if it now has validation errors
            const validation = shouldHighlightCell(currentForm, i, `${stage}.${field}`);
            
            // Only flag as new error if:
            // 1. Current field has validation errors AND
            // 2. Resolved field didn't have validation errors (or was empty/invalid)
            const resolvedValidation = shouldHighlightCell(resolvedSnapshot, i, `${stage}.${field}`);
            
            if (validation.highlight && validation.severity === 'error' && 
                (!resolvedValidation.highlight || resolvedValidation.severity !== 'error')) {
              console.log(`New error detected in ${stage}.${field} at row ${i + 1}`);
              console.log(`Resolved field had errors: ${resolvedValidation.highlight && resolvedValidation.severity === 'error'}`);
              return true;
            } else {
              console.log(`No new validation errors in modified field ${stage}.${field} at row ${i + 1}`);
              console.log(`Current validation: ${validation.highlight ? validation.severity : 'none'}`);
              console.log(`Resolved validation: ${resolvedValidation.highlight ? resolvedValidation.severity : 'none'}`);
            }
          }
        }
      }
      
      // Check if type field was modified
      if (currentEntry.type !== resolvedEntry.type) {
        console.log(`Type field at row ${i + 1} was modified: "${resolvedEntry.type}" -> "${currentEntry.type}"`);
        
        const validation = shouldHighlightCell(currentForm, i, 'type');
        
        // Only flag as new error if:
        // 1. Current field has validation errors AND
        // 2. Resolved field didn't have validation errors (or was empty/invalid)
        const resolvedValidation = shouldHighlightCell(resolvedSnapshot, i, 'type');
        
        if (validation.highlight && validation.severity === 'error' && 
            (!resolvedValidation.highlight || resolvedValidation.severity !== 'error')) {
          console.log(`New error detected in type field at row ${i + 1}`);
          console.log(`Resolved type field had errors: ${resolvedValidation.highlight && resolvedValidation.severity === 'error'}`);
          return true;
        } else {
          console.log(`No new validation errors in modified type field at row ${i + 1}`);
          console.log(`Current type validation: ${validation.highlight ? validation.severity : 'none'}`);
          console.log(`Resolved type validation: ${resolvedValidation.highlight ? resolvedValidation.severity : 'none'}`);
        }
      }
    }
    
    // Check form-level fields
    const formFields = ['thermometerNumber', 'lotNumbers'];
    for (const field of formFields) {
      if (JSON.stringify(currentForm[field]) !== JSON.stringify(resolvedSnapshot[field])) {
        console.log(`Form field ${field} was modified`);
        // For form-level fields, we'll be more conservative and only flag if there are actual validation errors
        // rather than just any change
        return false; // Don't immediately flag form field changes as errors
      }
    }
    
    console.log('No new errors detected in modified data');
    return false;
  };

  if (!form) return null;



  const handleCellChange = (rowIndex: number, field: string, value: string | boolean) => {
    console.log('🔍 handleCellChange called:', { rowIndex, field, value, readOnly, isAdminForm, formStatus: form?.status });
    
    if (!readOnly) {
      console.log('🔓 Form is not read-only, proceeding with update');
      if (isAdminForm) {
        console.log('👑 This is an admin form, using updateAdminForm');
        // For admin forms, update the specific form directly
        const updatedEntries = [...form.entries];
        const [section, subField] = field.split('.');
        
        if (subField) {
          const entry = updatedEntries[rowIndex];
          const sectionData = entry[section as keyof typeof entry] as any;
          updatedEntries[rowIndex] = {
            ...entry,
            [section]: {
              ...sectionData,
              [subField]: value,
            },
          };
        } else {
          updatedEntries[rowIndex] = {
            ...updatedEntries[rowIndex],
            [field]: value,
          };
        }
        
        updateAdminForm(form.id, { entries: updatedEntries });
      } else {
        console.log('👤 This is a regular form, will use updateEntry');
        // For regular forms, use the store's updateEntry
        console.log('🚀 About to call updateEntry for regular form:', { rowIndex, field, value });
        try {
          updateEntry(rowIndex, field, value);
          console.log('✅ updateEntry called successfully');
        } catch (error) {
          console.error('❌ Error calling updateEntry:', error);
        }
      }
      

      
      // NEW: Comprehensive validation check when all three fields (temp, time, initial) are complete
      const currentEntry = form.entries[rowIndex];
      const stages = ['ccp1', 'ccp2', 'coolingTo80', 'coolingTo54', 'finalChill'];
      
      // Add a small delay to prevent validation from running on every keystroke
      // Only validate when the user has finished entering data
      setTimeout(() => {
        // Run validation whenever all three fields (temp, time, initial) are complete for any stage
        stages.forEach(stage => {
        const stageData = currentEntry[stage as keyof typeof currentEntry] as any;
        
        // Check if all three fields are complete for this stage (not just truthy, but actually filled in)
        if (stageData && 
            stageData.temp && String(stageData.temp).trim() !== '' && 
            stageData.time && String(stageData.time).trim() !== '' && 
            stageData.initial && String(stageData.initial).trim() !== '') {
          console.log(`=== VALIDATING COMPLETE CELL: ${stage} at row ${rowIndex} ===`);
          
          // Validate temperature against column header rules
          const tempValue = parseFloat(String(stageData.temp));
          if (!isNaN(tempValue)) {
            let validationError = '';
            
            // Check against specific column requirements
            if (stage === 'ccp1') {
              // CCP 1: Temperature Must reach 166°F or greater
              if (tempValue < 166) {
                validationError = `CCP1 temperature ${tempValue}°F is below minimum required 166°F`;
              }
                          } else if (stage === 'ccp2') {
                // CCP 2: 127°F or greater
                if (tempValue < 127) {
                  validationError = `CCP2 temperature ${tempValue}°F is below minimum required 127°F`;
                }
                
                // Check time sequence - CCP2 time must be after CCP1 time
                if (!validationError && stageData.time && currentEntry.ccp1.time) {
                  const timeDiff = getTimeDifferenceMinutes(currentEntry.ccp1.time, stageData.time);
                  if (timeDiff !== null && timeDiff < 0) {
                    validationError = `CCP2 time cannot be before CCP1 time`;
                  }
                }
              } else if (stage === 'coolingTo80') {
              // 80°F Cooling: 80°F or below within 105 minutes
              if (tempValue > 80) {
                validationError = `80°F Cooling temperature ${tempValue}°F is above maximum allowed 80°F`;
              }
              
              // Check time limit - must be within 105 minutes of CCP2 time (previous cell on the left)
              if (!validationError && currentEntry.ccp2.time && stageData.time) {
                const timeDiff = getTimeDifferenceMinutes(currentEntry.ccp2.time, stageData.time);
                if (timeDiff !== null && timeDiff > 105) {
                  validationError = `Time limit exceeded`;
                } else if (timeDiff !== null && timeDiff < 0) {
                  // Prevent negative time differences (coolingTo80 time before CCP2 time)
                  validationError = `Invalid time sequence`;
                }
              } else if (!validationError && !currentEntry.ccp2.time) {
                // Warn if CCP2 time is missing but coolingTo80 time is entered
                validationError = `Missing reference time`;
              }
                          } else if (stage === 'coolingTo54') {
                // 54°F Cooling: 54°F or below within 4.75 hours
                if (tempValue > 54) {
                  validationError = `54°F Cooling temperature ${tempValue}°F is above maximum allowed 54°F`;
                }
                
                // Check time limit - must be within 4.75 hours of CCP2 time (127°F or greater)
                if (!validationError && stageData.time) {
                  const referenceTime = currentEntry.ccp2.time;
                  if (referenceTime) {
                    const timeDiff = getTimeDifferenceMinutes(referenceTime, stageData.time);
                    if (timeDiff !== null && timeDiff > 4.75 * 60) { // Convert 4.75 hours to minutes
                      validationError = `Time limit exceeded`;
                    } else if (timeDiff !== null && timeDiff < 0) {
                      // Prevent negative time differences
                      validationError = `Invalid time sequence`;
                    }
                  } else {
                    validationError = `Missing reference time`;
                  }
                }
            } else if (stage === 'finalChill') {
              // Final Chill: 39°F or below
              if (tempValue > 39) {
                validationError = `Final Chill temperature ${tempValue}°F is above maximum allowed 39°F`;
              }
            }
            
            // If validation error found, log it and update form status
            if (validationError) {
              console.error(`VALIDATION ERROR in ${stage}: ${validationError}`);
              
              console.log(`=== UPDATING FORM STATUS TO ERROR ===`);
              console.log(`Form ID: ${form.id}, Current status: ${form.status}`);
              console.log(`Validation error: ${validationError}`);
              
              // Update form status to 'Error' when validation fails
              if (onFormUpdate) {
                console.log('Calling onFormUpdate with status: Error');
                onFormUpdate(form.id, { status: 'Error' });
              }
              
              if (isAdminForm) {
                console.log('Updating admin form status to Error');
                updateAdminForm(form.id, { status: 'Error' });
              } else {
                console.log('Updating regular form status to Error via store');
                // Use the store's updateFormStatus function directly for immediate effect
                updateFormStatus(form.id, 'Error');
                // Also update the current form status locally for immediate UI update
                updateFormField(form.id, 'status', 'Error');
                // Save the form to persist the status change
                setTimeout(() => saveForm(), 100);
              }
              
              console.log(`=== FORM STATUS UPDATE COMPLETED ===`);
            } else {
              // Check if this was a validation error that's now resolved
              // If so, check if we can update status back to 'In Progress'
              if (form.status === 'Error') {
                // Validate the entire form to see if there are still errors
                const validation = validateForm(form);
                const hasUnresolvedErrors = validation.errors.some(error => {
                  const errorId = `${error.rowIndex}-${error.field}-${error.message}`;
                  return !form.resolvedErrors?.includes(errorId);
                });
                
                if (!hasUnresolvedErrors) {
                  console.log('All validation errors resolved, updating status to In Progress');
                  if (onFormUpdate) {
                    onFormUpdate(form.id, { status: 'In Progress' });
                  }
                  
                  if (isAdminForm) {
                    updateAdminForm(form.id, { status: 'In Progress' });
                  } else {
                    updateFormStatus(form.id, 'In Progress');
                    updateFormField(form.id, 'status', 'In Progress');
                    setTimeout(() => saveForm(), 100);
                  }
                }
              }
            }
          }
        }
      });
    }, 500); // 500ms delay to prevent validation on every keystroke
    
    // NEW: Validate logical temperature progression
      if (currentEntry.ccp1.temp && currentEntry.ccp2.temp) {
        const ccp1Temp = parseFloat(String(currentEntry.ccp1.temp));
        const ccp2Temp = parseFloat(String(currentEntry.ccp2.temp));
        
        if (!isNaN(ccp1Temp) && !isNaN(ccp2Temp)) {
          // CCP1 should be the cooking temperature (higher) and CCP2 should be the cooling temperature (lower)
          // But we should allow some flexibility for edge cases and not block the user
          if (ccp2Temp > ccp1Temp) {
            console.warn(`Temperature progression note: CCP2 temperature (${ccp2Temp}°F) is higher than CCP1 temperature (${ccp1Temp}°F). This may indicate a data entry order issue.`);
          }
        }
      }
      
      // REMOVED: Aggressive validation that runs on every cell change
      // Validation will now only run when the form is being completed or reviewed
      // This prevents the form from immediately marking as Error while users are still entering data
      
      // Legacy validation logic removed to prevent input freezing
      
      // Auto-save after updating entry (only if form has data and not admin form)
      if (!isAdminForm) {
        setTimeout(() => saveForm(), 100);
      }
    }
  };

  const handleFormFieldChange = (field: string, value: any) => {
    if (!readOnly) {
      if (isAdminForm) {
        console.log('Admin form update - field:', field, 'value:', value, 'formId:', form.id, 'isAdminForm:', isAdminForm);
        // For admin forms, update the specific form directly
        updateAdminForm(form.id, { [field]: value });
        console.log('updateAdminForm called for field:', field, 'with value:', value);
        
        // Notify parent component of the update
        if (onFormUpdate) {
          onFormUpdate(form.id, { [field]: value });
        }
      } else {
        // Special handling for date changes
        if (field === 'date') {
          const newDate = new Date(value);
          // Update the current form's date
          updateFormField(form.id, field, value);
        } else {
          console.log('Regular form update - field:', field, 'value:', value, 'current status:', form.status);
          updateFormField(form.id, field, value);
          console.log('updateFormField called, new status should be:', value);
          
          // Check for new errors ONLY in the specific form field that was modified
          if (form.status === 'In Progress' && resolvedDataSnapshot) {
            console.log('=== CHECKING SPECIFIC FORM FIELD FOR NEW ERRORS ===');
            console.log('Modified form field:', field, 'new value:', value);
            
            // Get the resolved value for this specific form field only
            const resolvedValue = resolvedDataSnapshot[field];
            console.log('Resolved form field value:', resolvedValue, 'Current form field value:', value);
            
            // Only check for errors if this specific form field actually changed
            if (JSON.stringify(resolvedValue) !== JSON.stringify(value)) {
              console.log('Form field value changed, checking ONLY this form field for validation...');
              
              // Validate ONLY this specific form field - no other fields, no other validation
              if (field === 'thermometerNumber' && !value) {
                console.log('Thermometer number is empty, updating status back to Error');
                
                // Update form status back to 'Error' when new errors occur
                if (onFormUpdate) {
                  onFormUpdate(form.id, { status: 'Error' });
                }
                
                // Use direct update to avoid infinite loop
                updateFormField(form.id, 'status', 'Error');
              } else {
                console.log('No validation errors in this specific form field, status remains In Progress');
              }
            } else {
              console.log('Form field value unchanged, no need to check for errors');
            }
          } else {
            console.log('Form field change - not checking for new errors - status:', form.status, 'has snapshot:', !!resolvedDataSnapshot);
          }
          
          // Auto-save after updating field (only if form has data)
          setTimeout(() => saveForm(), 100);
        }
      }
    }
  };



  // Helper function to get cell CSS classes based on validation
  // Only shows red highlighting when all three fields (temp, time, initial) are complete
  const getCellClasses = (rowIndex: number, field: string, baseClasses: string) => {
    if (!form) return baseClasses;
    
    // Check if this is a stage field (temp, time, or initial)
    const stageMatch = field.match(/^([^.]+)\.(temp|time|initial)$/);
    if (stageMatch) {
      const stageName = stageMatch[1];
      const fieldType = stageMatch[2];
      const currentEntry = form.entries[rowIndex];
      const stageData = currentEntry[stageName as keyof typeof currentEntry] as any;
      
      // Check if all three fields are complete for this stage
      const hasTemp = stageData.temp && String(stageData.temp).trim() !== '';
      const hasTime = stageData.time && String(stageData.time).trim() !== '';
      const hasInitial = stageData.initial && String(stageData.initial).trim() !== '';
      const isStageComplete = hasTemp && hasTime && hasInitial;
      
      // Only show validation highlighting if the stage is complete
      if (isStageComplete) {
        const validation = shouldHighlightCell(form, rowIndex, field);
        let classes = baseClasses;
        
        if (validation.highlight) {
          if (validation.severity === 'error') {
            classes += ' bg-red-200 border-2 border-red-500 shadow-sm';
          } else if (validation.severity === 'warning') {
            classes += ' bg-yellow-200 border-2 border-yellow-500 shadow-sm';
          }
        }
        
        return classes;
      }
    }
    
    // For non-stage fields or incomplete stages, return base classes without validation highlighting
    return baseClasses;
  };

  return (
    <div className="bg-white p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 p-4 text-center">
          <h1 className="text-xl font-bold">Cooking and Cooling for Meat & Non Meat Ingredients</h1>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Title: </span>
              <input
                key={`title-${form?.id || 'new'}`}
                type="text"
                value={form?.title || ''}
                onChange={(e) => {
                  const newValue = e.target.value;
                  console.log('Title input onChange:', newValue);
                  handleFormFieldChange('title', newValue);
                }}
                placeholder="Enter form title (e.g., 'Morning Batch', 'Chicken Prep')"
                className="border-b-2 border-gray-300 bg-transparent w-full px-2 py-1 transition-all duration-200 ease-in-out focus:border-blue-500 focus:outline-none hover:border-gray-400"
                readOnly={readOnly}
              />
            </div>
            <div>
              <span className="font-semibold">Date: </span>
              <input
                type="date"
                value={ensureDate(form.date).toISOString().split('T')[0]}
                onChange={(e) => handleFormFieldChange('date', new Date(e.target.value))}
                className="border-b border-black bg-transparent"
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </div>



      {/* Column Headers */}
      <div className="border-2 border-black">
        <table className="w-full border-collapse">
          {/* Header Row 1 */}
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-16">Rack</th>
              <th className="border border-black p-2 w-16">Type</th>
              <th className="border border-black p-2 w-32">
                Temperature Must reach 166°F or greater<br/>
                <strong>CCP 1</strong>
              </th>
              <th className="border border-black p-2 w-32">
                127°F or greater<br/>
                <strong>CCP 2</strong><br/>
                <small>Record Temperature of 1st and LAST rack/batch of the day</small>
              </th>
              <th className="border border-black p-2 w-32">
                80°F or below within 105 minutes<br/>
                <strong>CCP 2</strong><br/>
                <small>Record Temperature of 1st rack/batch of the day</small><br/>
                <small>Time: from CCP2 (127°F)</small>
              </th>
              <th className="border border-black p-2 w-32">
                <strong>54</strong> or below within 4.75 hr<br/>
                <small>Time: from CCP2 (127°F)</small>
              </th>
              <th className="border border-black p-2 w-40">
                Chill Continuously to<br/>
                39°F or below<br/>
                <div className="flex items-center justify-center mt-1 space-x-1">
                  <span className="text-xs font-medium">Date:</span>
                  <input
                    type="date"
                    className="w-20 text-xs border-0 bg-transparent text-center focus:outline-none focus:ring-1 focus:ring-blue-300 cursor-pointer"
                    placeholder="Date"
                    readOnly={readOnly}
                    onClick={(e) => e.currentTarget.showPicker()}
                  />
                </div>
              </th>
            </tr>
            {/* Header Row 2 - Sub columns */}
            <tr className="bg-gray-50">
              <th className="border border-black p-1 text-sm">Rack</th>
              <th className="border border-black p-1 text-sm">Type</th>
              <th className="border border-black p-1">
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div>Temp</div>
                  <div>Time</div>
                  <div>Initial</div>
                </div>
              </th>
              <th className="border border-black p-1">
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div>Temp</div>
                  <div>Time</div>
                  <div>Initial</div>
                </div>
              </th>
              <th className="border border-black p-1">
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div>Temp</div>
                  <div>Time</div>
                  <div>Initial</div>
                </div>
              </th>
              <th className="border border-black p-1">
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div>Temp</div>
                  <div>Time</div>
                  <div>Initial</div>
                </div>
              </th>
              <th className="border border-black p-1">
                <div className="grid grid-cols-3 gap-1 text-xs">
                  <div>Temp</div>
                  <div>Time</div>
                  <div>Initial</div>
                </div>
              </th>
            </tr>
          </thead>
          
                      {/* Data Rows */}
            <tbody>
              {form.entries.map((entry: any, rowIndex: number) => (
                <tr key={rowIndex} className={rowIndex === 5 ? 'border-t-4 border-black' : ''}>
                  {/* Rack selection */}
                  <td className="border border-black p-1 text-center">
                    <select
                      value={entry.rack || '1st Rack'}
                      onChange={(e) => handleCellChange(rowIndex, 'rack', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center cursor-pointer"
                      disabled={readOnly}
                    >
                      <option value="1st Rack">1st Rack</option>
                      <option value="Last Rack">Last Rack</option>
                    </select>
                  </td>
                  
                  {/* Row number and type */}
                  <td className="border border-black p-1 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="font-bold text-sm">{rowIndex + 1}.</span>
                      <input
                        type="text"
                        value={entry.type}
                        onChange={(e) => handleCellChange(rowIndex, 'type', e.target.value.charAt(0).toUpperCase() + e.target.value.slice(1).toLowerCase())}
                        className="w-full text-xs border-0 bg-transparent text-center"
                        placeholder="Type"
                        readOnly={readOnly}
                      />
                    </div>
                  </td>

                {/* CCP 1 */}
                <td className={`border border-black p-1 ${entry.ccp1.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={entry.ccp1.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp1.temp', e.target.value)}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                      readOnly={readOnly}
                    />
                    <TimePicker
                      value={entry.ccp1.time}
                      onChange={(time) => handleCellChange(rowIndex, 'ccp1.time', time)}
                      placeholder="Time"
                      className="w-full"
                      disabled={readOnly}
                      showQuickTimes={false}
                      compact={true}
                      dataLog={entry.ccp1.dataLog || false}
                                              onDataLogChange={(dataLog) => {
                          console.log('CCP1 dataLog changed:', dataLog);
                          // Update the local form state immediately
                          if (form && form.entries[rowIndex]) {
                            const updatedEntries = [...form.entries];
                            updatedEntries[rowIndex] = {
                              ...updatedEntries[rowIndex],
                              ccp1: {
                                ...updatedEntries[rowIndex].ccp1,
                                dataLog: dataLog
                              }
                            };
                            
                            if (isAdminForm) {
                              updateAdminForm(form.id, { entries: updatedEntries });
                            } else {
                              // Update the current form state directly
                              const updatedForm = { ...form, entries: updatedEntries };
                              // Force a re-render by updating the store
                              updateFormField(form.id, 'entries', updatedEntries);
                            }
                          }
                          
                          // Update corrective actions when dataLog is checked
                          updateCorrectiveActionsForDataLog(rowIndex, 'ccp1', dataLog);
                          
                          // Also call the original handleCellChange for consistency
                          handleCellChange(rowIndex, 'ccp1.dataLog', dataLog);
                          
                          // Ensure form is saved after dataLog change
                          if (!readOnly) {
                            setTimeout(() => saveForm(), 100);
                          }
                        }}
                    />
                    <input
                      type="text"
                      value={entry.ccp1.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp1.initial', e.target.value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* CCP 2 */}
                <td className={`border border-black p-1 ${entry.ccp2.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={entry.ccp2.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2.temp', e.target.value)}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                      readOnly={readOnly}
                    />
                    <TimePicker
                      value={entry.ccp2.time}
                      onChange={(time) => handleCellChange(rowIndex, 'ccp2.time', time)}
                      placeholder="Time"
                      className="w-full"
                      disabled={readOnly}
                      showQuickTimes={false}
                      compact={true}
                      dataLog={entry.ccp2.dataLog || false}
                                              onDataLogChange={(dataLog) => {
                          console.log('CCP2 dataLog changed:', dataLog);
                          // Update the local form state immediately
                          if (form && form.entries[rowIndex]) {
                            const updatedEntries = [...form.entries];
                            updatedEntries[rowIndex] = {
                              ...updatedEntries[rowIndex],
                              ccp2: {
                                ...updatedEntries[rowIndex].ccp2,
                                dataLog: dataLog
                              }
                            };
                            
                            if (isAdminForm) {
                              updateAdminForm(form.id, { entries: updatedEntries });
                            } else {
                              // Update the current form state directly
                              const updatedForm = { ...form, entries: updatedEntries };
                              // Force a re-render by updating the store
                              updateFormField(form.id, 'entries', updatedEntries);
                            }
                          }
                          
                          // Update corrective actions when dataLog is checked
                          updateCorrectiveActionsForDataLog(rowIndex, 'ccp2', dataLog);
                          
                          // Also call the original handleCellChange for consistency
                          handleCellChange(rowIndex, 'ccp2.dataLog', dataLog);
                          
                          // Ensure form is saved after dataLog change
                          if (!readOnly) {
                            setTimeout(() => saveForm(), 100);
                          }
                        }}
                    />
                    <input
                      type="text"
                      value={entry.ccp2.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2.initial', e.target.value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* 80°F Cooling */}
                <td className={`border border-black p-1 ${entry.coolingTo80.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={entry.coolingTo80.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo80.temp', e.target.value)}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                      readOnly={readOnly}
                    />
                    <div className="relative">
                      <TimePicker
                        value={entry.coolingTo80.time}
                        onChange={(time) => handleCellChange(rowIndex, 'coolingTo80.time', time)}
                        placeholder="Time"
                        className="w-full"
                        disabled={readOnly}
                        showQuickTimes={false}
                        compact={true}
                        dataLog={entry.coolingTo80.dataLog || false}
                        onDataLogChange={(dataLog) => {
                          console.log('80°F Cooling dataLog changed:', dataLog);
                          // Update the local form state immediately
                          if (form && form.entries[rowIndex]) {
                            const updatedEntries = [...form.entries];
                            updatedEntries[rowIndex] = {
                              ...updatedEntries[rowIndex],
                              coolingTo80: {
                                ...updatedEntries[rowIndex].coolingTo80,
                                dataLog: dataLog
                              }
                            };
                            
                            if (isAdminForm) {
                              updateAdminForm(form.id, { entries: updatedEntries });
                            } else {
                              // Update the current form state directly
                              const updatedForm = { ...form, entries: updatedEntries };
                              // Force a re-render by updating the store
                              updateFormField(form.id, 'entries', updatedEntries);
                            }
                          }
                          
                          // Update corrective actions when dataLog is checked
                          updateCorrectiveActionsForDataLog(rowIndex, 'coolingTo80', dataLog);
                          
                          // Also call the original handleCellChange for consistency
                          handleCellChange(rowIndex, 'coolingTo80.dataLog', dataLog);
                          
                          // Ensure form is saved after dataLog change
                          if (!readOnly) {
                            setTimeout(() => saveForm(), 100);
                          }
                        }}
                      />

                    </div>
                    <input
                      type="text"
                      value={entry.coolingTo80.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo80.initial', e.target.value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                                {/* 54°F Cooling */}
                <td className={`border border-black p-1 ${entry.coolingTo54.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={entry.coolingTo54.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo54.temp', e.target.value)}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                      readOnly={readOnly}
                    />
                    <div className="relative">
                      <TimePicker
                        value={entry.coolingTo54.time}
                        onChange={(time) => handleCellChange(rowIndex, 'coolingTo54.time', time)}
                        placeholder="Time"
                        className="w-full"
                        disabled={readOnly}
                        showQuickTimes={false}
                        compact={true}
                        dataLog={entry.coolingTo54.dataLog || false}
                        onDataLogChange={(dataLog) => {
                          console.log('54°F Cooling dataLog changed:', dataLog);
                          // Update the local form state immediately
                          if (form && form.entries[rowIndex]) {
                            const updatedEntries = [...form.entries];
                            updatedEntries[rowIndex] = {
                              ...updatedEntries[rowIndex],
                              coolingTo54: {
                                ...updatedEntries[rowIndex].coolingTo54,
                                dataLog: dataLog
                              }
                            };
                            
                            if (isAdminForm) {
                              updateAdminForm(form.id, { entries: updatedEntries });
                            } else {
                              // Update the current form state directly
                              const updatedForm = { ...form, entries: updatedEntries };
                              // Force a re-render by updating the store
                              updateFormField(form.id, 'entries', updatedEntries);
                            }
                          }
                          
                          // Update corrective actions when dataLog is checked
                          updateCorrectiveActionsForDataLog(rowIndex, 'coolingTo54', dataLog);
                          
                          // Also call the original handleCellChange for consistency
                          handleCellChange(rowIndex, 'coolingTo54.dataLog', dataLog);
                          
                          // Ensure form is saved after dataLog change
                          if (!readOnly) {
                            setTimeout(() => saveForm(), 100);
                          }
                        }}
                      />

                    </div>
                    <input
                      type="text"
                      value={entry.coolingTo54.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo54.initial', e.target.value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* Final Chill */}
                <td className={`border border-black p-1 ${entry.finalChill.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={entry.finalChill.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'finalChill.temp', e.target.value)}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                      readOnly={readOnly}
                    />
                    <TimePicker
                      value={entry.finalChill.time}
                      onChange={(time) => handleCellChange(rowIndex, 'finalChill.time', time)}
                      placeholder="Time"
                      className="w-full"
                      disabled={readOnly}
                      showQuickTimes={false}
                      compact={true}
                      dataLog={entry.finalChill.dataLog || false}
                      onDataLogChange={(dataLog) => {
                        console.log('Final Chill dataLog changed:', dataLog);
                        // Update the local form state immediately
                        if (form && form.entries[rowIndex]) {
                          const updatedEntries = [...form.entries];
                          updatedEntries[rowIndex] = {
                            ...updatedEntries[rowIndex],
                            finalChill: {
                              ...updatedEntries[rowIndex].finalChill,
                              dataLog: dataLog
                            }
                          };
                          
                          if (isAdminForm) {
                            updateAdminForm(form.id, { entries: updatedEntries });
                          } else {
                            // Update the current form state directly
                            const updatedForm = { ...form, entries: updatedEntries };
                            // Force a re-render by updating the store
                            updateFormField(form.id, 'entries', updatedEntries);
                          }
                        }
                        
                        // Update corrective actions when dataLog is checked
                        updateCorrectiveActionsForDataLog(rowIndex, 'finalChill', dataLog);
                        
                        // Also call the original handleCellChange for consistency
                        handleCellChange(rowIndex, 'finalChill.dataLog', dataLog);
                        
                        // Ensure form is saved after dataLog change
                        if (!readOnly) {
                          setTimeout(() => saveForm(), 100);
                        }
                      }}
                    />
                    <input
                      type="text"
                      value={entry.finalChill.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'finalChill.initial', e.target.value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Section */}
      <div className="border-2 border-black border-t-0">
        <div className="grid grid-cols-2 gap-0">
          {/* Left side - Thermometer and Ingredients */}
          <div className="border-r border-black">
            {/* Thermometer # */}
            <div className="border-b border-black p-2 text-center">
              <span className="font-semibold">Thermometer #</span>
              <input
                type="text"
                value={form.thermometerNumber}
                onChange={(e) => handleFormFieldChange('thermometerNumber', e.target.value)}
                className="ml-2 border-b border-black bg-transparent"
                placeholder="Enter thermometer number"
                readOnly={readOnly}
              />
            </div>
            
            {/* Ingredients Table */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-black p-2 bg-gray-100">Ingredient</th>
                  <th className="border border-black p-2 bg-gray-100">Beef</th>
                  <th className="border border-black p-2 bg-gray-100">Chicken</th>
                  <th className="border border-black p-2 bg-gray-100">Liquid Eggs</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-semibold">Lot #(s)</td>
                  <td className="border border-black p-1">
                    <input
                      type="text"
                      value={form.lotNumbers.beef}
                      onChange={(e) => handleFormFieldChange('lotNumbers.beef', e.target.value)}
                      className="w-full border-0 bg-transparent text-sm"
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="border border-black p-1">
                    <input
                      type="text"
                      value={form.lotNumbers.chicken}
                      onChange={(e) => handleFormFieldChange('lotNumbers.chicken', e.target.value)}
                      className="w-full border-0 bg-transparent text-sm"
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="border border-black p-1">
                    <input
                      type="text"
                      value={form.lotNumbers.liquidEggs}
                      onChange={(e) => handleFormFieldChange('lotNumbers.liquidEggs', e.target.value)}
                      className="w-full border-0 bg-transparent text-sm"
                      readOnly={readOnly}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right side - Corrective Actions */}
          <div className="p-4 relative">
            <div className="mb-2">
              <h3 className="font-semibold">Corrective Actions & comments:</h3>
            </div>
            <textarea
              value={form.correctiveActionsComments}
              onChange={(e) => handleFormFieldChange('correctiveActionsComments', e.target.value)}
              className="w-full h-32 border border-gray-300 p-2 text-sm resize-none"
              placeholder="Enter any corrective actions taken or additional comments..."
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Complete Button - Only show if form is not already complete and not read-only */}
      {!readOnly && form.status !== 'Complete' && (
        <div className="mt-6 text-center">
          <button
            onClick={() => {
              // Run validation before completing the form
              const validation = validateForm(form);
              const hasErrors = validation.errors.some(error => error.severity === 'error');
              
              if (hasErrors) {
                // Show validation errors and don't complete the form
                console.log('Validation errors found, cannot complete form:', validation.errors);
                showToast('error', `Cannot complete form: ${validation.errors.filter(e => e.severity === 'error').length} validation errors found. Please fix these issues before completing the form.`);
                return;
              }
              
              // Update form status to Complete
              if (onFormUpdate) {
                onFormUpdate(form.id, { status: 'Complete' });
              }
              
              if (isAdminForm) {
                updateAdminForm(form.id, { status: 'Complete' });
              } else {
                updateFormStatus(form.id, 'Complete');
                updateFormField(form.id, 'status', 'Complete');
                setTimeout(() => saveForm(), 100);
              }
              
              // Show success toast
              showToast('success', 'Form completed successfully!');
            }}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Mark Form as Complete
          </button>
          <p className="text-sm text-gray-600 mt-2">
            This will finalize the form and prevent further editing
          </p>
        </div>
      )}

      {/* Completion Notice - Show when form is complete */}
      {form.status === 'Complete' && (
        <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-800">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-lg font-semibold">Form Completed Successfully!</span>
          </div>
          <p className="text-gray-700 mt-1">
            This form has been finalized and can no longer be edited
          </p>
        </div>
      )}

      {/* Validation Summary - Hide when form status is 'In Progress' or when errors are resolved by admin */}
      {form && form.status !== 'In Progress' && (() => {
        const validation = validateForm(form);
        
        // Filter out errors that have been resolved by admin
        const unresolvedErrors = validation.errors.filter(error => {
          const errorId = `${error.rowIndex}-${error.field}-${error.message}`;
          return !form.resolvedErrors?.includes(errorId);
        });
        
        if (unresolvedErrors.length > 0) {
          return (
            <div className="mt-4 p-4 border-2 border-red-300 bg-red-50 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Validation Issues Found
              </h3>
              <div className="space-y-2">
                {unresolvedErrors.map((error, index) => (
                  <div 
                    key={index} 
                    className={`text-sm p-2 rounded ${
                      error.severity === 'error' 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}
                  >
                    <div>
                      <span className="font-medium">Row {error.rowIndex + 1}:</span> {error.message}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-sm text-red-700">
                <strong>Summary:</strong> {unresolvedErrors.filter(e => e.severity === 'error').length} errors, {unresolvedErrors.filter(e => e.severity === 'warning').length} warnings. 
                Compliance rate: {validation.summary.totalEntries > 0 ? Math.round((validation.summary.compliantEntries / validation.summary.totalEntries) * 100) : 0}%
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-lg shadow-lg text-white max-w-md transition-all duration-300 ${
              toast.type === 'success' ? 'bg-green-500' :
              toast.type === 'error' ? 'bg-red-500' :
              toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="font-medium">
                  {toast.type === 'error' ? 'Validation Error' :
                   toast.type === 'warning' ? 'Warning' :
                   toast.type === 'success' ? 'Success' : 'Info'}
                </div>
                <div className="text-sm mt-1">{toast.message}</div>
                {toast.rowIndex !== undefined && toast.stage && (
                  <div className="text-xs mt-1 opacity-90">
                    Row {toast.rowIndex + 1}, {toast.stage}
                  </div>
                )}
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="ml-3 text-white hover:text-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
