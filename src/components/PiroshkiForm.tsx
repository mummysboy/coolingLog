'use client';

import React, { useState, useEffect } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperFormEntry, FormType, ensureDate, PiroshkiFormEntry } from '@/lib/paperFormTypes';
import { TimePicker } from './TimePicker';
import { TextCell } from './TextCell';
import { validateTemperatureCell, getTimeDifferenceMinutes } from '@/lib/validation';

interface PiroshkiFormProps {
  formData?: PaperFormEntry;
  readOnly?: boolean;
  onSave?: () => void;
  onFormUpdate?: (formId: string, updates: Partial<PaperFormEntry>) => void;
}

type StageKey = "heatTreating" | "ccp2_126" | "ccp2_80" | "ccp2_55" | "finalChill";

export function PiroshkiForm({ formData, readOnly = false, onSave, onFormUpdate }: PiroshkiFormProps = {}) {
  const { currentForm, updateEntry, updateFormField, updateFormStatus, saveForm, updateAdminForm, savedForms } = usePaperFormStore();

  // Debug logging
  console.log('PiroshkiForm render:', { formData, readOnly, currentForm: !!currentForm });

  // Check if we're working with a form from the admin dashboard
  const isAdminForm = false;
  
  // For admin forms, always get the latest data from the store
  // For regular forms, use provided formData or fall back to currentForm from store
  const form = React.useMemo(() => {
    if (isAdminForm && formData) {
      return savedForms.find(f => f.id === formData.id) || formData;
    }
    // Always prioritize currentForm from store for real-time updates
    return currentForm || formData;
  }, [isAdminForm, formData, savedForms, currentForm]) as PiroshkiFormEntry;

  const [correctiveText, setCorrectiveText] = useState("");

  // Initialize correctiveText from the form's stored correctiveActionsComments
  useEffect(() => {
    if (!form) {
      setCorrectiveText("");
      return;
    }
    setCorrectiveText(formatNumberedTextFromRaw(form.correctiveActionsComments));
  }, [form?.correctiveActionsComments, form?.id]);

  if (!form) return null;

  // Helper functions
  const formatNumberedTextFromRaw = (raw?: string) => {
    if (!raw) return "";
    const lines = raw
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l !== "");
    return lines.map((l, idx) => `${idx + 1}. ${l}`).join("\n");
  };

  const stripNumberingToRaw = (numbered: string) => {
    if (!numbered) return "";
    const lines = numbered
      .split("\n")
      .map((l) => l.replace(/^\s*\d+\.\s*/, "").trim())
      .filter((l) => l !== "");
    return lines.join("\n");
  };

  // Stage lock: if a stage has temp, time and initial filled, lock those inputs
  const isStageLocked = (rowIndex: number, stage: StageKey) => {
    if (!form) return false;
    // Admin forms should always be editable via admin UI
    if (isAdminForm) return false;
    const entry = form.entries?.[rowIndex];
    if (!entry) return false;
    const stageData = entry[stage] as any;
    if (!stageData) return false;
    // Locked when all three primary fields are non-empty
    return Boolean(stageData.temp || stageData.temp === 0) && Boolean(stageData.time) && Boolean(stageData.initial);
  };

  // Get cell classes for validation highlighting
  const getCellClasses = (rowIndex: number, field: string, baseClasses: string) => {
    const validation = shouldHighlightCell(form, rowIndex, field);
    if (validation.highlight) {
      const severityClass = validation.severity === 'error' ? 'bg-red-100 border-red-300' : 'bg-yellow-100 border-yellow-300';
      return `${baseClasses} ${severityClass}`;
    }
    return baseClasses;
  };

  // Use the validation helper to decide cell highlighting
  const shouldHighlightCell = (f: any, rowIndex: number, field: string) => {
    if (!f || !f.entries?.[rowIndex]) return { highlight: false, severity: null };
    
    const entry = f.entries[rowIndex];
    const [stage, fieldType] = field.split('.');
    
    if (fieldType === 'temp' && entry[stage]?.temp) {
      // Map Piroshki stages to validation stages
      const validationStage = stage === 'finalChill' ? 'ccp2_finalChill' : stage;
      const result = validateTemperatureCell(entry[stage].temp, validationStage as any);
      
      if (!result.isValid) {
        return {
          highlight: true,
          severity: 'error' as const
        };
      }
    }
    
    return { highlight: false, severity: null };
  };

  const updateCorrectiveActionsForDataLog = (
    rowIndex: number,
    stage: string,
    dataLog: boolean
  ) => {
    if (dataLog && form) {
      // When data log is checked, add it to the corrective actions section
      const stageNames: Record<string, string> = {
        'heatTreating': 'Heat Treating',
        'ccp2_126': 'CCP2 126°F', 
        'ccp2_80': 'CCP2 80°F',
        'ccp2_55': 'CCP2 55°F',
        'finalChill': 'Final Chill',
      };
      
      const stageName = stageNames[stage] || stage;
      
      // Get existing corrective actions
      const existingComments = form.correctiveActionsComments || "";
      
      // Check if this data log entry already exists to avoid duplicates
      const dataLogEntry = `Row ${rowIndex + 1} - ${stageName}: Check data log`;
      if (existingComments.includes(dataLogEntry)) {
        return; // Already exists, don't add duplicate
      }
      
      // Add new data log entry on its own row
      const updatedComments = existingComments 
        ? existingComments + '\n' + dataLogEntry
        : dataLogEntry;
      
      // Update the form with the new corrective actions
      if (isAdminForm) {
        updateAdminForm(form.id, { correctiveActionsComments: updatedComments });
        if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: updatedComments });
      } else {
        updateFormField(form.id, "correctiveActionsComments", updatedComments);
      }
      
      // Update the local state to reflect the change
      setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
    }
  };

  const commitField = async (rowIndex: number, field: string, value: any) => {
    if (!form) return;

    if (isAdminForm) {
      const updatedEntries = [...form.entries];
      const [section, subField] = field.split(".");

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

      try {
        await updateAdminForm(form.id, { entries: updatedEntries });
        if (onFormUpdate) onFormUpdate(form.id, { entries: updatedEntries });
      } catch (error) {
        console.error('Failed to save admin changes:', error);
      }
    } else {
      updateEntry(rowIndex, field, value);
    }
  };

  const handleCellChange = async (rowIndex: number, field: string, value: string | boolean) => {
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
        
        await updateAdminForm(form.id, { entries: updatedEntries });
      } else {
        // For regular forms, use the store's updateEntry
        updateEntry(rowIndex, field, value);
      }
      
      // Auto-save after updating entry (only if form has data and not admin form)
      if (!isAdminForm) {
        setTimeout(() => saveForm(), 100);
      }
    }

    // Side-effects for temperature/time validations & corrective comments
    try {
      const stageMatch =
        typeof field === "string"
          ? field.match(/^([^.]+)\.(temp|time|initial|dataLog)$/)
          : null;
      if (!stageMatch) return;

      const stage = stageMatch[1] as StageKey;
      const fieldType = stageMatch[2];

      // Temperature -> add/remove violation comment
      if (fieldType === "temp") {
        const tempStr = typeof value === "string" ? value : String(value ?? "");
        const tempNum =
          tempStr.trim() === ""
            ? null
            : parseFloat(tempStr.replace(/[^\d.-]/g, ""));
        const rowNumber = rowIndex + 1;
        const entry = form?.entries?.[rowIndex];
        const existingComments = form?.correctiveActionsComments || "";

        const stageLabel: Record<StageKey, string> = {
          heatTreating: "Heat Treating",
          ccp2_126: "126°F CCP2",
          ccp2_80: "80°F CCP2",
          ccp2_55: "55°F CCP2",
          finalChill: "Final Chill",
        };

        if (tempNum !== null && !isNaN(tempNum)) {
          // Use the validation function for proper validation
          const validationStage = stage === 'finalChill' ? 'ccp2_finalChill' : stage;
          const validation = validateTemperatureCell(tempStr, validationStage as any);
          
          if (!validation.isValid && validation.error) {
            // concise single-line comment
            const commentPrefix = `Row ${rowNumber} ${stageLabel[stage]}`;
            const targetComment = `${commentPrefix} ${tempNum}°F — ${validation.error.replace(/Temperature \d+°F is /, '')}`;
            if (!existingComments.includes(targetComment)) {
              const updatedComments = existingComments
                ? `${existingComments}\n${targetComment}`
                : targetComment;
              setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
              if (isAdminForm) {
                updateAdminForm(form.id, {
                  correctiveActionsComments: updatedComments,
                });
                if (onFormUpdate)
                  onFormUpdate(form.id, {
                    correctiveActionsComments: updatedComments,
                  });
              } else {
                updateFormField(
                  form.id,
                  "correctiveActionsComments",
                  updatedComments
                );
              }
            }
          } else {
            // Remove any existing violation comment for this row/stage
            const commentPrefix = `Row ${rowNumber} ${stageLabel[stage]}`;
            if (existingComments.includes(commentPrefix)) {
              const cleaned = existingComments
                .split("\n")
                .filter((c) => !c.startsWith(commentPrefix))
                .join("\n");
              setCorrectiveText(formatNumberedTextFromRaw(cleaned));
              if (isAdminForm) {
                updateAdminForm(form.id, {
                  correctiveActionsComments: cleaned,
                });
                if (onFormUpdate)
                  onFormUpdate(form.id, { correctiveActionsComments: cleaned });
              } else {
                updateFormField(form.id, "correctiveActionsComments", cleaned);
              }
            }
          }
        } else {
          // Cleared -> remove any comment with the same prefix
          const commentPrefix = `Row ${rowNumber} ${stageLabel[stage]}`;
          if (existingComments.includes(commentPrefix)) {
            const cleaned = existingComments
              .split("\n")
              .filter((c) => !c.startsWith(commentPrefix))
              .join("\n");
            setCorrectiveText(formatNumberedTextFromRaw(cleaned));
            if (isAdminForm) {
              updateAdminForm(form.id, { correctiveActionsComments: cleaned });
              if (onFormUpdate)
                onFormUpdate(form.id, { correctiveActionsComments: cleaned });
            } else {
              updateFormField(form.id, "correctiveActionsComments", cleaned);
            }
          }
        }
      }

      // Time-specific: 80°F Cooling window (from CCP2 time)
      if (fieldType === "time" && stage === "ccp2_80") {
        const newTime = typeof value === "string" ? value : String(value ?? "");
        const rowNumber = rowIndex + 1;
        const entry = form?.entries?.[rowIndex];
        const existingComments = form?.correctiveActionsComments || "";
        const commentPrefix = `Row ${rowNumber} 80°F`;

        if (newTime && entry?.ccp2_126?.time) {
          const diff = getTimeDifferenceMinutes(entry.ccp2_126.time, newTime);
          if (diff !== null && diff > 105) {
            // concise single-line time comment
            const targetComment = `${commentPrefix} ${diff}min — >105min`;
            if (!existingComments.includes(targetComment)) {
              const updatedComments = existingComments
                ? `${existingComments}\n${targetComment}`
                : targetComment;
              setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
              if (isAdminForm) {
                updateAdminForm(form.id, {
                  correctiveActionsComments: updatedComments,
                });
                if (onFormUpdate)
                  onFormUpdate(form.id, {
                    correctiveActionsComments: updatedComments,
                  });
              } else {
                updateFormField(
                  form.id,
                  "correctiveActionsComments",
                  updatedComments
                );
              }
            }
          } else if (existingComments.includes(commentPrefix)) {
            const cleaned = existingComments
              .split("\n")
              .filter((c) => !c.startsWith(commentPrefix))
              .join("\n");
            setCorrectiveText(formatNumberedTextFromRaw(cleaned));
            if (isAdminForm) {
              updateAdminForm(form.id, { correctiveActionsComments: cleaned });
              if (onFormUpdate)
                onFormUpdate(form.id, { correctiveActionsComments: cleaned });
            } else {
              updateFormField(form.id, "correctiveActionsComments", cleaned);
            }
          }
        } else if (newTime && !entry?.ccp2_126?.time) {
          // concise missing reference comment
          const targetComment = `${commentPrefix} time set — missing CCP2 time`;
          if (!existingComments.includes(targetComment)) {
            const updatedComments = existingComments
              ? `${existingComments}\n${targetComment}`
              : targetComment;
            setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
            if (isAdminForm) {
              updateAdminForm(form.id, {
                correctiveActionsComments: updatedComments,
              });
              if (onFormUpdate)
                onFormUpdate(form.id, {
                  correctiveActionsComments: updatedComments,
                });
            } else {
              updateFormField(
                form.id,
                "correctiveActionsComments",
                updatedComments
              );
            }
          }
        }
      }

      // Time-specific: 55°F Cooling window (from CCP2 time)
      if (fieldType === "time" && stage === "ccp2_55") {
        const newTime = typeof value === "string" ? value : String(value ?? "");
        const rowNumber = rowIndex + 1;
        const entry = form?.entries?.[rowIndex];
        const existingComments = form?.correctiveActionsComments || "";
        const commentPrefix = `Row ${rowNumber} 55°F`;

        if (newTime && entry?.ccp2_126?.time) {
          const diff = getTimeDifferenceMinutes(entry.ccp2_126.time, newTime);
          if (diff !== null && diff > 4.75 * 60) {
            const targetComment = `${commentPrefix} ${diff}min — >4.75hr`;
            if (!existingComments.includes(targetComment)) {
              const updatedComments = existingComments
                ? `${existingComments}\n${targetComment}`
                : targetComment;
              setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
              if (isAdminForm) {
                updateAdminForm(form.id, {
                  correctiveActionsComments: updatedComments,
                });
                if (onFormUpdate)
                  onFormUpdate(form.id, {
                    correctiveActionsComments: updatedComments,
                  });
              } else {
                updateFormField(
                  form.id,
                  "correctiveActionsComments",
                  updatedComments
                );
              }
            }
          } else if (existingComments.includes(commentPrefix)) {
            const cleaned = existingComments
              .split("\n")
              .filter((c) => !c.startsWith(commentPrefix))
              .join("\n");
            setCorrectiveText(formatNumberedTextFromRaw(cleaned));
            if (isAdminForm) {
              updateAdminForm(form.id, { correctiveActionsComments: cleaned });
              if (onFormUpdate)
                onFormUpdate(form.id, { correctiveActionsComments: cleaned });
            } else {
              updateFormField(form.id, "correctiveActionsComments", cleaned);
            }
          }
        } else if (newTime && !entry?.ccp2_126?.time) {
          const targetComment = `Row ${rowNumber} 55°F time set — missing CCP2 time`;
          if (!existingComments.includes(targetComment)) {
            const updatedComments = existingComments
              ? `${existingComments}\n${targetComment}`
              : targetComment;
            setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
            if (isAdminForm) {
              updateAdminForm(form.id, {
                correctiveActionsComments: updatedComments,
              });
              if (onFormUpdate)
                onFormUpdate(form.id, {
                  correctiveActionsComments: updatedComments,
                });
            } else {
              updateFormField(
                form.id,
                "correctiveActionsComments",
                updatedComments
              );
            }
          }
        }
      }
    } catch (error) {
      console.error("❌ Error in handleCellChange side-effects:", error);
    }
  };

  const handleFormFieldChange = async (field: string, value: any) => {
    if (!readOnly) {
      if (isAdminForm) {
        // For admin forms, update the specific form directly
        await updateAdminForm(form.id, { [field]: value });
        
        // Notify parent component of the update
        if (onFormUpdate) {
          onFormUpdate(form.id, { [field]: value });
        }
      } else {
        // Special handling for date changes
        if (field === 'date') {
          const newDate = new Date(value);
          updateFormField(form.id, field, value);
        } else {
          updateFormField(form.id, field, value);
        }
        
        // Auto-save after updating field (only if form has data)
        setTimeout(() => saveForm(), 100);
      }
    }
  };

  return (
    <div className="bg-white p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 p-4 text-center">
          <h1 className="text-xl font-bold">Piroshki, Calzone, Empanada Heat Treating & Cooling CCP 2</h1>
          <div className="text-sm text-gray-600 mt-1">Modified 03/18/25 from 11/22/22</div>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="font-semibold">Title: </span>
              <input
                key={`title-${form?.id || 'new'}`}
                type="text"
                value={form?.title || ''}
                onChange={async (e) => await handleFormFieldChange('title', e.target.value)}
                placeholder="Enter form title (e.g., 'Morning Batch', 'Pastry Prep')"
                className="border-b-2 border-gray-300 bg-transparent w-full px-2 py-1 transition-all duration-200 ease-in-out focus:border-blue-500 focus:outline-none hover:border-gray-400"
                readOnly={readOnly}
              />
            </div>
            <div>
              <span className="font-semibold">Date: </span>
              <input
                type="date"
                value={ensureDate(form.date).toISOString().split('T')[0]}
                onChange={async (e) => await handleFormFieldChange('date', new Date(e.target.value))}
                className="border-b border-black bg-transparent"
                readOnly={readOnly}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Data Entry Table */}
      <div className="border-2 border-black mb-4">
        <table className="w-full border-collapse">
          {/* Header Row 1 */}
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-16">Date</th>
              <th className="border border-black p-2 w-32">
                Heat Treating Step Temperature Must reach 165°F or greater
              </th>
              <th className="border border-black p-2 w-32">
                126°F or greater CCP 2<br/>
                <small>Record Temperature of 1st and LAST rack/batch of the day</small>
              </th>
              <th className="border border-black p-2 w-32">
                80°F or below within 105 minutes CCP 2<br/>
                <small>Record Temperature of 1st rack/batch of the day</small>
              </th>
              <th className="border border-black p-2 w-32">
                55°F or below within 4.75 hr
              </th>
              <th className="border border-black p-2 w-40">
                Chill Continuously to 40°F or below
              </th>
            </tr>
            {/* Header Row 2 - Sub columns */}
            <tr className="bg-gray-50">
              <th className="border border-black p-1 text-sm">Date</th>
              <th className="border border-black p-1">
                <div className="grid grid-cols-4 gap-1 text-xs">
                  <div>Type</div>
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
          
          {/* Data Rows 1-9 */}
          <tbody>
            {form.entries.map((entry: any, rowIndex: number) => (
              <tr key={rowIndex} className="border-b border-gray-300">
                {/* Row Number */}
                <td className="border border-black p-1 text-center font-semibold">
                  {rowIndex + 1}
                </td>
                
                {/* Heat Treating Step - Only show for rows 1-2 */}
                {rowIndex < 2 ? (
                  <td className={`border border-black p-1 ${
                    entry.heatTreating?.dataLog ? "bg-blue-100" : ""
                  }`}>
                    <div className="grid grid-cols-4 gap-1">
                      <TextCell
                        formId={form.id}
                        field={`${rowIndex}-heatTreating.type`}
                        valueFromStore={entry.heatTreating?.type || ""}
                        readOnly={readOnly || isStageLocked(rowIndex, 'heatTreating')}
                        commitField={(value: string) =>
                          commitField(
                            rowIndex,
                            "heatTreating.type",
                            value.charAt(0).toUpperCase() +
                              value.slice(1).toLowerCase()
                          )
                        }
                        className="w-full text-xs border-0 bg-transparent text-center"
                        placeholder="Type"
                        maxLength={3}
                      />
                      <TextCell
                        formId={form.id}
                        field={`${rowIndex}-heatTreating.temp`}
                        valueFromStore={entry.heatTreating?.temp || ""}
                        readOnly={readOnly || isStageLocked(rowIndex, 'heatTreating')}
                        commitField={(value: string) => {
                          commitField(rowIndex, "heatTreating.temp", value);
                        }}
                        onBlurValidate={async (value: string) =>
                          await handleCellChange(rowIndex, "heatTreating.temp", value)
                        }
                        className={getCellClasses(
                          rowIndex,
                          "heatTreating.temp",
                          "w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        )}
                        placeholder="°F"
                        type="number"
                        step="0.1"
                        min="0"
                        max="300"
                        inputMode="decimal"
                      />
                      <TimePicker
                        value={entry.heatTreating?.time}
                        onChange={async (time: string) =>
                          await handleCellChange(rowIndex, "heatTreating.time", time)
                        }
                        placeholder="Time"
                        className={getCellClasses(rowIndex, "heatTreating.time", "w-full")}
                        disabled={readOnly || isStageLocked(rowIndex, 'heatTreating')}
                        showQuickTimes={false}
                        compact
                        dataLog={entry.heatTreating?.dataLog || false}
                        onDataLogChange={async (dataLog: boolean) => {
                          if (!form) return;
                          const updatedEntries = [...form.entries];
                          updatedEntries[rowIndex] = {
                            ...updatedEntries[rowIndex],
                            heatTreating: { ...updatedEntries[rowIndex].heatTreating, dataLog },
                          };
                          if (isAdminForm) {
                            await updateAdminForm(form.id, { entries: updatedEntries });
                          } else {
                            updateFormField(form.id, "entries", updatedEntries);
                          }
                          updateCorrectiveActionsForDataLog(
                            rowIndex,
                            "heatTreating",
                            dataLog
                          );
                          await handleCellChange(rowIndex, "heatTreating.dataLog", dataLog);
                          if (!readOnly) saveForm();
                        }}
                      />
                      <TextCell
                        formId={form.id}
                        field={`${rowIndex}-heatTreating.initial`}
                        valueFromStore={entry.heatTreating?.initial || ""}
                        readOnly={readOnly || isStageLocked(rowIndex, 'heatTreating')}
                        commitField={(value: string) =>
                          commitField(
                            rowIndex,
                            "heatTreating.initial",
                            value.toUpperCase()
                          )
                        }
                        className="w-full text-xs border-0 bg-transparent text-center"
                        placeholder="Init"
                        maxLength={3}
                      />
                    </div>
                  </td>
                ) : (
                  <td className="border border-black p-1 bg-gray-50"></td>
                )}

                {/* 126°F or greater CCP 2 */}
                <td className={`border border-black p-1 ${
                  entry.ccp2_126?.dataLog ? "bg-blue-100" : ""
                }`}>
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2_126.temp`}
                      valueFromStore={entry.ccp2_126?.temp || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp2_126')}
                      commitField={(value: string) => {
                        commitField(rowIndex, "ccp2_126.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(rowIndex, "ccp2_126.temp", value)
                      }
                      className={getCellClasses(
                        rowIndex,
                        "ccp2_126.temp",
                        "w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      )}
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                    />
                    <TimePicker
                      value={entry.ccp2_126?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(rowIndex, "ccp2_126.time", time)
                      }
                      placeholder="Time"
                      className={getCellClasses(rowIndex, "ccp2_126.time", "w-full")}
                      disabled={readOnly || isStageLocked(rowIndex, 'ccp2_126')}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.ccp2_126?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        if (!form) return;
                        const updatedEntries = [...form.entries];
                        updatedEntries[rowIndex] = {
                          ...updatedEntries[rowIndex],
                          ccp2_126: { ...updatedEntries[rowIndex].ccp2_126, dataLog },
                        };
                        if (isAdminForm) {
                          await updateAdminForm(form.id, { entries: updatedEntries });
                        } else {
                          updateFormField(form.id, "entries", updatedEntries);
                        }
                        updateCorrectiveActionsForDataLog(
                          rowIndex,
                          "ccp2_126",
                          dataLog
                        );
                        await handleCellChange(rowIndex, "ccp2_126.dataLog", dataLog);
                        if (!readOnly) saveForm();
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2_126.initial`}
                      valueFromStore={entry.ccp2_126?.initial || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp2_126')}
                      commitField={(value: string) =>
                        commitField(
                          rowIndex,
                          "ccp2_126.initial",
                          value.toUpperCase()
                        )
                      }
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* 80°F or below within 105 minutes */}
                <td className={`border border-black p-1 ${
                  entry.ccp2_80?.dataLog ? "bg-blue-100" : ""
                }`}>
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2_80.temp`}
                      valueFromStore={entry.ccp2_80?.temp || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp2_80')}
                      commitField={(value: string) => {
                        commitField(rowIndex, "ccp2_80.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(rowIndex, "ccp2_80.temp", value)
                      }
                      className={getCellClasses(
                        rowIndex,
                        "ccp2_80.temp",
                        "w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      )}
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                    />
                    <TimePicker
                      value={entry.ccp2_80?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(rowIndex, "ccp2_80.time", time)
                      }
                      placeholder="Time"
                      className={getCellClasses(rowIndex, "ccp2_80.time", "w-full")}
                      disabled={readOnly || isStageLocked(rowIndex, 'ccp2_80')}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.ccp2_80?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        if (!form) return;
                        const updatedEntries = [...form.entries];
                        updatedEntries[rowIndex] = {
                          ...updatedEntries[rowIndex],
                          ccp2_80: { ...updatedEntries[rowIndex].ccp2_80, dataLog },
                        };
                        if (isAdminForm) {
                          await updateAdminForm(form.id, { entries: updatedEntries });
                        } else {
                          updateFormField(form.id, "entries", updatedEntries);
                        }
                        updateCorrectiveActionsForDataLog(
                          rowIndex,
                          "ccp2_80",
                          dataLog
                        );
                        await handleCellChange(rowIndex, "ccp2_80.dataLog", dataLog);
                        if (!readOnly) saveForm();
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2_80.initial`}
                      valueFromStore={entry.ccp2_80?.initial || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp2_80')}
                      commitField={(value: string) =>
                        commitField(
                          rowIndex,
                          "ccp2_80.initial",
                          value.toUpperCase()
                        )
                      }
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* 55°F or below within 4.75 hr */}
                <td className={`border border-black p-1 ${
                  entry.ccp2_55?.dataLog ? "bg-blue-100" : ""
                }`}>
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2_55.temp`}
                      valueFromStore={entry.ccp2_126?.temp || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp2_55')}
                      commitField={(value: string) => {
                        commitField(rowIndex, "ccp2_55.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(rowIndex, "ccp2_55.temp", value)
                      }
                      className={getCellClasses(
                        rowIndex,
                        "ccp2_55.temp",
                        "w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      )}
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                    />
                    <TimePicker
                      value={entry.ccp2_55?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(rowIndex, "ccp2_55.time", time)
                      }
                      placeholder="Time"
                      className={getCellClasses(rowIndex, "ccp2_55.time", "w-full")}
                      disabled={readOnly || isStageLocked(rowIndex, 'ccp2_55')}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.ccp2_55?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        if (!form) return;
                        const updatedEntries = [...form.entries];
                        updatedEntries[rowIndex] = {
                          ...updatedEntries[rowIndex],
                          ccp2_55: { ...updatedEntries[rowIndex].ccp2_55, dataLog },
                        };
                        if (isAdminForm) {
                          await updateAdminForm(form.id, { entries: updatedEntries });
                        } else {
                          updateFormField(form.id, "entries", updatedEntries);
                        }
                        updateCorrectiveActionsForDataLog(
                          rowIndex,
                          "ccp2_55",
                          dataLog
                        );
                        await handleCellChange(rowIndex, "ccp2_55.dataLog", dataLog);
                        if (!readOnly) saveForm();
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2_55.initial`}
                      valueFromStore={entry.ccp2_55?.initial || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp2_55')}
                      commitField={(value: string) =>
                        commitField(
                          rowIndex,
                          "ccp2_55.initial",
                          value.toUpperCase()
                        )
                      }
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* Chill Continuously to 40°F */}
                <td className={`border border-black p-1 ${
                  entry.finalChill?.dataLog ? "bg-blue-100" : ""
                }`}>
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-finalChill.temp`}
                      valueFromStore={entry.finalChill?.temp || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'finalChill')}
                      commitField={(value: string) => {
                        commitField(rowIndex, "finalChill.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(rowIndex, "finalChill.temp", value)
                      }
                      className={getCellClasses(
                        rowIndex,
                        "finalChill.temp",
                        "w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      )}
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                    />
                    <TimePicker
                      value={entry.finalChill?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(rowIndex, "finalChill.time", time)
                      }
                      placeholder="Time"
                      className={getCellClasses(rowIndex, "finalChill.time", "w-full")}
                      disabled={readOnly || isStageLocked(rowIndex, 'finalChill')}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.finalChill?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        if (!form) return;
                        const updatedEntries = [...form.entries];
                        updatedEntries[rowIndex] = {
                          ...updatedEntries[rowIndex],
                          finalChill: { ...updatedEntries[rowIndex].finalChill, dataLog },
                        };
                        if (isAdminForm) {
                          await updateAdminForm(form.id, { entries: updatedEntries });
                        } else {
                          updateFormField(form.id, "entries", updatedEntries);
                        }
                        updateCorrectiveActionsForDataLog(
                          rowIndex,
                          "finalChill",
                          dataLog
                        );
                        await handleCellChange(rowIndex, "finalChill.dataLog", dataLog);
                        if (!readOnly) saveForm();
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-finalChill.initial`}
                      valueFromStore={entry.finalChill?.initial || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'finalChill')}
                      commitField={(value: string) =>
                        commitField(
                          rowIndex,
                          "finalChill.initial",
                          value.toUpperCase()
                        )
                      }
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
      </div>

      {/* LAST RACK/BATCH of Production Day Section */}
      <div className="border-2 border-black border-t-0 mb-4">
        <div className="bg-gray-100 p-2 text-center font-semibold border-b border-black">
          LAST RACK/BATCH of Production Day
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-black p-1 w-32">
                126°F or greater CCP 2
              </th>
              <th className="border border-black p-1 w-32">
                80°F or below within 105 minutes CCP 2
              </th>
              <th className="border border-black p-1 w-32">
                55°F or below within 4.75 hr
              </th>
              <th className="border border-black p-1 w-40">
                Chill Continuously to 40°F or below
              </th>
            </tr>
            <tr className="bg-gray-50">
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
          <tbody>
            <tr>
              <td className="border border-black p-1">
                <div className="grid grid-cols-3 gap-1">
                  <TextCell
                    formId={form.id}
                    field="lastRackBatch.ccp2_126.temp"
                    valueFromStore={form.lastRackBatch?.ccp2_126?.temp || ""}
                    readOnly={readOnly}
                    commitField={(value: string) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            ccp2_126: { ...form.lastRackBatch?.ccp2_126, temp: value } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.ccp2_126.temp", value);
                      }
                    }}
                    className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    placeholder="°F"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    inputMode="decimal"
                  />
                  <TimePicker
                    value={form.lastRackBatch?.ccp2_126?.time || ''}
                    onChange={(time) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            ccp2_126: { ...form.lastRackBatch?.ccp2_126, time } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.ccp2_126.time", time);
                      }
                    }}
                    placeholder="Time"
                    className="w-full"
                    disabled={readOnly}
                    showQuickTimes={false}
                    compact={true}
                  />
                  <TextCell
                    formId={form.id}
                    field="lastRackBatch.ccp2_126.initial"
                    valueFromStore={form.lastRackBatch?.ccp2_126?.initial || ""}
                    readOnly={readOnly}
                    commitField={(value: string) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            ccp2_126: { ...form.lastRackBatch?.ccp2_126, initial: value.toUpperCase() } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.ccp2_126.initial", value.toUpperCase());
                      }
                    }}
                    className="w-full text-xs border-0 bg-transparent text-center"
                    placeholder="Init"
                    maxLength={3}
                  />
                </div>
              </td>
              <td className="border border-black p-1">
                <div className="grid grid-cols-3 gap-1">
                  <TextCell
                    formId={form.id}
                    field="lastRackBatch.ccp2_80.temp"
                    valueFromStore={form.lastRackBatch?.ccp2_80?.temp || ""}
                    readOnly={readOnly}
                    commitField={(value: string) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            ccp2_80: { ...form.lastRackBatch?.ccp2_80, temp: value } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.ccp2_80.temp", value);
                      }
                    }}
                    className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    placeholder="°F"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    inputMode="decimal"
                  />
                  <TimePicker
                    value={form.lastRackBatch?.ccp2_80?.time || ''}
                    onChange={(time) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            ccp2_80: { ...form.lastRackBatch?.ccp2_80, time } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.ccp2_80.time", time);
                      }
                    }}
                    placeholder="Time"
                    className="w-full"
                    disabled={readOnly}
                    showQuickTimes={false}
                    compact={true}
                  />
                  <TextCell
                    formId={form.id}
                    field="lastRackBatch.ccp2_80.initial"
                    valueFromStore={form.lastRackBatch?.ccp2_80?.initial || ""}
                    readOnly={readOnly}
                    commitField={(value: string) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            ccp2_80: { ...form.lastRackBatch?.ccp2_80, initial: value.toUpperCase() } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.ccp2_80.initial", value.toUpperCase());
                      }
                    }}
                    className="w-full text-xs border-0 bg-transparent text-center"
                    placeholder="Init"
                    maxLength={3}
                  />
                </div>
              </td>
              <td className="border border-black p-1">
                <div className="grid grid-cols-3 gap-1">
                  <TextCell
                    formId={form.id}
                    field="lastRackBatch.ccp2_55.temp"
                    valueFromStore={form.lastRackBatch?.ccp2_55?.temp || ""}
                    readOnly={readOnly}
                    commitField={(value: string) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            ccp2_55: { ...form.lastRackBatch?.ccp2_55, temp: value } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.ccp2_55.temp", value);
                      }
                    }}
                    className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    placeholder="°F"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    inputMode="decimal"
                  />
                  <TimePicker
                    value={form.lastRackBatch?.ccp2_55?.time || ''}
                    onChange={(time) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            ccp2_55: { ...form.lastRackBatch?.ccp2_55, time } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.ccp2_55.time", time);
                      }
                    }}
                    placeholder="Time"
                    className="w-full"
                    disabled={readOnly}
                    showQuickTimes={false}
                    compact={true}
                  />
                  <TextCell
                    formId={form.id}
                    field="lastRackBatch.ccp2_55.initial"
                    valueFromStore={form.lastRackBatch?.ccp2_55?.initial || ""}
                    readOnly={readOnly}
                    commitField={(value: string) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            ccp2_55: { ...form.lastRackBatch?.ccp2_55, initial: value.toUpperCase() } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.ccp2_55.initial", value.toUpperCase());
                      }
                    }}
                    className="w-full text-xs border-0 bg-transparent text-center"
                    placeholder="Init"
                    maxLength={3}
                  />
                </div>
              </td>
              <td className="border border-black p-1">
                <div className="grid grid-cols-3 gap-1">
                  <TextCell
                    formId={form.id}
                    field="lastRackBatch.finalChill.temp"
                    valueFromStore={form.lastRackBatch?.finalChill?.temp || ""}
                    readOnly={readOnly}
                    commitField={(value: string) => {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { 
                          lastRackBatch: { 
                            ...form.lastRackBatch, 
                            finalChill: { ...form.lastRackBatch?.finalChill, temp: value } 
                          } 
                        });
                      } else {
                        updateFormField(form.id, "lastRackBatch.finalChill.temp", value);
                      }
                    }}
                    className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                    placeholder="°F"
                    type="number"
                    step="0.1"
                    min="0"
                    max="300"
                    inputMode="decimal"
                  />
                                       <TimePicker
                       value={form.lastRackBatch?.finalChill?.time || ''}
                       onChange={(time) => {
                         if (isAdminForm) {
                           updateAdminForm(form.id, { 
                             lastRackBatch: { 
                               ...form.lastRackBatch, 
                               finalChill: { ...form.lastRackBatch?.finalChill, time } 
                             } 
                           });
                         } else {
                           updateFormField(form.id, "lastRackBatch.finalChill.time", time);
                         }
                       }}
                       placeholder="Time"
                       className="w-full"
                       disabled={readOnly}
                       showQuickTimes={false}
                       compact={true}
                     />
                     <TextCell
                       formId={form.id}
                       field="lastRackBatch.finalChill.initial"
                       valueFromStore={form.lastRackBatch?.finalChill?.initial || ""}
                       readOnly={readOnly}
                       commitField={(value: string) => {
                         if (isAdminForm) {
                           updateAdminForm(form.id, { 
                             lastRackBatch: { 
                               ...form.lastRackBatch, 
                               finalChill: { ...form.lastRackBatch?.finalChill, initial: value.toUpperCase() } 
                             } 
                           });
                         } else {
                           updateFormField(form.id, "lastRackBatch.finalChill.initial", value.toUpperCase());
                         }
                       }}
                       className="w-full text-xs border-0 bg-transparent text-center"
                       placeholder="Init"
                       maxLength={3}
                     />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Section - Arranged exactly like the image */}
      <div className="border-2 border-black border-t-0">
        <div className="grid grid-cols-3 gap-0">
          {/* Left side - Thermometer and Quantity/Flavor */}
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
            
            {/* Quantity and Flavor Produced */}
            <div className="p-2">
              <div className="font-semibold text-center mb-2">Quantity and Flavor Produced</div>
              <table className="w-full border-collapse">
                <tbody>
                  <tr>
                    <td className="border border-black p-1 text-center font-semibold">Quantity</td>
                    <td className="border border-black p-1 text-center font-semibold">Flavor</td>
                  </tr>
                  {[1, 2, 3].map((row) => (
                    <tr key={row}>
                      <td className="border border-black p-1">
                        <input
                          type="text"
                          value={form.quantityAndFlavor?.[row]?.quantity || ''}
                          onChange={(e) => {
                            const updated = { ...form.quantityAndFlavor };
                            if (!updated[row]) updated[row] = { quantity: '', flavor: '' };
                            updated[row].quantity = e.target.value;
                            handleFormFieldChange('quantityAndFlavor', updated);
                          }}
                          className="w-full border-0 bg-transparent text-sm text-center"
                          readOnly={readOnly}
                        />
                      </td>
                      <td className="border border-black p-1">
                        <input
                          type="text"
                          value={form.quantityAndFlavor?.[row]?.flavor || ''}
                          onChange={(e) => {
                            const updated = { ...form.quantityAndFlavor };
                            if (!updated[row]) updated[row] = { quantity: '', flavor: '' };
                            updated[row].flavor = e.target.value;
                            handleFormFieldChange('quantityAndFlavor', updated);
                          }}
                          className="w-full border-0 bg-transparent text-sm text-center"
                          readOnly={readOnly}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Middle - Ingredients Table */}
          <div className="border-r border-black">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border border-black p-2 bg-gray-100">Ingredient</th>
                  <th className="border border-black p-2 bg-gray-100">Beef</th>
                  <th className="border border-black p-2 bg-gray-100">Chicken</th>
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
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right side - Pre Shipment Review and Corrective Actions */}
          <div className="p-4">
            {/* Pre Shipment Review */}
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Pre Shipment Review</h3>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <label className="block text-xs font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={form.preShipmentReview?.date || ''}
                    onChange={(e) => {
                      const updated = { ...form.preShipmentReview };
                      updated.date = e.target.value;
                      handleFormFieldChange('preShipmentReview', updated);
                    }}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                    readOnly={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Initials</label>
                  <input
                    type="text"
                    value={form.preShipmentReview?.initials || ''}
                    onChange={(e) => {
                      const updated = { ...form.preShipmentReview };
                      updated.initials = e.target.value.toUpperCase();
                      handleFormFieldChange('preShipmentReview', updated);
                    }}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                    placeholder="Init"
                    maxLength={3}
                    readOnly={readOnly}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700">Results (P/F)</label>
                  <select
                    value={form.preShipmentReview?.results || ''}
                    onChange={(e) => {
                      const updated = { ...form.preShipmentReview };
                      updated.results = e.target.value;
                      handleFormFieldChange('preShipmentReview', updated);
                    }}
                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs"
                    disabled={readOnly}
                  >
                    <option value="">Select</option>
                    <option value="P">Pass</option>
                    <option value="F">Fail</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Corrective Actions */}
            <div>
              <h3 className="font-semibold mb-2">Corrective Actions & comments:</h3>
                              <textarea
                  value={correctiveText}
                  onChange={(e) => setCorrectiveText(e.target.value)}
                  onBlur={async () => {
                    const rawText = stripNumberingToRaw(correctiveText);
                    if (isAdminForm) {
                      await updateAdminForm(form.id, { correctiveActionsComments: rawText });
                      if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: rawText });
                    } else {
                      updateFormField(form.id, "correctiveActionsComments", rawText);
                      setTimeout(() => saveForm(), 100);
                    }
                  }}
                  className="w-full h-32 border border-gray-300 p-2 text-sm resize-none"
                  placeholder="Enter any corrective actions taken or additional comments..."
                  readOnly={readOnly}
                />
            </div>
          </div>
        </div>
      </div>

      {/* Complete Button - Only show if form is not already complete and not read-only */}
      {!readOnly && form.status !== 'Complete' && (
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              try {
                console.log('🔄 Starting form completion process...');
                
                // Update form status to Complete
                if (onFormUpdate) {
                  onFormUpdate(form.id, { status: 'Complete' });
                }
                
                if (isAdminForm) {
                  await updateAdminForm(form.id, { status: 'Complete' });
                  console.log('✅ Admin form status updated to Complete');
                } else {
                  // Check if form has client-generated ID (needs to be saved first)
                  if (form.id.startsWith('form-')) {
                    console.log('🔄 Form has client-generated ID, saving full form first...');
                    try {
                      await saveForm();
                      console.log('✅ Full form saved successfully');
                    } catch (error) {
                      console.error('❌ Error saving full form:', error);
                      return;
                    }
                  }
                  
                  // Use updateFormStatus which handles AWS persistence and updates both currentForm and savedForms
                  updateFormStatus(form.id, 'Complete');
                  
                  // Also ensure the full form is saved again to persist all changes
                  setTimeout(async () => {
                    try {
                      await saveForm();
                      console.log('✅ Form status updated and full form saved successfully');
                    } catch (error) {
                      console.error('❌ Error saving form after status update:', error);
                    }
                  }, 1000); // Wait a bit longer for the status update to complete
                  
                  console.log('✅ Form status updated to Complete');
                }
              } catch (error) {
                console.error('❌ Error updating form status:', error);
              }
            }}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
          >
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
    </div>
  );
}
