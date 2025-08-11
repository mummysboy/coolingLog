'use client';

import React from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperFormEntry } from '@/lib/paperFormTypes';
import { shouldHighlightCell, validateForm } from '@/lib/validation';
import { TimePicker } from './TimePicker';


interface PaperFormProps {
  formData?: PaperFormEntry;
  readOnly?: boolean;
  onSave?: () => void;
  onFormUpdate?: (formId: string, updates: Partial<PaperFormEntry>) => void;
}

export function PaperForm({ formData, readOnly = false, onSave, onFormUpdate }: PaperFormProps = {}) {
  const { currentForm, updateEntry, updateFormField, saveForm, getFormByDateAndInitial, loadForm, selectedInitial, createNewForm, updateAdminForm, savedForms } = usePaperFormStore();

  // Check if we're working with a form from the admin dashboard
  const isAdminForm = formData && formData !== currentForm;
  
  // For admin forms, always get the latest data from the store
  // For regular forms, use provided formData or fall back to currentForm from store
  const form = isAdminForm && formData 
    ? savedForms.find(f => f.id === formData.id) || formData
    : (formData || currentForm);
    
  // Track the resolved data snapshot to compare against new changes
  const [resolvedDataSnapshot, setResolvedDataSnapshot] = React.useState<any>(null);

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

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    console.log('handleCellChange called:', { rowIndex, field, value, readOnly });
    
    if (!readOnly) {
      if (isAdminForm) {
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
        // For regular forms, use the store's updateEntry
        updateEntry(rowIndex, field, value);
      }
      
      // Auto-fill initial when type, temp, and time are all entered
      const entry = form.entries[rowIndex];
      if (entry) {
        // Check each stage and auto-fill initial if type, temp, and time are all present
        const stages = ['ccp1', 'ccp2', 'coolingTo80', 'coolingTo54', 'finalChill'];
        
        stages.forEach(stage => {
          const stageData = entry[stage as keyof typeof entry] as any;
          if (stageData && 
              entry.type && 
              stageData.temp && 
              stageData.time && 
              !stageData.initial && 
              selectedInitial) {
            // Auto-fill the initial for this stage
            if (isAdminForm) {
              // For admin forms, update the specific form
              const updatedEntries = [...form.entries];
              const entry = updatedEntries[rowIndex];
              const sectionData = entry[stage as keyof typeof entry] as any;
              updatedEntries[rowIndex] = {
                ...entry,
                [stage]: {
                  ...sectionData,
                  initial: selectedInitial,
                },
              };
              updateAdminForm(form.id, { entries: updatedEntries });
            } else {
              // For regular forms, use the store's updateEntry
              updateEntry(rowIndex, `${stage}.initial`, selectedInitial);
            }
          }
        });
      }
      
      // Check for new errors ONLY in the specific cell that was modified
      console.log('=== CHECKING SPECIFIC CELL FOR NEW ERRORS ===');
      console.log('Modified cell:', field, 'at row:', rowIndex);
      
      if (form.status === 'In Progress' && resolvedDataSnapshot) {
        // Get the resolved value for this specific cell only
        let resolvedValue;
        if (field.includes('.')) {
          const [section, subField] = field.split('.');
          resolvedValue = resolvedDataSnapshot.entries[rowIndex]?.[section]?.[subField];
        } else {
          resolvedValue = resolvedDataSnapshot.entries[rowIndex]?.[field];
        }
        
        console.log('Resolved cell value:', resolvedValue, 'Current cell value:', value);
        
        // Only check for errors if this specific cell actually changed
        if (resolvedValue !== value) {
          console.log('Cell value changed, checking ONLY this cell for validation errors...');
          
          // Smart validation: Check if this cell went from valid to invalid
          let hasNewError = false;
          
          // Get the resolved value for this specific cell
          let resolvedValue;
          if (field.includes('.')) {
            const [section, subField] = field.split('.');
            const resolvedEntry = resolvedDataSnapshot.entries[rowIndex];
            if (resolvedEntry && resolvedEntry[section as keyof typeof resolvedEntry]) {
              const resolvedSectionData = resolvedEntry[section as keyof typeof resolvedEntry] as any;
              resolvedValue = resolvedSectionData?.[subField];
            }
          } else {
            resolvedValue = resolvedDataSnapshot.entries[rowIndex]?.[field as keyof any];
          }
          
          console.log(`=== CELL COMPARISON DEBUG ===`);
          console.log(`Field: ${field}, Row: ${rowIndex}`);
          console.log(`Resolved value: "${resolvedValue}"`);
          console.log(`Current value: "${value}"`);
          console.log(`Values are different: ${resolvedValue !== value}`);
          console.log(`=== END CELL COMPARISON DEBUG ===`);
          
          // Check if the current value has validation errors based on column requirements
          let currentHasError = false;
          
          if (field.includes('.temp')) {
            // Temperature validation based on column requirements
            const tempValue = parseFloat(String(value || ''));
            if (isNaN(tempValue)) {
              currentHasError = true;
              console.log(`Temperature validation failed: NaN value`);
            } else {
              // Check against specific column requirements
              if (field.includes('ccp1.temp')) {
                // CCP 1: Temperature Must reach 166°F or greater
                currentHasError = tempValue < 166;
                console.log(`CCP1 validation: ${tempValue}°F >= 166°F = ${tempValue >= 166}`);
              } else if (field.includes('ccp2.temp')) {
                // CCP 2: 127°F or greater
                currentHasError = tempValue < 127;
                console.log(`CCP2 validation: ${tempValue}°F >= 127°F = ${tempValue >= 127}`);
              } else if (field.includes('coolingTo80.temp')) {
                // 80°F Cooling: 80°F or below within 105 minutes
                currentHasError = tempValue > 80;
                console.log(`80°F Cooling validation: ${tempValue}°F <= 80°F = ${tempValue <= 80}`);
              } else if (field.includes('coolingTo54.temp')) {
                // 54°F Cooling: 54°F or below within 4.75 hr
                currentHasError = tempValue > 54;
                console.log(`54°F Cooling validation: ${tempValue}°F <= 54°F = ${tempValue <= 54}`);
              } else if (field.includes('finalChill.temp')) {
                // Final Chill: 39°F or below
                currentHasError = tempValue > 39;
                console.log(`Final Chill validation: ${tempValue}°F <= 39°F = ${tempValue <= 39}`);
              }
            }
          } else if (field.includes('.time')) {
            // Time validation - must not be empty
            currentHasError = !value || String(value).trim() === '';
            console.log(`Time validation: empty = ${currentHasError}`);
          } else if (field.includes('.initial')) {
            // Initial validation - must not be empty
            currentHasError = !value || String(value).trim() === '';
            console.log(`Initial validation: empty = ${currentHasError}`);
          } else if (field === 'type') {
            // Type validation - must not be empty
            currentHasError = !value || String(value).trim() === '';
            console.log(`Type validation: empty = ${currentHasError}`);
          }
          
          console.log(`Current cell has error: ${currentHasError}`);
          
          // Check if the resolved value had validation errors based on column requirements
          let resolvedHadError = false;
          
          if (field.includes('.temp')) {
            const resolvedTempValue = parseFloat(String(resolvedValue || ''));
            if (isNaN(resolvedTempValue)) {
              resolvedHadError = true;
              console.log(`Resolved temperature validation failed: NaN value`);
            } else {
              // Check against specific column requirements
              if (field.includes('ccp1.temp')) {
                // CCP 1: Temperature Must reach 166°F or greater
                resolvedHadError = resolvedTempValue < 166;
                console.log(`Resolved CCP1 validation: ${resolvedTempValue}°F >= 166°F = ${resolvedTempValue >= 166}`);
              } else if (field.includes('ccp2.temp')) {
                // CCP 2: 127°F or greater
                resolvedHadError = resolvedTempValue < 127;
                console.log(`Resolved CCP2 validation: ${resolvedTempValue}°F >= 127°F = ${resolvedTempValue >= 127}`);
              } else if (field.includes('coolingTo80.temp')) {
                // 80°F Cooling: 80°F or below within 105 minutes
                resolvedHadError = resolvedTempValue > 80;
                console.log(`Resolved 80°F Cooling validation: ${resolvedTempValue}°F <= 80°F = ${resolvedTempValue <= 80}`);
              } else if (field.includes('coolingTo54.temp')) {
                // 54°F Cooling: 54°F or below within 4.75 hr
                resolvedHadError = resolvedTempValue > 54;
                console.log(`Resolved 54°F Cooling validation: ${resolvedTempValue}°F <= 54°F = ${resolvedTempValue <= 54}`);
              } else if (field.includes('finalChill.temp')) {
                // Final Chill: 39°F or below
                resolvedHadError = resolvedTempValue > 39;
                console.log(`Resolved Final Chill validation: ${resolvedTempValue}°F <= 39°F = ${resolvedTempValue <= 39}`);
              }
            }
          } else if (field.includes('.time')) {
            resolvedHadError = !resolvedValue || String(resolvedValue).trim() === '';
            console.log(`Resolved time validation: empty = ${resolvedHadError}`);
          } else if (field.includes('.initial')) {
            resolvedHadError = !resolvedValue || String(resolvedValue).trim() === '';
            console.log(`Resolved initial validation: empty = ${resolvedHadError}`);
          } else if (field === 'type') {
            resolvedHadError = !resolvedValue || String(resolvedValue).trim() === '';
            console.log(`Resolved type validation: empty = ${resolvedHadError}`);
          }
          
          // Only flag as new error if: current has error AND resolved didn't have error
          hasNewError = currentHasError && !resolvedHadError;
          
          console.log(`Current cell has error: ${currentHasError}, Resolved cell had error: ${resolvedHadError}`);
          console.log(`New error detected: ${hasNewError}`);
          
          if (hasNewError) {
            console.log('=== STATUS UPDATE ATTEMPT ===');
            console.log('New error detected in this specific cell, updating status back to Error');
            console.log('Current form status before update:', form.status);
            console.log('Form ID:', form.id);
            console.log('isAdminForm:', isAdminForm);
            console.log('onFormUpdate exists:', !!onFormUpdate);
            
            // Update form status back to 'Error' when new errors occur
            if (onFormUpdate) {
              console.log('Calling onFormUpdate with status: Error');
              try {
                onFormUpdate(form.id, { status: 'Error' });
                console.log('onFormUpdate call completed successfully');
              } catch (error) {
                console.error('Error calling onFormUpdate:', error);
              }
            }
            
            if (isAdminForm) {
              console.log('Updating admin form status to Error');
              try {
                updateAdminForm(form.id, { status: 'Error' });
                console.log('updateAdminForm call completed successfully');
              } catch (error) {
                console.error('Error calling updateAdminForm:', error);
              }
            } else {
              console.log('Updating regular form status to Error');
              try {
                // Use direct update to avoid potential issues with handleFormFieldChange
                updateFormField('status', 'Error');
                console.log('updateFormField call completed successfully');
                // Also save the form to persist the status change
                saveForm();
                console.log('saveForm call completed successfully');
              } catch (error) {
                console.error('Error calling updateFormField or saveForm:', error);
              }
            }
            
            console.log('All status update calls completed');
            
            // Check if the status actually changed
            setTimeout(() => {
              console.log('=== STATUS CHECK AFTER UPDATE ===');
              console.log('Form status after update attempt:', form.status);
              console.log('Form ID after update:', form.id);
              console.log('=== END STATUS CHECK ===');
            }, 100);
            
            console.log('=== END STATUS UPDATE ATTEMPT ===');
          } else {
            console.log('No new errors in this specific cell, status remains In Progress');
          }
        } else {
          console.log('Cell value unchanged, no need to check for errors');
        }
      } else {
        console.log('Not checking for new errors - status:', form.status, 'has snapshot:', !!resolvedDataSnapshot);
      }
      
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
        if (field === 'date' && selectedInitial) {
          const newDate = new Date(value);
          const existingForm = getFormByDateAndInitial(newDate, selectedInitial);
          
          if (existingForm && existingForm.id !== form?.id) {
            // Load the existing form for this date
            loadForm(existingForm.id);
          } else if (!existingForm) {
            // No existing form for this date, create a new one
            createNewForm(selectedInitial);
            // Set the date on the new form
            setTimeout(() => {
              updateFormField(field, value);
            }, 10);
          } else {
            // Update the current form's date
            updateFormField(field, value);
          }
        } else {
          console.log('Regular form update - field:', field, 'value:', value, 'current status:', form.status);
          updateFormField(field, value);
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
                updateFormField('status', 'Error');
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
  const getCellClasses = (rowIndex: number, field: string, baseClasses: string) => {
    if (!form) return baseClasses;
    
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
  };

  return (
    <div className="bg-white p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 p-4 text-center">
          <h1 className="text-xl font-bold">Cooking and Cooling for Meat & Non Meat Ingredients</h1>
        </div>
        <div className="p-4">
          <div>
            <span className="font-semibold">Date: </span>
            <input
              type="date"
              value={form.date.toISOString().split('T')[0]}
              onChange={(e) => handleFormFieldChange('date', new Date(e.target.value))}
              className="border-b border-black bg-transparent"
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Column Headers */}
      <div className="border-2 border-black">
        <table className="w-full border-collapse">
          {/* Header Row 1 */}
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-16">Date</th>
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
                <small>Record Temperature of 1st rack/batch of the day</small>
              </th>
              <th className="border border-black p-2 w-32">
                <strong>54</strong> or below within 4.75 hr
              </th>
              <th className="border border-black p-2 w-32">
                Chill Continuously to<br/>
                39°F or below
              </th>
            </tr>
            {/* Header Row 2 - Sub columns */}
            <tr className="bg-gray-50">
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
            {form.entries.map((entry, rowIndex) => (
              <tr key={rowIndex} className={rowIndex === 5 ? 'border-t-4 border-black' : ''}>
                {/* Row number and type */}
                <td className="border border-black p-1 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="font-bold text-sm">{rowIndex + 1}.</span>
                    <input
                      type="text"
                      value={entry.type}
                      onChange={(e) => handleCellChange(rowIndex, 'type', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Type"
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* CCP 1 */}
                <td className="border border-black p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={entry.ccp1.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp1.temp', e.target.value)}
                      className={getCellClasses(rowIndex, 'ccp1.temp', 'w-full text-xs text-center rounded-sm')}
                      placeholder="°F"
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
                    />
                    <input
                      type="text"
                      value={entry.ccp1.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp1.initial', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* CCP 2 */}
                <td className="border border-black p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={entry.ccp2.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2.temp', e.target.value)}
                      className={getCellClasses(rowIndex, 'ccp2.temp', 'w-full text-xs text-center rounded-sm')}
                      placeholder="°F"
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
                    />
                    <input
                      type="text"
                      value={entry.ccp2.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2.initial', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* 80°F Cooling */}
                <td className="border border-black p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={entry.coolingTo80.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo80.temp', e.target.value)}
                      className={getCellClasses(rowIndex, 'coolingTo80.temp', 'w-full text-xs text-center rounded-sm')}
                      placeholder="°F"
                      readOnly={readOnly}
                    />
                    <TimePicker
                      value={entry.coolingTo80.time}
                      onChange={(time) => handleCellChange(rowIndex, 'coolingTo80.time', time)}
                      placeholder="Time"
                      className="w-full"
                      disabled={readOnly}
                      showQuickTimes={false}
                      compact={true}
                    />
                    <input
                      type="text"
                      value={entry.coolingTo80.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo80.initial', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* 54°F Cooling */}
                <td className="border border-black p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={entry.coolingTo54.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo54.temp', e.target.value)}
                      className={getCellClasses(rowIndex, 'coolingTo54.temp', 'w-full text-xs border-0 bg-transparent text-center')}
                      placeholder="°F"
                      readOnly={readOnly}
                    />
                    <TimePicker
                      value={entry.coolingTo54.time}
                      onChange={(time) => handleCellChange(rowIndex, 'coolingTo54.time', time)}
                      placeholder="Time"
                      className="w-full"
                      disabled={readOnly}
                      showQuickTimes={false}
                      compact={true}
                    />
                    <input
                      type="text"
                      value={entry.coolingTo54.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo54.initial', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* Final Chill */}
                <td className="border border-black p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="text"
                      value={entry.finalChill.temp}
                      onChange={(e) => handleCellChange(rowIndex, 'finalChill.temp', e.target.value)}
                      className={getCellClasses(rowIndex, 'finalChill.temp', 'w-full text-xs border-0 bg-transparent text-center')}
                      placeholder="°F"
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
                    />
                    <input
                      type="text"
                      value={entry.finalChill.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'finalChill.initial', e.target.value)}
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
            <h3 className="font-semibold mb-2">Corrective Actions & comments:</h3>
            <textarea
              value={form.correctiveActionsComments}
              onChange={(e) => handleFormFieldChange('correctiveActionsComments', e.target.value)}
              className="w-full h-32 border border-gray-300 p-2 text-sm resize-none"
              placeholder="Enter any corrective actions taken or additional comments..."
              readOnly={readOnly}
            />
            
            {/* Resolve Button - Only show when admin has entered text and form status is not 'In Progress' */}
            {form.status !== 'In Progress' && form.correctiveActionsComments && form.correctiveActionsComments.trim() && (
              <button
                onClick={() => {
                  console.log('Resolve button clicked, current status:', form.status);
                  console.log('Form ID:', form.id, 'isAdminForm:', isAdminForm);
                  console.log('Corrective actions:', form.correctiveActionsComments);
                  
                  // Save a snapshot of the current data when resolving
                  // Use the actual form data that's currently displayed, not the potentially stale form object
                  const currentFormData = isAdminForm ? 
                    savedForms.find(f => f.id === form.id) || form :
                    form;
                  
                  const snapshot = JSON.parse(JSON.stringify(currentFormData));
                  setResolvedDataSnapshot(snapshot);
                  console.log('=== RESOLVE BUTTON CLICKED ===');
                  console.log('Resolved data snapshot saved');
                  console.log('Snapshot entries length:', snapshot.entries?.length);
                  console.log('Current form status:', form.status);
                  console.log('Snapshot sample data - Row 0 type:', snapshot.entries?.[0]?.type);
                  console.log('Snapshot sample data - Row 0 ccp1.temp:', snapshot.entries?.[0]?.ccp1?.temp);
                  
                  // Always notify parent component of the status update to ensure UI consistency
                  if (onFormUpdate) {
                    console.log('Calling onFormUpdate with status: In Progress');
                    onFormUpdate(form.id, { status: 'In Progress' });
                  }
                  
                  // Update form status to 'In Progress' when resolved
                  if (isAdminForm) {
                    // For admin forms, use updateAdminForm to ensure proper persistence
                    console.log('Updating admin form status to In Progress');
                    updateAdminForm(form.id, { status: 'In Progress' });
                    
                    // Add a small delay to ensure the status update is processed before any auto-updates
                    setTimeout(() => {
                      console.log('Status update delay completed for admin form');
                    }, 100);
                  } else {
                    // For regular forms, update the current form and save it
                    console.log('Updating regular form status to In Progress');
                    handleFormFieldChange('status', 'In Progress');
                    // Save the form to persist the status change
                    saveForm();
                  }
                  console.log('Status update completed');
                }}
                className="absolute bottom-6 right-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Resolve</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Validation Summary - Hide when form status is 'In Progress' */}
      {form && form.status !== 'In Progress' && (() => {
        const validation = validateForm(form);
        if (validation.errors.length > 0) {
          return (
            <div className="mt-4 p-4 border-2 border-red-300 bg-red-50 rounded-lg">
              <h3 className="text-lg font-semibold text-red-800 mb-2 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                Validation Issues Found
              </h3>
              <div className="space-y-2">
                {validation.errors.map((error, index) => {

                  
                  return (
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
                  );
                })}
              </div>
              <div className="mt-3 text-sm text-red-700">
                <strong>Summary:</strong> {validation.summary.totalErrors} errors, {validation.summary.totalWarnings} warnings. 
                Compliance rate: {validation.summary.totalEntries > 0 ? Math.round((validation.summary.compliantEntries / validation.summary.totalEntries) * 100) : 0}%
              </div>
            </div>
          );
        }
        return null;
      })()}



    </div>
  );
}
