'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePaperFormStore } from '../stores/paperFormStore';
import { useLogStore } from '../stores/logStore';
import { validateTemperatureCell, validateForm } from '../lib/validation';
import { getTimeDifferenceMinutes } from '../lib/validation';

interface PaperFormProps {
  formId: string;
  readOnly?: boolean;
  isAdminForm?: boolean;
  onFormUpdate?: (formId: string, updates: any) => void;
}

export default function PaperForm({ formId, readOnly = false, isAdminForm = false, onFormUpdate }: PaperFormProps) {
  const {
    currentForm: form,
    updateFormField,
    updateFormStatus,
    saveForm,
    updateEntry,
    updateAdminForm
  } = usePaperFormStore();
  
  const [correctiveText, setCorrectiveText] = useState('');
  const [currentForm, setCurrentForm] = useState<any>(null);
  const [titleInput, setTitleInput] = useState(form?.title || '');
  
  // Memoized entries for performance
  const memoizedEntries = form?.entries || [];
  
  // Missing functions that are referenced in the component
  const shouldHighlightCell = (form: any, rowIndex: number, field: string) => {
    // Placeholder implementation - you may want to implement proper validation logic
    return { highlight: false, severity: 'none' };
  };
  
  const commitField = (rowIndex: number, field: string, value: any) => {
    if (isAdminForm) {
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
      updateEntry(rowIndex, field, value);
    }
  };
  
  const updateCorrectiveActionsForDataLog = (rowIndex: number, stage: string, dataLog: boolean) => {
    // Placeholder implementation
    console.log('updateCorrectiveActionsForDataLog called:', { rowIndex, stage, dataLog });
  };
  
  const onRenderCallback = (id: string, phase: string, actualDuration: number) => {
    // Performance monitoring callback
    if (process.env.NODE_ENV === 'development') {
      console.log(`PaperForm render: ${id} ${phase} ${actualDuration}ms`);
    }
  };
  
  const ensureDate = (date: any) => {
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    return new Date();
  };

  const handleCellChange = (rowIndex: number, field: string, value: string | boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 handleCellChange called:', { rowIndex, field, value });
    }

    if (readOnly) return;

    if (isAdminForm) {
      // For admin forms, update entries directly
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
      return;
    }

    // Regular form flow
    try {
      updateEntry(rowIndex, field, value);
    } catch (error) {
      console.error('❌ Error calling updateEntry:', error);
    }

    // Temperature/time corrective logic
    try {
      const stageMatch = typeof field === 'string' ? field.match(/^([^.]+)\.(temp|time|initial|dataLog)$/) : null;
      if (!stageMatch) return;

      const stage = stageMatch[1];
      const fieldType = stageMatch[2];
      const existingComments = form?.correctiveActionsComments || '';
      const rowNumber = rowIndex + 1;
      const entry = form?.entries?.[rowIndex];

      if (fieldType === 'temp') {
        const tempStr = typeof value === 'string' ? value : String(value ?? '');
        const tempNum = tempStr.trim() === '' ? null : parseFloat(tempStr.replace(/[^\d.-]/g, ''));
        const stageName =
          stage === 'ccp1'
            ? 'CCP1'
            : stage === 'ccp2'
            ? 'CCP2'
            : stage === 'coolingTo80'
            ? '80°F Cooling'
            : stage === 'coolingTo54'
            ? '54°F Cooling'
            : stage === 'finalChill'
            ? 'Final Chill'
            : stage;

        if (tempNum !== null && !isNaN(tempNum)) {
          const validation = validateTemperatureCell(String(tempNum), stage as any);
          if (!validation.isValid && validation.error) {
            const targetComment = `Row ${rowNumber} ${stageName} temperature ${tempNum}°F - ${validation.error}`;
            if (!existingComments.includes(targetComment)) {
              const updatedComments = existingComments ? `${existingComments}\n${targetComment}` : targetComment;
              setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
              if (!readOnly && form) {
                updateFormField(form.id, 'correctiveActionsComments', updatedComments);
                if (isAdminForm) updateAdminForm(form.id, { correctiveActionsComments: updatedComments });
                if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: updatedComments });
              }
              if (stage === 'ccp1' || stage === 'ccp2') showToast('error', validation.error, rowIndex, stage);
            }
          } else {
            const failMarker = `Row ${rowNumber} ${stageName} temperature`;
            if (existingComments.includes(failMarker)) {
              const cleaned = existingComments.split('\n').filter((c) => !c.startsWith(failMarker)).join('\n');
              setCorrectiveText(formatNumberedTextFromRaw(cleaned));
              if (!readOnly && form) {
                updateFormField(form.id, 'correctiveActionsComments', cleaned);
                if (isAdminForm) updateAdminForm(form.id, { correctiveActionsComments: cleaned });
                if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: cleaned });
              }
            }
          }
        } else {
          const failMarker = `Row ${rowNumber} ${stageName} temperature`;
          if (existingComments.includes(failMarker)) {
            const cleaned = existingComments.split('\n').filter((c) => !c.startsWith(failMarker)).join('\n');
            setCorrectiveText(formatNumberedTextFromRaw(cleaned));
            if (!readOnly && form) {
              updateFormField(form.id, 'correctiveActionsComments', cleaned);
              if (isAdminForm) updateAdminForm(form.id, { correctiveActionsComments: cleaned });
              if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: cleaned });
            }
          }
        }
      }

      if (fieldType === 'time' && stage === 'coolingTo80') {
        const newTime = typeof value === 'string' ? value : String(value ?? '');
        const failMarker = `Row ${rowNumber} 80°F Cooling time`;

        if (newTime && entry?.ccp2?.time) {
          const timeDiff = getTimeDifferenceMinutes(entry.ccp2.time, newTime);
          if (timeDiff !== null && timeDiff > 105) {
            const targetComment = `Row ${rowNumber} 80°F Cooling time ${timeDiff} minutes - Time limit exceeded (105 minutes)`;
            if (!existingComments.includes(targetComment)) {
              const updatedComments = existingComments ? `${existingComments}\n${targetComment}` : targetComment;
              setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
              if (!readOnly && form) {
                updateFormField(form.id, 'correctiveActionsComments', updatedComments);
                if (isAdminForm) updateAdminForm(form.id, { correctiveActionsComments: updatedComments });
                if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: updatedComments });
              }
              showToast('error', 'Time limit exceeded for 80°F Cooling', rowIndex, 'coolingTo80');
            }
          } else {
            if (existingComments.includes(failMarker)) {
              const cleaned = existingComments.split('\n').filter((c) => !c.startsWith(failMarker)).join('\n');
              setCorrectiveText(formatNumberedTextFromRaw(cleaned));
              if (!readOnly && form) {
                updateFormField(form.id, 'correctiveActionsComments', cleaned);
                if (isAdminForm) updateAdminForm(form.id, { correctiveActionsComments: cleaned });
                if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: cleaned });
              }
            }
          }
        } else if (newTime && !entry?.ccp2?.time) {
          const targetComment = `Row ${rowNumber} 80°F Cooling time set but missing CCP2 reference time`;
          if (!existingComments.includes(targetComment)) {
            const updatedComments = existingComments ? `${existingComments}\n${targetComment}` : targetComment;
            setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
            if (!readOnly && form) {
              updateFormField(form.id, 'correctiveActionsComments', updatedComments);
              if (isAdminForm) updateAdminForm(form.id, { correctiveActionsComments: updatedComments });
              if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: updatedComments });
            }
            showToast('error', 'Missing CCP2 reference time for 80°F Cooling', rowIndex, 'coolingTo80');
          }
        }
      }
    } catch (err) {
      console.error('Error processing temperature corrective action logic', err);
    }
  };

  // Helpers to format corrective actions as numbered lines for display
  const formatNumberedTextFromRaw = (raw: string | undefined) => {
    if (!raw) return '';
    const lines = raw.split('\n').map(l => l.trim()).filter(l => l !== '');
    return lines.map((l, idx) => `${idx + 1}. ${l}`).join('\n');
  };

  const stripNumberingToRaw = (numbered: string) => {
    if (!numbered) return '';
    const lines = numbered.split('\n').map(l => l.replace(/^\s*\d+\.\s*/, '').trim()).filter(l => l !== '');
    return lines.join('\n');
  };

  // Debug logging - only in development
  if (process.env.NODE_ENV === 'development') {
    console.log('PaperForm render:', { formData, readOnly, currentForm: !!currentForm });
  }

  // Early return if no form data
  if (!form) {
    if (process.env.NODE_ENV === 'development') {
      console.log('PaperForm: No form data available, returning null');
    }
    return null;
  }

  // Debug form data structure
  if (process.env.NODE_ENV === 'development') {
    console.log('PaperForm: Form data structure:', {
      id: form.id,
      title: form.title,
      formInitial: form.formInitial,
      entriesCount: form.entries?.length,
      firstEntry: form.entries?.[0],
      hasDataLog: form.entries?.[0]?.ccp1?.dataLog !== undefined,
      firstEntryDataLog: form.entries?.[0]?.ccp1?.dataLog,
      firstEntryCCP1: form.entries?.[0]?.ccp1
    });
  }
    
  // showToast intentionally left as a no-op to remove top-right alert UI while preserving calls
  const showToast = (_type: 'error' | 'warning' | 'success' | 'info', _message: string, _rowIndex?: number, _stage?: string) => {};

  // Function to check if there are new errors compared to the resolved snapshot
  const hasNewErrors = (currentForm: any, resolvedSnapshot: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== hasNewErrors FUNCTION CALLED ===');
    }
    if (!resolvedSnapshot) {
      if (process.env.NODE_ENV === 'development') {
        console.log('No resolved snapshot, returning false');
      }
      return false;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Checking for new errors against resolved snapshot...');
    }
    
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
            if (process.env.NODE_ENV === 'development') {
              console.log(`Field ${stage}.${field} at row ${i + 1} was modified: "${resolvedStage[field]}" -> "${currentStage[field]}"`);
            }
            
            // This field was modified, check if it now has validation errors
            const validation = shouldHighlightCell(currentForm, i, `${stage}.${field}`);
            
            // Only flag as new error if:
            // 1. Current field has validation errors AND
            // 2. Resolved field didn't have validation errors (or was empty/invalid)
            const resolvedValidation = shouldHighlightCell(resolvedSnapshot, i, `${stage}.${field}`);
            
            if (validation.highlight && validation.severity === 'error' && 
                (!resolvedValidation.highlight || resolvedValidation.severity !== 'error')) {
              if (process.env.NODE_ENV === 'development') {
                console.log(`New error detected in ${stage}.${field} at row ${i + 1}`);
                console.log(`Resolved field had errors: ${resolvedValidation.highlight && resolvedValidation.severity === 'error'}`);
              }
              return true;
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log(`No new validation errors in modified field ${stage}.${field} at row ${i + 1}`);
                console.log(`Current validation: ${validation.highlight ? validation.severity : 'none'}`);
                console.log(`Resolved validation: ${resolvedValidation.highlight ? resolvedValidation.severity : 'none'}`);
              }
            }
          }
        }
      }
      
      // Check if type field was modified
      if (currentEntry.type !== resolvedEntry.type) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Type field at row ${i + 1} was modified: "${resolvedEntry.type}" -> "${currentEntry.type}"`);
        }
        
        const validation = shouldHighlightCell(currentForm, i, 'type');
        
        // Only flag as new error if:
        // 1. Current field has validation errors AND
        // 2. Resolved field didn't have validation errors (or was empty/invalid)
        const resolvedValidation = shouldHighlightCell(resolvedSnapshot, i, 'type');
        
        if (validation.highlight && validation.severity === 'error' && 
            (!resolvedValidation.highlight || resolvedValidation.severity !== 'error')) {
          if (process.env.NODE_ENV === 'development') {
            console.log(`New error detected in type field at row ${i + 1}`);
            console.log(`Resolved type field had errors: ${resolvedValidation.highlight && resolvedValidation.severity === 'error'}`);
          }
          return true;
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log(`No new validation errors in modified type field at row ${i + 1}`);
            console.log(`Current type validation: ${validation.highlight ? validation.severity : 'none'}`);
            console.log(`Resolved type validation: ${resolvedValidation.highlight ? resolvedValidation.severity : 'none'}`);
          }
        }
      }
    }
    
    // Check form-level fields
    const formFields = ['thermometerNumber', 'lotNumbers'];
    for (const field of formFields) {
      if (JSON.stringify(currentForm[field]) !== JSON.stringify(resolvedSnapshot[field])) {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Form field ${field} was modified`);
        }
        // For form-level fields, we'll be more conservative and only flag if there are actual validation errors
        // rather than just any change
        return false; // Don't immediately flag form field changes as errors
      }
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('No new errors detected in modified data');
    }
    return false;
  };

  // Development-only performance monitoring
  const onRenderCallback = (id: string, phase: string, actualDuration: number) => {
    if (process.env.NODE_ENV === 'development' && actualDuration > 16) {
      console.warn(`Form render took ${actualDuration.toFixed(2)}ms (${phase})`);
    }
  };

  const handleCellChange = (rowIndex: number, field: string, value: string | boolean) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 handleCellChange called:', { rowIndex, field, value });
    }

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
        try {
          updateEntry(rowIndex, field, value);
        } catch (error) {
          console.error('❌ Error calling updateEntry:', error);
        }

        // Special handling: temperature entries should create a recorded-temp corrective comment
        try {
          const stageMatch = typeof field === 'string' ? field.match(/^([^.]+)\.(temp|time|initial|dataLog)$/) : null;
          if (stageMatch) {
            const stage = stageMatch[1];
            const fieldType = stageMatch[2];

            // Handle temperature fields (recorded-temp comments)
            if (fieldType === 'temp') {
              const tempStr = typeof value === 'string' ? value : String(value ?? '');
              const tempNum = tempStr.trim() === '' ? null : parseFloat(tempStr.replace(/[^\d.-]/g, ''));
              const rowNumber = rowIndex + 1;
              const entry = form?.entries?.[rowIndex];
              const displayText = entry?.type ? `Row ${rowNumber} ${entry.type}` : `Row ${rowNumber}`;
              const stageName =
                stage === 'ccp1'
                  ? 'CCP1'
                  : stage === 'ccp2'
                  ? 'CCP2'
                  : stage === 'coolingTo80'
                  ? '80°F Cooling'
                  : stage === 'coolingTo54'
                  ? '54°F Cooling'
                  : stage === 'finalChill'
                  ? 'Final Chill'
                  : stage;

              const existingComments = form?.correctiveActionsComments || '';

              if (tempNum !== null && !isNaN(tempNum)) {
                // Validate against stage rule; only add comment if validation fails
                const validation = validateTemperatureCell(String(tempNum), stage as any);
                if (!validation.isValid && validation.error) {
                  const targetComment = `Row ${rowNumber} ${stageName} temperature ${tempNum}°F - ${validation.error}`;
                  if (!existingComments.includes(targetComment)) {
                    const updatedComments = existingComments ? `${existingComments}\n${targetComment}` : targetComment;
                    setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
                    if (!readOnly && form) {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { correctiveActionsComments: updatedComments });
                        if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: updatedComments });
                      } else {
                        updateFormField(form.id, 'correctiveActionsComments', updatedComments);
                      }
                    }
                    // Show explicit error toast for CCP1 and CCP2 failures
                    if (stage === 'ccp1' || stage === 'ccp2') {
                      showToast('error', validation.error, rowIndex, stage);
                    }
                  }
                } else {
                  // If temp now valid, remove any existing violation comment for this row/stage
                  const failMarker = `Row ${rowNumber} ${stageName} temperature`;
                  if (existingComments.includes(failMarker)) {
                    const cleaned = existingComments
                      .split('\n')
                      .filter((c) => !c.startsWith(failMarker))
                      .join('\n');
                    setCorrectiveText(formatNumberedTextFromRaw(cleaned));
                    if (!readOnly && form) {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { correctiveActionsComments: cleaned });
                        if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: cleaned });
                      } else {
                        updateFormField(form.id, 'correctiveActionsComments', cleaned);
                      }
                    }
                  }
                }
              } else {
                // cleared: remove any existing violation comment for this row/stage
                const failMarker = `Row ${rowNumber} ${stageName} temperature`;
                if (existingComments.includes(failMarker)) {
                  const cleaned = existingComments
                    .split('\n')
                    .filter((c) => !c.startsWith(failMarker))
                    .join('\n');
                  setCorrectiveText(formatNumberedTextFromRaw(cleaned));
                  if (!readOnly && form) {
                    if (isAdminForm) {
                      updateAdminForm(form.id, { correctiveActionsComments: cleaned });
                      if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: cleaned });
                    } else {
                      updateFormField(form.id, 'correctiveActionsComments', cleaned);
                    }
                  }
                }
              }
            } else if (fieldType === 'time') {
              // Handle time-specific validation (e.g., coolingTo80 time limits)
              if (stage === 'coolingTo80') {
                const newTime = typeof value === 'string' ? value : String(value ?? '');
                const rowNumber = rowIndex + 1;
                const entry = form?.entries?.[rowIndex];
                const existingComments = form?.correctiveActionsComments || '';
                const failMarker = `Row ${rowNumber} 80°F Cooling time`;

                if (newTime && entry?.ccp2?.time) {
                  const timeDiff = getTimeDifferenceMinutes(entry.ccp2.time, newTime);
                  if (timeDiff !== null && timeDiff > 105) {
                    const targetComment = `Row ${rowNumber} 80°F Cooling time ${timeDiff} minutes - Time limit exceeded (105 minutes)`;
                    if (!existingComments.includes(targetComment)) {
                      const updatedComments = existingComments ? `${existingComments}\n${targetComment}` : targetComment;
                      setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
                      if (!readOnly && form) {
                        if (isAdminForm) {
                          updateAdminForm(form.id, { correctiveActionsComments: updatedComments });
                          if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: updatedComments });
                        } else {
                          updateFormField(form.id, 'correctiveActionsComments', updatedComments);
                        }
                      }
                      showToast('error', 'Time limit exceeded for 80°F Cooling', rowIndex, 'coolingTo80');
                    }
                  } else {
                    // remove existing failMarker if time now valid
                    if (existingComments.includes(failMarker)) {
                      const cleaned = existingComments
                        .split('\n')
                        .filter((c) => !c.startsWith(failMarker))
                        .join('\n');
                      setCorrectiveText(formatNumberedTextFromRaw(cleaned));
                      if (!readOnly && form) {
                        if (isAdminForm) {
                          updateAdminForm(form.id, { correctiveActionsComments: cleaned });
                          if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: cleaned });
                        } else {
                          updateFormField(form.id, 'correctiveActionsComments', cleaned);
                        }
                      }
                    }
                  }
                } else if (newTime && !entry?.ccp2?.time) {
                  const targetComment = `Row ${rowNumber} 80°F Cooling time set but missing CCP2 reference time`;
                  if (!existingComments.includes(targetComment)) {
                    const updatedComments = existingComments ? `${existingComments}\n${targetComment}` : targetComment;
                    setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
                    if (!readOnly && form) {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { correctiveActionsComments: updatedComments });
                        if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: updatedComments });
                      } else {
                        updateFormField(form.id, 'correctiveActionsComments', updatedComments);
                      }
                    }
                    showToast('error', 'Missing CCP2 reference time for 80°F Cooling', rowIndex, 'coolingTo80');
                  }
                } else {
                  // cleared - remove any existing failMarker
                    if (existingComments.includes(failMarker)) {
                      const cleaned = existingComments
                        .split('\n')
                        .filter((c) => !c.startsWith(failMarker))
                        .join('\n');
                      setCorrectiveText(formatNumberedTextFromRaw(cleaned));
                      if (!readOnly && form) {
                        if (isAdminForm) {
                          updateAdminForm(form.id, { correctiveActionsComments: cleaned });
                          if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: cleaned });
                        } else {
                          updateFormField(form.id, 'correctiveActionsComments', cleaned);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        console.error('Error processing temperature corrective action logic', err);
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

      // Special case: always validate CCP1.temp and CCP2.temp immediately (mark red if below threshold)
      if ((stageName === 'ccp1' || stageName === 'ccp2') && fieldType === 'temp') {
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

      // For other stages, only show validation highlighting when the stage has temp, time and initial filled
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
    <div className="p-6 bg-white rounded-xl border-2 border-gray-200 max-w-7xl mx-auto">
      {/* Form Header */}
      <div className="mb-6">
        <div className="border-2 border-black mb-4">
          <div className="bg-gray-100 p-4 text-center">
            <h1 className="text-xl font-bold">Cooking and Cooling for Meat & Non Meat Ingredients</h1>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-semibold">Title: </span>
                <input
                  key={`title-${form?.id || 'new'}`}
                  type="text"
                  value={titleInput}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (process.env.NODE_ENV === 'development') {
                      console.log('Title input onChange:', newValue);
                    }
                    setTitleInput(newValue);
                  }}
                  onBlur={(e) => {
                    // Only update the store when user finishes typing
                    const newValue = e.target.value;
                    if (form && !readOnly) {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { title: newValue });
                        if (onFormUpdate) {
                          onFormUpdate(form.id, { title: newValue });
                        }
                      } else {
                        updateFormField(form.id, 'title', newValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    // Also update on Enter key
                    if (e.key === 'Enter') {
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Enter form title (e.g., 'Morning Batch', 'Chicken Prep')"
                  className="border-b-2 border-gray-300 bg-transparent w-full px-2 py-1 transition-all duration-200 ease-in-out focus:border-blue-500 focus:outline-none hover:border-gray-400"
                  readOnly={readOnly}
                />
              </div>
              {/* Initial input removed per request */}
              <div>
                <span className="font-semibold">Date: </span>
                <input
                  type="date"
                  value={ensureDate(form.date).toISOString().split('T')[0]}
                  onChange={(e) => {
                    // Update local state immediately for smooth interaction
                    if (form) {
                      form.date = new Date(e.target.value);
                    }
                  }}
                  onBlur={(e) => {
                    // Only update the store when user finishes interaction
                    const newDate = new Date(e.target.value);
                    if (form && !readOnly) {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { date: newDate });
                        if (onFormUpdate) {
                          onFormUpdate(form.id, { date: newDate });
                        }
                      } else {
                        updateFormField(form.id, 'date', newDate);
                      }
                    }
                  }}
                  className="border-b border-black bg-transparent"
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>
        </div>



        </div>

        {/* Column Headers */}
        <div className="border-2 border-black">
          <React.Profiler id="PaperForm" onRender={onRenderCallback}>
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
              {memoizedEntries.map((entry: any, rowIndex: number) => (
                <tr key={rowIndex} className={rowIndex === 5 ? 'border-t-4 border-black' : ''}>
                  {/* Rack selection */}
                    <td className="border border-black p-1 text-center">
                    <select
                      value={entry.rack ?? ''}
                      onChange={(e) => handleCellChange(rowIndex, 'rack', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center cursor-pointer"
                      disabled={readOnly}
                    >
                      <option value="">--</option>
                      <option value="1st Rack">1st Rack</option>
                      <option value="Last Rack">Last Rack</option>
                    </select>
                  </td>
                  
                  {/* Row number and type */}
                  <td className="border border-black p-1 text-center">
                    <div className="flex items-center justify-center space-x-1">
                      <span className="font-bold text-sm">{rowIndex + 1}.</span>
                      <TextCell
                        formId={form.id}
                        field={`${rowIndex}-type`}
                        valueFromStore={entry.type || ''}
                        readOnly={readOnly}
                        commitField={(value) => commitField(rowIndex, 'type', value.charAt(0).toUpperCase() + value.slice(1).toLowerCase())}
                        className="w-full text-xs border-0 bg-transparent text-center"
                        placeholder="Type"
                      />
                    </div>
                  </td>

                {/* CCP 1 */}
                <td className={`border border-black p-1 ${entry.ccp1.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp1.temp`}
                      valueFromStore={entry.ccp1.temp || ''}
                      readOnly={readOnly}
                      commitField={(value) => { commitField(rowIndex, 'ccp1.temp', value); handleCellChange(rowIndex, 'ccp1.temp', value); }}
                      className={getCellClasses(rowIndex, 'ccp1.temp', 'w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none')}
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
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
                        console.log('CCP1 dataLog changed:', dataLog, 'Row:', rowIndex, 'Form:', form);
                        console.log('Current entry dataLog:', form?.entries?.[rowIndex]?.ccp1?.dataLog);
                        
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
                          
                          console.log('Updated entries:', updatedEntries[rowIndex]);
                          console.log('Form entries after update:', form.entries);
                          
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
                          // Save form immediately when dataLog changes
                          saveForm();
                        }
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp1.initial`}
                      valueFromStore={entry.ccp1.initial || ''}
                      readOnly={readOnly}
                      commitField={(value) => commitField(rowIndex, 'ccp1.initial', value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* CCP 2 */}
                <td className={`border border-black p-1 ${entry.ccp2.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2.temp`}
                      valueFromStore={entry.ccp2.temp || ''}
                      readOnly={readOnly}
                      // Only commit value to store via debounced commit; defer validation to onBlur to avoid
                      // running validation on every keystroke which causes multiple errors while typing.
                      commitField={(value) => { commitField(rowIndex, 'ccp2.temp', value); }}
                      onBlurValidate={(value) => handleCellChange(rowIndex, 'ccp2.temp', value)}
                      shouldHighlightWhileTyping={(next) => {
                        // Highlight red while typing only if the numeric value is below CCP2 min (127)
                        try {
                          const parsed = parseFloat(String(next).replace(/[^\d.-]/g, ''));
                          if (isNaN(parsed)) return false;
                          // Only highlight if below threshold
                          return parsed < 127;
                        } catch (e) {
                          return false;
                        }
                      }}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
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
                            // Save form immediately when dataLog changes
                            saveForm();
                          }
                        }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2.initial`}
                      valueFromStore={entry.ccp2.initial || ''}
                      readOnly={readOnly}
                      commitField={(value) => commitField(rowIndex, 'ccp2.initial', value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* 80°F Cooling */}
                <td className={`border border-black p-1 ${entry.coolingTo80.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-coolingTo80.temp`}
                      valueFromStore={entry.coolingTo80.temp || ''}
                      readOnly={readOnly}
                      // Commit via debounce; validate on blur to avoid per-keystroke corrective comments
                      commitField={(value) => { commitField(rowIndex, 'coolingTo80.temp', value); }}
                      onBlurValidate={(value) => handleCellChange(rowIndex, 'coolingTo80.temp', value)}
                      shouldHighlightWhileTyping={(next) => {
                        const parsed = parseFloat(String(next).replace(/[^\d.-]/g, ''));
                        return !isNaN(parsed) && parsed > 80;
                      }}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
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
                            // Save form immediately when dataLog changes
                            saveForm();
                          }
                        }}
                      />

                    </div>
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-coolingTo80.initial`}
                      valueFromStore={entry.coolingTo80.initial || ''}
                      readOnly={readOnly}
                      commitField={(value) => commitField(rowIndex, 'coolingTo80.initial', value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                                {/* 54°F Cooling */}
                <td className={`border border-black p-1 ${entry.coolingTo54.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-coolingTo54.temp`}
                      valueFromStore={entry.coolingTo54.temp || ''}
                      readOnly={readOnly}
                      commitField={(value) => { commitField(rowIndex, 'coolingTo54.temp', value); handleCellChange(rowIndex, 'coolingTo54.temp', value); }}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
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
                            // Save form immediately when dataLog changes
                            saveForm();
                          }
                        }}
                      />

                    </div>
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-coolingTo54.initial`}
                      valueFromStore={entry.coolingTo54.initial || ''}
                      readOnly={readOnly}
                      commitField={(value) => commitField(rowIndex, 'coolingTo54.initial', value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* Final Chill */}
                <td className={`border border-black p-1 ${entry.finalChill.dataLog ? 'bg-blue-100' : ''}`}>
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-finalChill.temp`}
                      valueFromStore={entry.finalChill.temp || ''}
                      readOnly={readOnly}
                      commitField={(value) => { commitField(rowIndex, 'finalChill.temp', value); handleCellChange(rowIndex, 'finalChill.temp', value); }}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
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
                          // Save form immediately when dataLog changes
                          saveForm();
                        }
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-finalChill.initial`}
                      valueFromStore={entry.finalChill.initial || ''}
                      readOnly={readOnly}
                      commitField={(value) => commitField(rowIndex, 'finalChill.initial', value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </React.Profiler>
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
                onChange={(e) => {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Thermometer input onChange triggered:', e.target.value);
                  }
                  // Update local state immediately for smooth typing
                  if (form) {
                    form.thermometerNumber = e.target.value;
                  }
                }}
                onBlur={(e) => {
                  // Only update the store when user finishes typing
                  const newValue = e.target.value;
                  if (form && !readOnly) {
                    if (isAdminForm) {
                      updateAdminForm(form.id, { thermometerNumber: newValue });
                      if (onFormUpdate) {
                        onFormUpdate(form.id, { thermometerNumber: newValue });
                      }
                    } else {
                      updateFormField(form.id, 'thermometerNumber', newValue);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  // Also update on Enter key
                  if (e.key === 'Enter') {
                    e.currentTarget.blur();
                  }
                }}
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
                      onChange={(e) => {
                        // Update local state immediately for smooth typing
                        if (form) {
                          form.lotNumbers.beef = e.target.value;
                        }
                      }}
                      onBlur={(e) => {
                        // Only update the store when user finishes typing
                        const newValue = e.target.value;
                        if (form && !readOnly) {
                          if (isAdminForm) {
                            updateAdminForm(form.id, { lotNumbers: { ...form.lotNumbers, beef: newValue } });
                            if (onFormUpdate) {
                              onFormUpdate(form.id, { lotNumbers: { ...form.lotNumbers, beef: newValue } });
                            }
                          } else {
                            updateFormField(form.id, 'lotNumbers', { ...form.lotNumbers, beef: newValue });
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Also update on Enter key
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-full border-0 bg-transparent text-sm"
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="border border-black p-1">
                    <input
                      type="text"
                      value={form.lotNumbers.chicken}
                      onChange={(e) => {
                        // Update local state immediately for smooth typing
                        if (form) {
                          form.lotNumbers.chicken = e.target.value;
                        }
                      }}
                      onBlur={(e) => {
                        // Only update the store when user finishes typing
                        const newValue = e.target.value;
                        if (form && !readOnly) {
                          if (isAdminForm) {
                            updateAdminForm(form.id, { lotNumbers: { ...form.lotNumbers, chicken: newValue } });
                            if (onFormUpdate) {
                              onFormUpdate(form.id, { lotNumbers: { ...form.lotNumbers, chicken: newValue } });
                            }
                          } else {
                            updateFormField(form.id, 'lotNumbers', { ...form.lotNumbers, chicken: newValue });
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Also update on Enter key
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      className="w-full border-0 bg-transparent text-sm"
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="border border-black p-1">
                    <input
                      type="text"
                      value={form.lotNumbers.liquidEggs}
                      onChange={(e) => {
                        // Update local state immediately for smooth typing
                        if (form) {
                          form.lotNumbers.liquidEggs = e.target.value;
                        }
                      }}
                      onBlur={(e) => {
                        // Only update the store when user finishes typing
                        const newValue = e.target.value;
                        if (form && !readOnly) {
                          if (isAdminForm) {
                            updateAdminForm(form.id, { lotNumbers: { ...form.lotNumbers, liquidEggs: newValue } });
                            if (onFormUpdate) {
                              onFormUpdate(form.id, { lotNumbers: { ...form.lotNumbers, liquidEggs: newValue } });
                            }
                          } else {
                            updateFormField(form.id, 'lotNumbers', { ...form.lotNumbers, liquidEggs: newValue });
                          }
                        }
                      }}
                      onKeyDown={(e) => {
                        // Also update on Enter key
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
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
              value={correctiveText}
              onChange={(e) => {
                // Update local state immediately for smooth typing
                setCorrectiveText(e.target.value);
              }}
              onBlur={(e) => {
                // Only update the store when user finishes typing
                const displayed = e.target.value;
                const raw = stripNumberingToRaw(displayed);
                if (form && !readOnly) {
                  if (isAdminForm) {
                    updateAdminForm(form.id, { correctiveActionsComments: raw });
                    if (onFormUpdate) {
                      onFormUpdate(form.id, { correctiveActionsComments: raw });
                    }
                  } else {
                    updateFormField(form.id, 'correctiveActionsComments', raw);
                  }
                }
                // Keep the displayed numbered formatting in local state
                setCorrectiveText(formatNumberedTextFromRaw(raw));
              }}
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
                // Save form immediately when completing
                saveForm();
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

  {/* Toast Notifications removed per UX request */}

    </div>
  );
}
