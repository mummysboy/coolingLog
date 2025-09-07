"use client";

import React, { useState, useEffect } from "react";
import { usePaperFormStore } from "../stores/paperFormStore";
import {
  validateTemperatureCell,
  validateForm,
  getTimeDifferenceMinutes,
  shouldHighlightCell as validateCellHighlight,
} from "../lib/validation";
import { TimePicker } from "./TimePicker";
import { TextCell } from "./TextCell";
import { DatePicker } from "./DatePicker";


interface PaperFormProps {
  formId: string;
  readOnly?: boolean;
  isAdminForm?: boolean;
  formData?: any;
  onFormUpdate?: (formId: string, updates: any) => void;
}

type StageKey = "ccp1" | "ccp2" | "coolingTo80" | "coolingTo54" | "finalChill";

export default function PaperForm({
  formId,
  readOnly = false,
  isAdminForm = false,
  formData,
  onFormUpdate,
}: PaperFormProps) {
  const {
    currentForm: storeForm,
    updateFormField,
    updateFormStatus,
    saveForm,
    updateEntry,
    updateAdminForm,
  } = usePaperFormStore();

  // allow parent to pass form data (admin modal) — for normal usage prefer the store
  // Keep using the passed `formData` only when this is an admin-edit context so
  // parent-driven forms remain editable by the admin UI. For regular forms we
  // always read from the store so updates from `updateFormField`/`updateEntry`
  // are reflected immediately in the UI (fixes non-editable lotNumbers inputs).
  const form = isAdminForm && formData ? formData : storeForm;

  const [correctiveText, setCorrectiveText] = useState("");
  const [titleInput, setTitleInput] = useState(form?.title || "");
  const [ingredientCols, setIngredientCols] = useState<Array<{ key: string; label: string }>>([]);


  // Keep the title input in sync when the parent passes a new form object
  useEffect(() => {
    setTitleInput(form?.title || "");
  }, [form?.id, form?.title]);

  // Ingredient columns: keep editable labels and keys in-sync with the form.
  // Persist as `ingredientColumns` on the form when changed. Fall back to
  // legacy lotNumbers keys if present (beef/chicken/liquidEggs).
  useEffect(() => {
    if (!form) return;
    if (Array.isArray(form.ingredientColumns) && form.ingredientColumns.length) {
      setIngredientCols(form.ingredientColumns);
      return;
    }
    const legacy = form.lotNumbers || {};
    // Show placeholder-style prefills (Ingredient 1/2/3) by default.
    // Labels are left empty so the input placeholder is visible and faded.
    const defaults = [
      { key: "beef", label: "" },
      { key: "chicken", label: "" },
      { key: "liquidEggs", label: "" },
    ];

    // If legacy keys exist, use them first for labels
    const derived = defaults.map((d) => {
      if (Object.prototype.hasOwnProperty.call(legacy, d.key)) return d;
      return d;
    });

    setIngredientCols(derived);
  }, [form?.id, form?.lotNumbers, form?.ingredientColumns]);

  const slugForLabel = (label: string, idx: number) => {
    if (!label || String(label).trim() === "") return `ingredient${idx}`;
    // create a compact key: remove non-alphanum, camelCase-ish
    const cleaned = String(label)
      .trim()
      .replace(/[^a-zA-Z0-9 ]+/g, "")
      .split(/\s+/)
      .map((p, i) => (i === 0 ? p.toLowerCase() : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()))
      .join("");
    return cleaned || `ingredient${idx}`;
  };
  // Initialize correctiveText from the form's stored correctiveActionsComments so
  // the expanded form shows the same comments that the admin list displays.
  useEffect(() => {
    if (!form) {
      setCorrectiveText("");
      return;
    }

    setCorrectiveText(formatNumberedTextFromRaw(form.correctiveActionsComments));
  }, [form?.correctiveActionsComments, form?.id]);

  // Memoize entries cheaply; Zustand will re-render when 'entries' changes
  const memoizedEntries = form?.entries || [];

  // Stage lock: if a stage has temp, time and initial filled AND the form has been saved (not dirty), lock those inputs
  const isStageLocked = (rowIndex: number, stage: StageKey) => {
    if (!form) return false;
    // Admin forms should always be editable via admin UI
    if (isAdminForm) return false;
    
    // Check if this form has been saved (not dirty)
    const { currentFormDirty } = usePaperFormStore.getState();
    const isFormSaved = !currentFormDirty;
    
    // Only lock if form is saved AND all three primary fields are non-empty
    if (!isFormSaved) return false;
    
    const entry = form.entries?.[rowIndex];
    if (!entry) return false;
    const stageData = entry[stage] as any;
    if (!stageData) return false;
    // Locked when all three primary fields are non-empty AND form is saved
    return Boolean(stageData.temp || stageData.temp === 0) && Boolean(stageData.time) && Boolean(stageData.initial);
  };

  // --- Helper utilities ------------------------------------------------------

  const ensureDate = (date: any) => {
    if (date instanceof Date) return date;
    if (typeof date === "string") return new Date(date);
    return new Date();
  };

  const formatToMMDDYYYY = (d: any) => {
    if (!d) return "";
    const dateObj = ensureDate(d);
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const yyyy = String(dateObj.getFullYear());
    return `${mm}/${dd}/${yyyy}`;
  };

  // Use the validation helper to decide cell highlighting
  const shouldHighlightCell = (f: any, rowIndex: number, field: string) => {
    const res = validateCellHighlight(f, rowIndex, field);
    return {
      highlight: res.highlight,
      // normalize to expected string values for downstream checks
      severity: (res.severity as "error" | "warning" | null) ?? null,
    };
  };

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

  // Toasts intentionally disabled but calls retained
  const showToast = (
    _type: "error" | "warning" | "success" | "info",
    _message: string
  ) => {};

  const updateCorrectiveActionsForDataLog = (
    rowIndex: number,
    stage: string,
    dataLog: boolean
  ) => {
    if (dataLog && form) {
      // When data log is checked, add it to the corrective actions section
      const stageNames: Record<string, string> = {
        'ccp1': 'CCP1',
        'ccp2': 'CCP2', 
        'coolingTo80': 'Cooling to 80°F',
        'coolingTo54': 'Cooling to 54°F',
        'finalChill': 'Final Chill'
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

  // Main change handler (validation/comments side-effects)
  const handleCellChange = async (
    rowIndex: number,
    field: string,
    value: string | boolean | Date
  ) => {
    console.log('handleCellChange called:', { rowIndex, field, value, form: !!form, readOnly });
    
    if (!form) return;

    if (readOnly) return;

    // Convert date strings to Date objects for date fields
    let processedValue: string | boolean | Date = value;
    if (typeof value === 'string' && field.includes('.date') && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
      processedValue = new Date(value);
      console.log('Converted date string to Date object:', processedValue);
    }

    // Update store
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
            [subField]: processedValue,
          },
        };
      } else {
        updatedEntries[rowIndex] = {
          ...updatedEntries[rowIndex],
          [field]: processedValue,
        };
      }
      try {
        await updateAdminForm(form.id, { entries: updatedEntries });
        if (onFormUpdate) onFormUpdate(form.id, { entries: updatedEntries });
      } catch (error) {
        console.error('Failed to save admin changes:', error);
      }
    } else {
      try {
        updateEntry(rowIndex, field, processedValue);
      } catch (error) {
        console.error("❌ Error calling updateEntry:", error);
      }
    }

    // Side-effects for temperature/time validations & corrective comments
    try {
      const stageMatch =
        typeof field === "string"
          ? field.match(/^([^.]+)\.(temp|time|initial|dataLog)$/)
          : null;
      if (!stageMatch) return;

      // Support only finalChill.date changes — create a simple comment
      const dateMatch = typeof field === 'string' ? field.match(/^finalChill\.date$/) : null;
      if (dateMatch) {
        const stage = 'finalChill' as StageKey;
        const rowNumber = rowIndex + 1;
        const existingComments = form?.correctiveActionsComments || "";
        const dateStr = typeof value === 'string' ? value : String(value ?? '');
        if (dateStr) {
          const comment = `Row ${rowNumber} ${stage} date set — ${dateStr}`;
          if (!existingComments.includes(comment)) {
            const updatedComments = existingComments ? `${existingComments}\n${comment}` : comment;
            setCorrectiveText(formatNumberedTextFromRaw(updatedComments));
            if (isAdminForm) {
              updateAdminForm(form.id, { correctiveActionsComments: updatedComments });
              if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: updatedComments });
            } else {
              updateFormField(form.id, 'correctiveActionsComments', updatedComments);
            }
          }
        } else {
          const prefix = `Row ${rowNumber} ${stage} date set`;
          if (existingComments.includes(prefix)) {
            const cleaned = existingComments.split('\n').filter(c => !c.startsWith(prefix)).join('\n');
            setCorrectiveText(formatNumberedTextFromRaw(cleaned));
            if (isAdminForm) {
              updateAdminForm(form.id, { correctiveActionsComments: cleaned });
              if (onFormUpdate) onFormUpdate(form.id, { correctiveActionsComments: cleaned });
            } else {
              updateFormField(form.id, 'correctiveActionsComments', cleaned);
            }
          }
        }

        // commit the date field to the store
        commitField(rowIndex, `finalChill.date`, value);
        return;
      }

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
          ccp1: "CCP1",
          ccp2: "CCP2",
          coolingTo80: "80°F Cooling",
          coolingTo54: "54°F Cooling",
          finalChill: "Final Chill",
        };

        if (tempNum !== null && !isNaN(tempNum)) {
          const validation = validateTemperatureCell(
            String(tempNum),
            stage as any
          );
          if (!validation.isValid && validation.error) {
            // concise single-line comment
            const commentPrefix = `Row ${rowNumber} ${stageLabel[stage]}`;
            const targetComment = `${commentPrefix} ${tempNum}°F — ${validation.error.replace(/Temperature \d+°F is below minimum required (\d+)°F/, 'below $1°F')}`;
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
              if (stage === "ccp1" || stage === "ccp2") {
                showToast("error", validation.error);
              }
            }
          } else {
            // Remove any existing violation comment for this row/stage using a consistent prefix
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
      if (fieldType === "time" && stage === "coolingTo80") {
        const newTime = typeof value === "string" ? value : String(value ?? "");
        const rowNumber = rowIndex + 1;
        const entry = form?.entries?.[rowIndex];
  const existingComments = form?.correctiveActionsComments || "";
  const commentPrefix = `Row ${rowNumber} 80°F`;

        if (newTime && entry?.ccp2?.time) {
          const diff = getTimeDifferenceMinutes(entry.ccp2.time, newTime);
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
              showToast("error", "Time limit exceeded for 80°F Cooling");
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

            // Time-specific: 54°F Cooling window (from CCP2 time)
            if (fieldType === "time" && String(stage) === "coolingTo54") {
              const newTime = typeof value === "string" ? value : String(value ?? "");
              const rowNumber = rowIndex + 1;
              const entry = form?.entries?.[rowIndex];
              const existingComments = form?.correctiveActionsComments || "";
              const commentPrefix = `Row ${rowNumber} 54°F`;

              if (newTime && entry?.ccp2?.time) {
                const diff = getTimeDifferenceMinutes(entry.ccp2.time, newTime);
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
                    showToast("error", "Time limit exceeded for 54°F Cooling");
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
              } else if (newTime && !entry?.ccp2?.time) {
                const targetComment = `Row ${rowNumber} 54°F time set — missing CCP2 time`;
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
                  showToast("error", "Missing CCP2 reference time for 54°F Cooling");
                }
              }
            }
  } else if (newTime && !entry?.ccp2?.time) {
          // concise missing reference comment
          const targetComment = `Row ${rowNumber} 80°F time set — missing CCP2 time`;
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
            showToast("error", "Missing CCP2 reference time for 80°F Cooling");
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
      }
    } catch (err) {
      console.error(
        "Error processing temperature/time corrective action logic",
        err
      );
    }

    // If this change completed a stage (temp+time+initial) for non-admin forms,
    // auto-save so the locked state is persisted. We don't await to avoid
    // blocking the UI; just log errors if saving fails.
    try {
      const stageMatch2 =
        typeof field === "string"
          ? field.match(/^([^.]+)\.(temp|time|initial)$/)
          : null;
      if (stageMatch2 && !isAdminForm && !readOnly && form) {
        const stage = stageMatch2[1] as StageKey;
        const entry = form.entries?.[rowIndex] as any;
        const sd = entry?.[stage];
        const nowLocked = sd && (sd.temp || sd.temp === 0) && sd.time && sd.initial;
        if (nowLocked) {
          // Fire-and-forget save
          saveForm().catch((err) => console.error('Error auto-saving form after stage complete:', err));
        }
      }
    } catch (err) {
      console.error('Error during auto-save-on-stage-complete check:', err);
    }

    // After side-effects, ensure form status reflects validation state.
    try {
      const validation = validateForm(form);
      const hasErrors = validation.errors.some((e: any) => e.severity === "error");

      // Do not change a completed form
      if (form.status !== "Complete") {
        if (hasErrors && form.status !== "Error") {
          // Move to Error state
          if (isAdminForm) {
            await updateAdminForm(form.id, { status: "Error" });
            if (onFormUpdate) onFormUpdate(form.id, { status: "Error" });
          } else {
            updateFormStatus(form.id, "Error");
            updateFormField(form.id, "status", "Error");
            // Persist immediate change
            saveForm();
          }
        } else if (!hasErrors && form.status === "Error") {
          // Clear Error state back to In Progress
          if (isAdminForm) {
            await updateAdminForm(form.id, { status: "In Progress" });
            if (onFormUpdate) onFormUpdate(form.id, { status: "In Progress" });
          } else {
            updateFormStatus(form.id, "In Progress");
            updateFormField(form.id, "status", "In Progress");
            saveForm();
          }
        }
      }
    } catch (err) {
      console.error("Error updating form status based on validation", err);
    }
  };

  // Validation-driven cell styles
  const getCellClasses = (rowIndex: number, field: string, base: string) => {
    if (!form) return base;
    const ms = field.match(/^([^.]+)\.(temp|time|initial)$/);
    if (!ms) return base;

    const stageName = ms[1] as StageKey;
    const fieldType = ms[2];

    const currentEntry = form.entries[rowIndex];
    const stageData = currentEntry[stageName] as any;
    // Always apply highlight if validation flags this cell
    const v = shouldHighlightCell(form, rowIndex, field);
    if (v.highlight) {
      if (v.severity === "error")
        return `${base} bg-red-200 border-2 border-red-500 shadow-sm`;
      if (v.severity === "warning")
        return `${base} bg-yellow-200 border-2 border-yellow-500 shadow-sm`;
    }

    // Otherwise, keep default
    return base;
  };

  // Guard: no form yet
  if (!form) return null;

  return (
    <div className="p-6 bg-white rounded-xl border-2 border-gray-200 max-w-7xl mx-auto">
        {/* Form Header */}
      <div className="mb-6">
        <div className="border-2 border-black mb-4">
          <div className="bg-gray-100 p-4 text-center">
            <h1 className="text-xl font-bold">
              Cooking and Cooling for Meat &amp; Non Meat Ingredients
            </h1>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <span className="font-semibold">Title: </span>
                <input
                  key={`title-${form?.id || "new"}`}
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={(e) => {
                    const newValue = e.target.value;
                    if (!readOnly) {
                      if (isAdminForm) {
                        updateAdminForm(form.id, { title: newValue });
                        if (onFormUpdate)
                          onFormUpdate(form.id, { title: newValue });
                      } else {
                        updateFormField(form.id, "title", newValue);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  placeholder="Enter form title (e.g., 'Piroshki')"
                  className="border-b-2 border-gray-300 bg-transparent w-full px-2 py-1 transition-all duration-200 ease-in-out focus:border-blue-500 focus:outline-none hover:border-gray-400"
                  readOnly={readOnly}
                />
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold">Date: </span>
                  <DatePicker
                    value={form?.date ? ensureDate(form.date).toISOString().split('T')[0] : ''}
                    onChange={(dateValue) => {
                      if (readOnly) return;
                      // Parse date string properly to avoid timezone issues
                      const dateVal = dateValue ? (() => {
                        const [year, month, day] = dateValue.split('-').map(Number);
                        return new Date(year, month - 1, day);
                      })() : null;
                      if (isAdminForm) {
                        updateAdminForm(form.id, { date: dateVal });
                        if (onFormUpdate) onFormUpdate(form.id, { date: dateVal });
                      } else {
                        updateFormField(form.id, 'date', dateVal as any);
                      }
                    }}
                    className="border-b-2 border-gray-300 bg-transparent px-2 py-1 w-full"
                    disabled={readOnly}
                    compact={true}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border-2 border-black overflow-x-auto">
        <table className="w-full mx-auto min-w-[760px] md:min-w-[900px] max-w-[1200px] border-collapse text-sm md:text-base">
          {/* Header Row 1 */}
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-2 w-16">Rack</th>
              <th className="border border-black p-2 w-16">Type</th>
              <th className="border border-black p-2 w-32">
                Temperature Must reach 166°F or greater
                <br />
                <strong>CCP 1</strong>
              </th>
              <th className="border border-black p-2 w-32">
                127°F or greater
                <br />
                <strong>CCP 2</strong>
                <br />
                <small>
                  Record Temperature of 1st and LAST rack/batch of the day
                </small>
              </th>
              <th className="border border-black p-2 w-32">
                80°F or below within 105 minutes
                <br />
                <strong>CCP 2</strong>
                <br />
                <small>Record Temperature of 1st rack/batch of the day</small>
                <br />
                <small>Time: from CCP2 (127°F)</small>
              </th>
              <th className="border border-black p-2 w-32">
                <strong>54</strong> or below within 4.75 hr
                <br />
                <small>Time: from CCP2 (127°F)</small>
              </th>
              <th className="border border-black p-2 w-40">
                Chill Continuously to
                <br />
                39°F or below
                <br />
                {/* header-level date removed - using per-row finalChill date only */}
              </th>
            </tr>

            {/* Header Row 2 */}
            <tr className="bg-gray-50">
              {Array.from({ length: 2 }).map((_, i) => (
                <th key={`h1-${i}`} className="border border-black p-1 text-sm">
                  {i === 0 ? "Rack" : "Type"}
                </th>
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={`h2-${i}`} className="border border-black p-1">
                  <div
                    className="text-xs"
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1.618fr 0.618fr', gap: '0.25rem' }}
                  >
                    <div className="text-center">Temp</div>
                    <div className="text-center">Time</div>
                    <div className="text-center">Initial</div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Data Rows */}
          <tbody>
            {memoizedEntries.map((entry: any, rowIndex: number) => (
              <tr
                key={rowIndex}
                className={rowIndex === 5 ? "border-t-4 border-black" : ""}
              >
                {/* Rack */}
                <td className="border border-black p-1 text-center">
                  <select
                    value={entry.rack ?? ""}
                    onChange={async (e) =>
                      await handleCellChange(rowIndex, "rack", e.target.value)
                    }
                    className="w-full text-xs border-0 bg-transparent text-center cursor-pointer"
                    disabled={readOnly}
                  >
                    <option value="">--</option>
                    <option value="1st Rack">1st Rack</option>
                    <option value="Last Rack">Last Rack</option>
                  </select>
                </td>

                {/* Type (with row number display) */}
                <td className="border border-black p-1 text-center">
                  <div className="flex items-center justify-center space-x-1">
                    <span className="font-bold text-sm">{rowIndex + 1}.</span>
                    {/* Replace TextCell with your component import */}
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-type`}
                      valueFromStore={entry.type || ""}
                      readOnly={readOnly}
                      commitField={(value: string) =>
                        commitField(
                          rowIndex,
                          "type",
                          value.charAt(0).toUpperCase() +
                            value.slice(1).toLowerCase()
                        )
                      }
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Type"
                    />
                  </div>
                </td>

                {/* CCP1 */}
                <td
                  className={`border border-black p-1 ${
                    entry.ccp1?.dataLog ? "bg-blue-100" : ""
                  }`}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.618fr 0.618fr', gap: '0.25rem' }} className="items-center">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp1.temp`}
                      valueFromStore={entry.ccp1?.temp || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp1')}
                      commitField={(value: string) => {
                        commitField(rowIndex, "ccp1.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(rowIndex, "ccp1.temp", value)
                      }
                      className={getCellClasses(
                        rowIndex,
                        "ccp1.temp",
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
                      value={entry.ccp1?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(rowIndex, "ccp1.time", time)
                      }
                      placeholder="Time"
                      disabled={readOnly || isStageLocked(rowIndex, 'ccp1')}
                      className={getCellClasses(rowIndex, "ccp1.time", "w-full")}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.ccp1?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        if (!form) return;
                        const updatedEntries = [...form.entries];
                        updatedEntries[rowIndex] = {
                          ...updatedEntries[rowIndex],
                          ccp1: { ...updatedEntries[rowIndex].ccp1, dataLog },
                        };
                        if (isAdminForm) {
                          await updateAdminForm(form.id, { entries: updatedEntries });
                        } else {
                          updateFormField(form.id, "entries", updatedEntries);
                        }
                        updateCorrectiveActionsForDataLog(
                          rowIndex,
                          "ccp1",
                          dataLog
                        );
                        await handleCellChange(rowIndex, "ccp1.dataLog", dataLog);
                        if (!readOnly) saveForm();
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp1.initial`}
                      valueFromStore={entry.ccp1?.initial || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp1')}
                      commitField={(value: string) =>
                        commitField(
                          rowIndex,
                          "ccp1.initial",
                          value.toUpperCase()
                        )
                      }
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* CCP2 */}
                <td
                  className={`border border-black p-1 ${
                    entry.ccp2?.dataLog ? "bg-blue-100" : ""
                  }`}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.618fr 0.618fr', gap: '0.25rem' }} className="items-center">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2.temp`}
                      valueFromStore={entry.ccp2?.temp || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp2')}
                      commitField={(value: string) =>
                        commitField(rowIndex, "ccp2.temp", value)
                      }
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(rowIndex, "ccp2.temp", value)
                      }
                      shouldHighlightWhileTyping={(next: string) => {
                        const parsed = parseFloat(
                          String(next).replace(/[^\d.-]/g, "")
                        );
                        if (isNaN(parsed)) return false;
                        return parsed < 127;
                      }}
                      className={getCellClasses(
                        rowIndex,
                        "ccp2.temp",
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
                      value={entry.ccp2?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(rowIndex, "ccp2.time", time)
                      }
                      placeholder="Time"
                      disabled={readOnly || isStageLocked(rowIndex, 'ccp2')}
                      className={getCellClasses(rowIndex, "ccp2.time", "w-full")}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.ccp2?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        if (!form) return;
                        const updatedEntries = [...form.entries];
                        updatedEntries[rowIndex] = {
                          ...updatedEntries[rowIndex],
                          ccp2: { ...updatedEntries[rowIndex].ccp2, dataLog },
                        };
                        if (isAdminForm) {
                          await updateAdminForm(form.id, { entries: updatedEntries });
                        } else {
                          updateFormField(form.id, "entries", updatedEntries);
                        }
                        updateCorrectiveActionsForDataLog(
                          rowIndex,
                          "ccp2",
                          dataLog
                        );
                        await handleCellChange(rowIndex, "ccp2.dataLog", dataLog);
                        if (!readOnly) saveForm();
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-ccp2.initial`}
                      valueFromStore={entry.ccp2?.initial || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'ccp2')}
                      commitField={(value: string) =>
                        commitField(
                          rowIndex,
                          "ccp2.initial",
                          value.toUpperCase()
                        )
                      }
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* 80°F Cooling */}
                <td
                  className={`border border-black p-1 ${
                    entry.coolingTo80?.dataLog ? "bg-blue-100" : ""
                  }`}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.618fr 0.618fr', gap: '0.25rem' }} className="items-center">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-coolingTo80.temp`}
                      valueFromStore={entry.coolingTo80?.temp || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'coolingTo80')}
                      commitField={(value: string) =>
                        commitField(rowIndex, "coolingTo80.temp", value)
                      }
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(rowIndex, "coolingTo80.temp", value)
                      }
                      shouldHighlightWhileTyping={(next: string) => {
                        const parsed = parseFloat(
                          String(next).replace(/[^\d.-]/g, "")
                        );
                        return !isNaN(parsed) && parsed > 80;
                      }}
                      className={getCellClasses(
                        rowIndex,
                        "coolingTo80.temp",
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
                      value={entry.coolingTo80?.time}
                      onChange={(time: string) =>
                        handleCellChange(rowIndex, "coolingTo80.time", time)
                      }
                      placeholder="Time"
                      disabled={readOnly || isStageLocked(rowIndex, 'coolingTo80')}
                      className={getCellClasses(rowIndex, "coolingTo80.time", "w-full")}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.coolingTo80?.dataLog || false}
                      onDataLogChange={(dataLog: boolean) => {
                        if (!form) return;
                        const updatedEntries = [...form.entries];
                        updatedEntries[rowIndex] = {
                          ...updatedEntries[rowIndex],
                          coolingTo80: {
                            ...updatedEntries[rowIndex].coolingTo80,
                            dataLog,
                          },
                        };
                        if (isAdminForm) {
                          updateAdminForm(form.id, { entries: updatedEntries });
                        } else {
                          updateFormField(form.id, "entries", updatedEntries);
                        }
                        updateCorrectiveActionsForDataLog(
                          rowIndex,
                          "coolingTo80",
                          dataLog
                        );
                        handleCellChange(
                          rowIndex,
                          "coolingTo80.dataLog",
                          dataLog
                        );
                        if (!readOnly) saveForm();
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-coolingTo80.initial`}
                      valueFromStore={entry.coolingTo80?.initial || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'coolingTo80')}
                      commitField={(value: string) =>
                        commitField(
                          rowIndex,
                          "coolingTo80.initial",
                          value.toUpperCase()
                        )
                      }
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* 54°F Cooling */}
                <td
                  className={`border border-black p-1 ${
                    entry.coolingTo54?.dataLog ? "bg-blue-100" : ""
                  }`}
                >
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-coolingTo54.temp`}
                      valueFromStore={entry.coolingTo54?.temp || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'coolingTo54')}
                      commitField={(value: string) => {
                        commitField(rowIndex, "coolingTo54.temp", value);
                      }}
                      onBlurValidate={(value: string) =>
                        handleCellChange(rowIndex, "coolingTo54.temp", value)
                      }
                      className={getCellClasses(
                        rowIndex,
                        "coolingTo54.temp",
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
                      value={entry.coolingTo54?.time}
                      onChange={(time: string) =>
                        handleCellChange(rowIndex, "coolingTo54.time", time)
                      }
                      placeholder="Time"
                      disabled={readOnly || isStageLocked(rowIndex, 'coolingTo54')}
                      className={getCellClasses(rowIndex, "coolingTo54.time", "w-full")}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.coolingTo54?.dataLog || false}
                      onDataLogChange={(dataLog: boolean) => {
                        if (!form) return;
                        const updatedEntries = [...form.entries];
                        updatedEntries[rowIndex] = {
                          ...updatedEntries[rowIndex],
                          coolingTo54: {
                            ...updatedEntries[rowIndex].coolingTo54,
                            dataLog,
                          },
                        };
                        if (isAdminForm) {
                          updateAdminForm(form.id, { entries: updatedEntries });
                        } else {
                          updateFormField(form.id, "entries", updatedEntries);
                        }
                        updateCorrectiveActionsForDataLog(
                          rowIndex,
                          "coolingTo54",
                          dataLog
                        );
                        handleCellChange(
                          rowIndex,
                          "coolingTo54.dataLog",
                          dataLog
                        );
                        if (!readOnly) saveForm();
                      }}
                    />
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-coolingTo54.initial`}
                      valueFromStore={entry.coolingTo54?.initial || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'coolingTo54')}
                      commitField={(value: string) =>
                        commitField(
                          rowIndex,
                          "coolingTo54.initial",
                          value.toUpperCase()
                        )
                      }
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </div>
                </td>

                {/* Final Chill */}
                <td
                  className={`border border-black p-1 ${
                    entry.finalChill?.dataLog ? "bg-blue-100" : ""
                  }`}
                >
                  <div className="grid grid-cols-3 gap-1">
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-finalChill.temp`}
                      valueFromStore={entry.finalChill?.temp || ""}
                      readOnly={readOnly || isStageLocked(rowIndex, 'finalChill')}
                      commitField={(value: string) => {
                        commitField(rowIndex, "finalChill.temp", value);
                      }}
                      onBlurValidate={(value: string) =>
                        handleCellChange(rowIndex, "finalChill.temp", value)
                      }
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-150 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      placeholder="°F"
                      type="number"
                      step="0.1"
                      min="0"
                      max="300"
                      inputMode="decimal"
                    />
                    <div className="flex flex-col items-center">
                      <div className="flex flex-col items-center w-full">
                        <div className="flex flex-col items-center">
                          <DatePicker
                            value={(() => {
                              const dateValue = entry.finalChill?.date ? ensureDate(entry.finalChill?.date).toISOString().split('T')[0] : '';
                              console.log('DatePicker value calculation:', { 
                                rowIndex,
                                finalChillDate: entry.finalChill?.date,
                                dateValue,
                                finalChillData: entry.finalChill
                              });
                              return dateValue;
                            })()}
                            onChange={(dateValue) => {
                              console.log('DatePicker onChange called with:', dateValue);
                              handleCellChange(rowIndex, 'finalChill.date', dateValue);
                            }}
                            className="w-24 md:w-28 text-xs md:text-sm border border-gray-300 bg-white text-center mb-1 rounded"
                            disabled={(() => {
                              console.log('DatePicker disabled check:', { readOnly, rowIndex });
                              return readOnly;
                            })()}
                            compact={true}
                          />

                        <TimePicker
                          value={entry.finalChill?.time}
                          onChange={(time: string) =>
                            handleCellChange(rowIndex, "finalChill.time", time)
                          }
                          placeholder="Time"
                          disabled={readOnly || isStageLocked(rowIndex, 'finalChill')}
                          className={getCellClasses(rowIndex, "finalChill.time", "w-20 md:w-24 mx-auto")}
                          showQuickTimes={false}
                          compact
                          dataLog={entry.finalChill?.dataLog || false}
                          onDataLogChange={(dataLog: boolean) => {
                            if (!form) return;
                            const updatedEntries = [...form.entries];
                            updatedEntries[rowIndex] = {
                              ...updatedEntries[rowIndex],
                              finalChill: {
                                ...updatedEntries[rowIndex].finalChill,
                                dataLog,
                              },
                            };
                            if (isAdminForm) {
                              updateAdminForm(form.id, { entries: updatedEntries });
                            } else {
                              updateFormField(form.id, "entries", updatedEntries);
                            }
                            updateCorrectiveActionsForDataLog(
                              rowIndex,
                              "finalChill",
                              dataLog
                            );
                            handleCellChange(
                              rowIndex,
                              "finalChill.dataLog",
                              dataLog
                            );
                            if (!readOnly) saveForm();
                          }}
                        />
                        </div>
                      </div>
                    </div>
                    <TextCell
                      formId={form.id}
                      field={`${rowIndex}-finalChill.initial`}
                      valueFromStore={entry.finalChill?.initial || ""}
                      readOnly={readOnly}
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

      {/* Bottom Section */}
      <div className="border-2 border-black border-t-0">
        <div className="grid grid-cols-2 gap-0">
          {/* Left side */}
          <div className="border-r border-black">
            {/* Thermometer # */}
            <div className="border-b border-black p-2 text-center">
              <span className="font-semibold">Thermometer #</span>
              <input
                type="text"
                value={form.thermometerNumber || ""}
                onChange={(e) => {
                  if (form) (form as any).thermometerNumber = e.target.value;
                }}
                onBlur={(e) => {
                  const newValue = e.target.value;
                  if (!readOnly) {
                    if (isAdminForm) {
                      updateAdminForm(form.id, { thermometerNumber: newValue });
                      if (onFormUpdate)
                        onFormUpdate(form.id, { thermometerNumber: newValue });
                    } else {
                      updateFormField(form.id, "thermometerNumber", newValue);
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    (e.currentTarget as HTMLInputElement).blur();
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
                  {ingredientCols.map((col, i) => (
                    <th key={`ing-h-${i}`} className="border border-black p-2 bg-gray-100">
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => {
                          const next = [...ingredientCols];
                          next[i] = { ...next[i], label: e.target.value };
                          setIngredientCols(next);
                        }}
                        onBlur={(e) => {
                          const next = [...ingredientCols];
                          const newLabel = e.target.value;
                          const newKey = slugForLabel(newLabel, i + 1);
                          next[i] = { key: newKey, label: newLabel };
                          setIngredientCols(next);
                          // persist to form
                          if (!form) return;
                          const payload = { ingredientColumns: next };
                          if (isAdminForm) {
                            updateAdminForm(form.id, payload as any);
                            if (onFormUpdate) onFormUpdate(form.id, payload);
                          } else {
                            updateFormField(form.id, "ingredientColumns", next);
                          }
                        }}
                        className={`w-full text-sm border-0 bg-transparent text-center placeholder-gray-400 ${!col.label ? 'text-gray-400' : 'text-gray-900'}`}
                        readOnly={readOnly}
                        placeholder={`Ingredient ${i + 1}`}
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2 font-semibold">Lot #(s)</td>
                  {ingredientCols.map((col, i) => {
                    const key = col.key || slugForLabel(col.label, i + 1);
                    // Read value from ingredientColumns-backed lotNumbers first,
                    // then fall back to legacy form.lotNumbers keys.
                    const legacyVal = form.lotNumbers ? form.lotNumbers[key] : undefined;
                    const legacyFallback = (() => {
                      // handle legacy known keys
                      const map: Record<string, string> = {
                        beef: form.lotNumbers?.beef,
                        chicken: form.lotNumbers?.chicken,
                        liquidEggs: form.lotNumbers?.liquidEggs,
                      };
                      return map[key];
                    })();
                    const value = (form.lotNumbers && Object.prototype.hasOwnProperty.call(form.lotNumbers, key))
                      ? legacyVal
                      : (legacyFallback ?? "");

                    return (
                      <td key={`lot-${i}`} className="border border-black p-1">
                        <input
                          type="text"
                          value={value || ""}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            if (!form) return;
                            // keep controlled
                            const updatedLotNumbers = { ...(form.lotNumbers || {}) };
                            updatedLotNumbers[key] = newValue;
                            if (isAdminForm) {
                              updateAdminForm(form.id, { lotNumbers: updatedLotNumbers });
                              if (onFormUpdate) onFormUpdate(form.id, { lotNumbers: updatedLotNumbers });
                            } else {
                              updateFormField(form.id, "lotNumbers", updatedLotNumbers);
                            }
                          }}
                          onBlur={(e) => {
                            const newValue = e.target.value;
                            if (!readOnly) {
                              const updatedLotNumbers = { ...(form.lotNumbers || {}) };
                              updatedLotNumbers[key] = newValue;
                              if (isAdminForm) {
                                updateAdminForm(form.id, { lotNumbers: updatedLotNumbers });
                                if (onFormUpdate) onFormUpdate(form.id, { lotNumbers: updatedLotNumbers });
                              } else {
                                updateFormField(form.id, "lotNumbers", updatedLotNumbers);
                              }
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.currentTarget as HTMLInputElement).blur();
                          }}
                          className={`w-full border-0 bg-transparent text-sm ${!value ? 'text-gray-400' : 'text-gray-900'}`}
                          readOnly={readOnly}
                        />
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Right side - Corrective Actions */}
          <div className="p-4 relative">
            <div className="mb-2">
              <h3 className="font-semibold">
                Corrective Actions &amp; comments:
              </h3>
            </div>
            <textarea
              value={correctiveText}
              onChange={(e) => setCorrectiveText(e.target.value)}
              onBlur={(e) => {
                const displayed = e.target.value;
                const raw = stripNumberingToRaw(displayed);
                if (!readOnly) {
                  if (isAdminForm) {
                    updateAdminForm(form.id, {
                      correctiveActionsComments: raw,
                    });
                    if (onFormUpdate)
                      onFormUpdate(form.id, { correctiveActionsComments: raw });
                  } else {
                    updateFormField(form.id, "correctiveActionsComments", raw);
                  }
                }
                setCorrectiveText(formatNumberedTextFromRaw(raw));
              }}
              className="w-full h-32 border border-gray-300 p-2 text-sm resize-none"
              placeholder="Enter any corrective actions taken or additional comments..."
              readOnly={readOnly}
            />
          </div>
        </div>
      </div>

      {/* Complete Button */}
      {!readOnly && form.status !== "Complete" && (
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              const validation = validateForm(form);
              const hasErrors = validation.errors.some(
                (e: any) => e.severity === "error"
              );
              if (hasErrors) {
                console.log(
                  "Validation errors found, cannot complete form:",
                  validation.errors
                );
                showToast(
                  "error",
                  `Cannot complete form: ${
                    validation.errors.filter((e: any) => e.severity === "error")
                      .length
                  } validation errors found. Please fix these issues before completing the form.`
                );
                return;
              }
              if (onFormUpdate) onFormUpdate(form.id, { status: "Complete" });
              if (isAdminForm) {
                await updateAdminForm(form.id, { status: "Complete" });
              } else {
                updateFormStatus(form.id, "Complete");
                updateFormField(form.id, "status", "Complete");
                saveForm();
              }
              showToast("success", "Form completed successfully!");
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

      {/* Completion Notice */}
      {form.status === "Complete" && (
        <div className="mt-6 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg text-center">
          <div className="flex items-center justify-center space-x-2 text-gray-800">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-lg font-semibold">
              Form Completed Successfully!
            </span>
          </div>
          <p className="text-gray-700 mt-1">
            This form has been finalized and can no longer be edited
          </p>
        </div>
      )}

  {/* Validation summary removed per request */}
    </div>
  );
}

