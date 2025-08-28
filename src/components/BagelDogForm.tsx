'use client';

import React, { useState, useEffect } from 'react';
import { PaperFormEntry, BaseFormRow, FormType, BagelDogFormEntry } from '../lib/paperFormTypes';
import { shouldHighlightTemperature, validateTemperatureCell, getTimeDifferenceMinutes } from '../lib/validation';
import { useLogStore } from '../stores/logStore';
import { usePinStore } from '../stores/pinStore';
import { usePaperFormStore } from '../stores/paperFormStore';
import { validateForm } from '../lib/validation';
import { ensureDate } from '../lib/paperFormTypes';
import { format } from 'date-fns';
import { 
  ClockIcon, 
  ExclamationTriangleIcon, 
  CheckCircleIcon,
  XCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { TextCell } from './TextCell';
import { TimePicker } from './TimePicker';

interface BagelDogFormProps {
  formData: PaperFormEntry;
  readOnly: boolean;
  onFormUpdate: (formId: string, updates: any) => void;
}

type StageKey = "ccp1" | "ccp2" | "coolingTo80" | "coolingTo54" | "finalChill";

export default function BagelDogForm({ formData, readOnly, onFormUpdate }: BagelDogFormProps) {
  const { deleteForm, updateFormField, updateFormStatus, saveForm } = usePaperFormStore();
  const { isAuthenticated } = usePinStore();
  const [localForm, setLocalForm] = useState<BagelDogFormEntry>(formData as BagelDogFormEntry);
  const [errors, setErrors] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(!readOnly);
  const [correctiveText, setCorrectiveText] = useState("");

  // Debug logging
  console.log('BagelDogForm render:', { formData, readOnly, isEditing, localForm: !!localForm });

  useEffect(() => {
    setLocalForm(formData as BagelDogFormEntry);
  }, [formData]);

  useEffect(() => {
    setCorrectiveText(formData.correctiveActionsComments || "");
  }, [formData.correctiveActionsComments]);

  useEffect(() => {
    const validationResult = validateForm(localForm);
    const errorMessages = validationResult.errors
      .filter(error => error.severity === 'error')
      .map(error => `Row ${error.rowIndex + 1}: ${error.message}`);
    setErrors(errorMessages);
  }, [localForm]);

  const handleInputChange = (field: keyof BagelDogFormEntry, value: any) => {
    const updated = { ...localForm, [field]: value };
    setLocalForm(updated);
    onFormUpdate(localForm.id, { [field]: value });
  };

  const handleRowChange = (rowIndex: number, field: keyof BaseFormRow, value: any) => {
    const updated = { ...localForm };
    if (!updated.entries[rowIndex]) {
      updated.entries[rowIndex] = { ...updated.entries[0] };
    }
    
    if (field === 'rack' || field === 'type') {
      updated.entries[rowIndex][field] = value;
    } else {
      // Handle nested CCP fields
      const row = updated.entries[rowIndex];
      if (field === 'ccp1' || field === 'ccp2' || field === 'coolingTo80' || field === 'coolingTo54' || field === 'finalChill') {
        if (!row[field]) {
          row[field] = { temp: '', time: '', initial: '', dataLog: false };
        }
        if (typeof value === 'object') {
          row[field] = { ...row[field], ...value };
        } else {
          // Handle individual field updates
          const fieldName = Object.keys(value)[0];
          const fieldValue = Object.values(value)[0];
          row[field] = { ...row[field], [fieldName]: fieldValue };
        }
      }
    }
    
    setLocalForm(updated);
    onFormUpdate(localForm.id, { entries: updated.entries });
  };

  const handleSave = () => {
    if (errors.length === 0) {
      onFormUpdate(localForm.id, { ...localForm });
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this form?')) {
      deleteForm(formData.id);
      onFormUpdate(formData.id, { deleted: true });
    }
  };

  const getStatusIcon = () => {
    if (errors.length > 0) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
    }
    if (localForm.status === 'Complete') {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    }
    return <ClockIcon className="h-5 w-5 text-blue-500" />;
  };

  const getStatusColor = () => {
    if (errors.length > 0) return 'text-red-600';
    if (localForm.status === 'Complete') return 'text-green-600';
    return 'text-blue-600';
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      const [hours, minutes] = time.split(':');
      return `${hours}:${minutes}`;
    } catch {
      return time;
    }
  };

  const getRowLabel = (index: number) => {
    if (index === 0) return '1st Rack';
    if (index === 1) return '2nd Rack';
    if (index >= 2 && index <= 6) return 'Final Rack';
    return `${index + 1}`;
  };

  const isSpecialRow = (index: number) => {
    return index === 0 || index === 1 || (index >= 2 && index <= 6);
  };

  const getRowType = (index: number) => {
    if (index === 0 || index === 1) return 'Rack # & Cooking Flavor';
    if (index >= 2 && index <= 6) return 'Final Rack';
    return '';
  };

  // Helper functions for advanced functionality
  const formatNumberedTextFromRaw = (rawText: string): string => {
    if (!rawText) return '';
    const lines = rawText.split('\n').filter(line => line.trim());
    return lines.map((line, index) => `${index + 1}. ${line}`).join('\n');
  };

  const stripNumberingToRaw = (numberedText: string): string => {
    if (!numberedText) return '';
    return numberedText
      .split('\n')
      .map(line => line.replace(/^\d+\.\s*/, ''))
      .filter(line => line.trim())
      .join('\n');
  };

  const isStageLocked = (rowIndex: number, stage: StageKey): boolean => {
    const entry = localForm.entries[rowIndex];
    if (!entry) return false;
    
    const stageData = entry[stage];
    return !!(stageData?.temp && stageData?.time && stageData?.initial);
  };

  const getCellClasses = (rowIndex: number, field: string, baseClasses: string): string => {
    const entry = localForm.entries[rowIndex];
    if (!entry) return baseClasses;
    
    const [stage, fieldName] = field.split('.');
    const stageData = entry[stage as StageKey];
    
    if (!stageData) return baseClasses;
    
    let highlightClass = '';
    if (fieldName === 'temp') {
      if (stage === 'ccp1' && stageData.temp && parseFloat(stageData.temp) < 166) {
        highlightClass = 'bg-red-100 border-red-300';
      } else if (stage === 'ccp2' && stageData.temp && parseFloat(stageData.temp) < 127) {
        highlightClass = 'bg-red-100 border-red-300';
      } else if (stage === 'coolingTo80' && stageData.temp && parseFloat(stageData.temp) > 80) {
        highlightClass = 'bg-red-100 border-red-300';
      } else if (stage === 'coolingTo54' && stageData.temp && parseFloat(stageData.temp) > 54) {
        highlightClass = 'bg-red-100 border-red-300';
      } else if (stage === 'finalChill' && stageData.temp && parseFloat(stageData.temp) > 40) {
        highlightClass = 'bg-red-100 border-red-300';
      }
    }
    
    return `${baseClasses} ${highlightClass}`;
  };

  const shouldHighlightCell = (rowIndex: number, field: string): boolean => {
    const entry = localForm.entries[rowIndex];
    if (!entry) return false;
    
    const [stage, fieldName] = field.split('.');
    const stageData = entry[stage as StageKey];
    
    if (!stageData || fieldName !== 'temp') return false;
    
    if (stage === 'ccp1' && stageData.temp && parseFloat(stageData.temp) < 166) return true;
    if (stage === 'ccp2' && stageData.temp && parseFloat(stageData.temp) < 127) return true;
    if (stage === 'coolingTo80' && stageData.temp && parseFloat(stageData.temp) > 80) return true;
    if (stage === 'coolingTo54' && stageData.temp && parseFloat(stageData.temp) > 54) return true;
    if (stage === 'finalChill' && stageData.temp && parseFloat(stageData.temp) > 40) return true;
    
    return false;
  };

  const updateCorrectiveActionsForDataLog = (rowIndex: number, stage: StageKey, dataLog: boolean) => {
    if (!dataLog) return;
    
    const entry = localForm.entries[rowIndex];
    if (!entry) return;
    
    const stageData = entry[stage];
    if (!stageData) return;
    
    const currentText = localForm.correctiveActionsComments || '';
    const newComment = `Row ${rowIndex + 1} ${stage}: Data log completed at ${stageData.time}`;
    
    if (!currentText.includes(newComment)) {
      const updatedText = currentText ? `${currentText}\n${newComment}` : newComment;
      setCorrectiveText(formatNumberedTextFromRaw(updatedText));
      onFormUpdate(localForm.id, { correctiveActionsComments: updatedText });
    }
  };

  const commitField = (rowIndex: number, field: string, value: any) => {
    const updatedEntries = [...localForm.entries];
    if (!updatedEntries[rowIndex]) {
      updatedEntries[rowIndex] = { 
        rack: '',
        type: '',
        ccp1: { temp: '', time: '', initial: '', dataLog: false },
        ccp2: { temp: '', time: '', initial: '', dataLog: false },
        coolingTo80: { temp: '', time: '', initial: '', dataLog: false },
        coolingTo54: { temp: '', time: '', initial: '', dataLog: false },
        finalChill: { temp: '', time: '', initial: '', dataLog: false },
      };
    }
    
    const [stage, fieldName] = field.split('.');
    if (stage && fieldName) {
      if (!updatedEntries[rowIndex][stage as StageKey]) {
        updatedEntries[rowIndex][stage as StageKey] = { temp: '', time: '', initial: '', dataLog: false };
      }
      (updatedEntries[rowIndex][stage as StageKey] as any)[fieldName] = value;
    } else {
      (updatedEntries[rowIndex] as any)[field] = value;
    }
    
    setLocalForm({ ...localForm, entries: updatedEntries });
    onFormUpdate(localForm.id, { entries: updatedEntries });
  };

  const handleCellChange = async (rowIndex: number, field: string, value: string) => {
    const updatedEntries = [...localForm.entries];
    if (!updatedEntries[rowIndex]) {
      updatedEntries[rowIndex] = { 
        rack: '',
        type: '',
        ccp1: { temp: '', time: '', initial: '', dataLog: false },
        ccp2: { temp: '', time: '', initial: '', dataLog: false },
        coolingTo80: { temp: '', time: '', initial: '', dataLog: false },
        coolingTo54: { temp: '', time: '', initial: '', dataLog: false },
        finalChill: { temp: '', time: '', initial: '', dataLog: false },
      };
    }
    
    const [stage, fieldName] = field.split('.');
    if (stage && fieldName) {
      if (!updatedEntries[rowIndex][stage as StageKey]) {
        updatedEntries[rowIndex][stage as StageKey] = { temp: '', time: '', initial: '', dataLog: false };
      }
      
      const stageData = updatedEntries[rowIndex][stage as StageKey] as any;
      stageData[fieldName] = value;
      
      // Auto-save after each change
      onFormUpdate(localForm.id, { entries: updatedEntries });
      
      // Handle temperature and time validations
      if (fieldName === 'temp' && stageData.time) {
        const temp = parseFloat(value);
        const time = stageData.time;
        
        // Add violation comments to corrective actions
        let violationComment = '';
        if (stage === 'ccp1' && temp < 166) {
          violationComment = `Row ${rowIndex + 1} CCP1: Temperature ${temp}°F below required 166°F`;
        } else if (stage === 'ccp2' && temp < 127) {
          violationComment = `Row ${rowIndex + 1} CCP2: Temperature ${temp}°F below required 127°F`;
        } else if (stage === 'coolingTo80' && temp > 80) {
          violationComment = `Row ${rowIndex + 1} Cooling to 80°F: Temperature ${temp}°F above required 80°F`;
        } else if (stage === 'coolingTo54' && temp > 54) {
          violationComment = `Row ${rowIndex + 1} Cooling to 54°F: Temperature ${temp}°F above required 54°F`;
        } else if (stage === 'finalChill' && temp > 40) {
          violationComment = `Row ${rowIndex + 1} Final Chill: Temperature ${temp}°F above required 40°F`;
        }
        
        if (violationComment) {
          const currentText = localForm.correctiveActionsComments || '';
          const updatedText = currentText ? `${currentText}\n${violationComment}` : violationComment;
          setCorrectiveText(formatNumberedTextFromRaw(updatedText));
          onFormUpdate(localForm.id, { correctiveActionsComments: updatedText });
        }
      }
      
      // Handle time-based validations
      if (fieldName === 'time' && stageData.temp) {
        if (stage === 'coolingTo80' && stageData.temp <= 80) {
          const ccp2Time = updatedEntries[rowIndex].ccp2?.time;
          if (ccp2Time && stageData.time) {
            const timeDiff = getTimeDifferenceMinutes(ccp2Time, stageData.time);
            if (timeDiff > 105) {
              const violationComment = `Row ${rowIndex + 1} Cooling to 80°F: ${timeDiff} minutes exceeds 105 minute limit`;
              const currentText = localForm.correctiveActionsComments || '';
              const updatedText = currentText ? `${currentText}\n${violationComment}` : violationComment;
              setCorrectiveText(formatNumberedTextFromRaw(updatedText));
              onFormUpdate(localForm.id, { correctiveActionsComments: updatedText });
            }
          }
        } else if (stage === 'coolingTo54' && stageData.temp <= 54) {
          const ccp2Time = updatedEntries[rowIndex].ccp2?.time;
          if (ccp2Time && stageData.time) {
            const timeDiff = getTimeDifferenceMinutes(ccp2Time, stageData.time);
            if (timeDiff > 285) { // 4.75 hours = 285 minutes
              const violationComment = `Row ${rowIndex + 1} Cooling to 54°F: ${timeDiff} minutes exceeds 4.75 hour limit`;
              const currentText = localForm.correctiveActionsComments || '';
              const updatedText = currentText ? `${currentText}\n${violationComment}` : violationComment;
              setCorrectiveText(formatNumberedTextFromRaw(updatedText));
              onFormUpdate(localForm.id, { correctiveActionsComments: updatedText });
            }
          }
        }
      }
    } else {
      (updatedEntries[rowIndex] as any)[field] = value;
    }
    
    setLocalForm({ ...localForm, entries: updatedEntries });
    onFormUpdate(localForm.id, { entries: updatedEntries });
  };

  const handleFormFieldChange = (field: keyof BagelDogFormEntry, value: any) => {
    const updated = { ...localForm, [field]: value };
    setLocalForm(updated);
    onFormUpdate(localForm.id, { [field]: value });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bagel Dog Cooking & Cooling</h1>
        <div className="flex justify-center items-center gap-8">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">DATE:</label>
            <input
              type="date"
              value={format(localForm.date, 'yyyy-MM-dd')}
              onChange={(e) => handleInputChange('date', new Date(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
              disabled={!isEditing}
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Lot #:</label>
            <input
              type="text"
              value={localForm.lotNumber || ''}
              onChange={(e) => handleInputChange('lotNumber', e.target.value)}
              className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
              placeholder="Lot #"
              disabled={!isEditing}
            />
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {localForm.status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border border-gray-300 text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">First Rack/Last Rack</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Rack # & Flavor</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium" colSpan={3}>
                CCP #1. 166°F or higher. Around 200°F for quality
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium" colSpan={3}>
                CCP #2 127°F or higher
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium" colSpan={3}>
                80°F or lower within 105 minutes
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium" colSpan={3}>
                54°F or lower within 4.75 hrs
              </th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium" colSpan={3}>
                Chill Continuously to 40°F or below
              </th>
            </tr>
            <tr className="bg-gray-50">
              <th className="border border-gray-300 px-2 py-2 text-center font-medium"></th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Temp</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Time</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Initials</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Temp</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Time</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Initials</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Temp</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Time</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Initials</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Temp</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Time</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Initials</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Temp</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Time</th>
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Initials</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 21 }, (_, index) => {
              const entry = localForm.entries[index] || {
                rack: '',
                type: '',
                ccp1: { temp: '', time: '', initial: '', dataLog: false },
                ccp2: { temp: '', time: '', initial: '', dataLog: false },
                coolingTo80: { temp: '', time: '', initial: '', dataLog: false },
                coolingTo54: { temp: '', time: '', initial: '', dataLog: false },
                finalChill: { temp: '', time: '', initial: '', dataLog: false },
              };
              const isSpecial = isSpecialRow(index);
              
                              return (
                  <tr key={index}>
                    {/* First Rack/Last Rack column - dropdown like cooling form */}
                    <td className="border border-gray-300 px-2 py-1">
                      <select
                        value={entry.type || ""}
                        onChange={(e) => {
                          const updated = { ...localForm };
                          if (!updated.entries[index]) {
                            updated.entries[index] = {
                              rack: '',
                              type: '',
                              ccp1: { temp: '', time: '', initial: '', dataLog: false },
                              ccp2: { temp: '', time: '', initial: '', dataLog: false },
                              coolingTo80: { temp: '', time: '', initial: '', dataLog: false },
                              coolingTo54: { temp: '', time: '', initial: '', dataLog: false },
                              finalChill: { temp: '', time: '', initial: '', dataLog: false },
                            };
                          }
                          updated.entries[index].type = e.target.value;
                          setLocalForm(updated);
                          onFormUpdate(localForm.id, { entries: updated.entries });
                        }}
                        className="w-full text-xs border-0 bg-transparent text-center cursor-pointer"
                        disabled={readOnly}
                      >
                        <option value="">--</option>
                        <option value="1st Rack">1st Rack</option>
                        <option value="Last Rack">Last Rack</option>
                      </select>
                    </td>
                    {/* Combined Rack # & Flavor column - shows row number + editable text */}
                    <td className="border border-gray-300 px-2 py-1">
                      <div className="flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600 mr-2">{index + 1}.</span>
                        <TextCell
                          formId={localForm.id}
                          field={`${index}-rack`}
                          valueFromStore={entry.rack || ""}
                          readOnly={readOnly}
                          commitField={(value: string) => {
                            commitField(index, "rack", value);
                          }}
                          className="flex-1 text-center border-none outline-none min-w-0"
                          placeholder="Rack # & Flavor"
                          type="text"
                          inputMode="text"
                          maxLength={50}
                        />
                      </div>
                    </td>
                  
                  {/* CCP #1 */}
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-ccp1.temp`}
                      valueFromStore={entry.ccp1?.temp || ""}
                      readOnly={readOnly || isStageLocked(index, 'ccp1')}
                      commitField={(value: string) => {
                        commitField(index, "ccp1.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(index, "ccp1.temp", value)
                      }
                      className={getCellClasses(
                        index,
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
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TimePicker
                      value={entry.ccp1?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(index, "ccp1.time", time)
                      }
                      placeholder="Time"
                      className={getCellClasses(index, "ccp1.time", "w-full")}
                      disabled={readOnly || isStageLocked(index, 'ccp1')}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.ccp1?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        const updatedEntries = [...localForm.entries];
                        updatedEntries[index] = {
                          ...updatedEntries[index],
                          ccp1: { ...updatedEntries[index].ccp1, dataLog },
                        };
                        setLocalForm({ ...localForm, entries: updatedEntries });
                        onFormUpdate(localForm.id, { entries: updatedEntries });
                        updateCorrectiveActionsForDataLog(index, "ccp1", dataLog);
                      }}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-ccp1.initial`}
                      valueFromStore={entry.ccp1?.initial || ""}
                      readOnly={readOnly || isStageLocked(index, 'ccp1')}
                      commitField={(value: string) => {
                        commitField(index, "ccp1.initial", value.toUpperCase());
                      }}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </td>
                  
                  {/* CCP #2 */}
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-ccp2.temp`}
                      valueFromStore={entry.ccp2?.temp || ""}
                      readOnly={readOnly || isStageLocked(index, 'ccp2')}
                      commitField={(value: string) => {
                        commitField(index, "ccp2.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(index, "ccp2.temp", value)
                      }
                      className={getCellClasses(
                        index,
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
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TimePicker
                      value={entry.ccp2?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(index, "ccp2.time", time)
                      }
                      placeholder="Time"
                      className={getCellClasses(index, "ccp2.time", "w-full")}
                      disabled={readOnly || isStageLocked(index, 'ccp2')}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.ccp2?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        const updatedEntries = [...localForm.entries];
                        updatedEntries[index] = {
                          ...updatedEntries[index],
                          ccp2: { ...updatedEntries[index].ccp2, dataLog },
                        };
                        setLocalForm({ ...localForm, entries: updatedEntries });
                        onFormUpdate(localForm.id, { entries: updatedEntries });
                        updateCorrectiveActionsForDataLog(index, "ccp2", dataLog);
                      }}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-ccp2.initial`}
                      valueFromStore={entry.ccp2?.initial || ""}
                      readOnly={readOnly || isStageLocked(index, 'ccp2')}
                      commitField={(value: string) => {
                        commitField(index, "ccp2.initial", value.toUpperCase());
                      }}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </td>
                  
                  {/* 80°F */}
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-coolingTo80.temp`}
                      valueFromStore={entry.coolingTo80?.temp || ""}
                      readOnly={readOnly || isStageLocked(index, 'coolingTo80')}
                      commitField={(value: string) => {
                        commitField(index, "coolingTo80.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(index, "coolingTo80.temp", value)
                      }
                      className={getCellClasses(
                        index,
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
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TimePicker
                      value={entry.coolingTo80?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(index, "coolingTo80.time", time)
                      }
                      placeholder="Time"
                      className={getCellClasses(index, "coolingTo80.time", "w-full")}
                      disabled={readOnly || isStageLocked(index, 'coolingTo80')}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.coolingTo80?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        const updatedEntries = [...localForm.entries];
                        updatedEntries[index] = {
                          ...updatedEntries[index],
                          coolingTo80: { ...updatedEntries[index].coolingTo80, dataLog },
                        };
                        setLocalForm({ ...localForm, entries: updatedEntries });
                        onFormUpdate(localForm.id, { entries: updatedEntries });
                        updateCorrectiveActionsForDataLog(index, "coolingTo80", dataLog);
                      }}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-coolingTo80.initial`}
                      valueFromStore={entry.coolingTo80?.initial || ""}
                      readOnly={readOnly || isStageLocked(index, 'coolingTo80')}
                      commitField={(value: string) => {
                        commitField(index, "coolingTo80.initial", value.toUpperCase());
                      }}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </td>
                  
                  {/* 54°F */}
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-coolingTo54.temp`}
                      valueFromStore={entry.coolingTo54?.temp || ""}
                      readOnly={readOnly || isStageLocked(index, 'coolingTo54')}
                      commitField={(value: string) => {
                        commitField(index, "coolingTo54.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(index, "coolingTo54.temp", value)
                      }
                      className={getCellClasses(
                        index,
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
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TimePicker
                      value={entry.coolingTo54?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(index, "coolingTo54.time", time)
                      }
                      placeholder="Time"
                      className={getCellClasses(index, "coolingTo54.time", "w-full")}
                      disabled={readOnly || isStageLocked(index, 'coolingTo54')}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.coolingTo54?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        const updatedEntries = [...localForm.entries];
                        updatedEntries[index] = {
                          ...updatedEntries[index],
                          coolingTo54: { ...updatedEntries[index].coolingTo54, dataLog },
                        };
                        setLocalForm({ ...localForm, entries: updatedEntries });
                        onFormUpdate(localForm.id, { entries: updatedEntries });
                        updateCorrectiveActionsForDataLog(index, "coolingTo54", dataLog);
                      }}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-coolingTo54.initial`}
                      valueFromStore={entry.coolingTo54?.initial || ""}
                      readOnly={readOnly || isStageLocked(index, 'coolingTo54')}
                      commitField={(value: string) => {
                        commitField(index, "coolingTo54.initial", value.toUpperCase());
                      }}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </td>
                  
                  {/* Final Chill */}
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-finalChill.temp`}
                      valueFromStore={entry.finalChill?.temp || ""}
                      readOnly={readOnly || isStageLocked(index, 'finalChill')}
                      commitField={(value: string) => {
                        commitField(index, "finalChill.temp", value);
                      }}
                      onBlurValidate={async (value: string) =>
                        await handleCellChange(index, "finalChill.temp", value)
                      }
                      className={getCellClasses(
                        index,
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
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TimePicker
                      value={entry.finalChill?.time}
                      onChange={async (time: string) =>
                        await handleCellChange(index, "finalChill.time", time)
                      }
                      placeholder="Time"
                      className={getCellClasses(index, "finalChill.time", "w-full")}
                      disabled={readOnly || isStageLocked(index, 'finalChill')}
                      showQuickTimes={false}
                      compact
                      dataLog={entry.finalChill?.dataLog || false}
                      onDataLogChange={async (dataLog: boolean) => {
                        const updatedEntries = [...localForm.entries];
                        updatedEntries[index] = {
                          ...updatedEntries[index],
                          finalChill: { ...updatedEntries[index].finalChill, dataLog },
                        };
                        setLocalForm({ ...localForm, entries: updatedEntries });
                        onFormUpdate(localForm.id, { entries: updatedEntries });
                        updateCorrectiveActionsForDataLog(index, "finalChill", dataLog);
                      }}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <TextCell
                      formId={localForm.id}
                      field={`${index}-finalChill.initial`}
                      valueFromStore={entry.finalChill?.initial || ""}
                      readOnly={readOnly || isStageLocked(index, 'finalChill')}
                      commitField={(value: string) => {
                        commitField(index, "finalChill.initial", value.toUpperCase());
                      }}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Sections - Layout matching the image exactly */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Section - Frank Flavor/Size, Thermometer, Pre-shipment Review */}
        <div className="col-span-1 space-y-4">
          {/* Frank Flavor/Size Table */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Frank Flavor/Size & Packages Used</h3>
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-center font-medium">Frank Flavor/Size</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-medium">Lot #(s)</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-medium">Packages Used</th>
                </tr>
              </thead>
              <tbody>
                {localForm.frankFlavorSizeTable && Object.entries(localForm.frankFlavorSizeTable).map(([key, item]) => (
                  <tr key={key}>
                    <td className="border border-gray-300 px-2 py-2 text-center font-medium">
                      {item.flavor}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="text"
                        value={item.lotNumbers}
                        onChange={(e) => {
                          const updated = { ...localForm };
                          if (updated.frankFlavorSizeTable) {
                            updated.frankFlavorSizeTable[key as keyof typeof updated.frankFlavorSizeTable] = {
                              ...item,
                              lotNumbers: e.target.value
                            };
                            setLocalForm(updated);
                            onFormUpdate(localForm.id, { frankFlavorSizeTable: updated.frankFlavorSizeTable });
                          }
                        }}
                        className="w-full text-center border-none outline-none"
                        placeholder="Lot #"
                        disabled={!isEditing}
                      />
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="text"
                        value={item.packagesUsed}
                        onChange={(e) => {
                          const updated = { ...localForm };
                          if (updated.frankFlavorSizeTable) {
                            updated.frankFlavorSizeTable[key as keyof typeof updated.frankFlavorSizeTable] = {
                              ...item,
                              packagesUsed: e.target.value
                            };
                            setLocalForm(updated);
                            onFormUpdate(localForm.id, { frankFlavorSizeTable: updated.frankFlavorSizeTable });
                          }
                        }}
                        className="w-full text-center border-none outline-none"
                        placeholder="Packages"
                        disabled={!isEditing}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Thermometer # */}
          <div className="border border-gray-300 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Thermometer #:</label>
            <input
              type="text"
              value={localForm.thermometerNumber}
              onChange={(e) => handleInputChange('thermometerNumber', e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Enter thermometer number"
              disabled={!isEditing}
            />
          </div>
          
          {/* Pre-shipment Review */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="text-md font-semibold mb-2">Pre-shipment Review</h4>
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-center font-medium">Date</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-medium">Results</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-medium">Signature</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="date"
                      value={localForm.bagelDogPreShipmentReview?.date || ''}
                      onChange={(e) => {
                        const updated = { ...localForm };
                        if (updated.bagelDogPreShipmentReview) {
                          updated.bagelDogPreShipmentReview.date = e.target.value;
                          setLocalForm(updated);
                          onFormUpdate(localForm.id, { bagelDogPreShipmentReview: updated.bagelDogPreShipmentReview });
                        }
                      }}
                      className="w-full text-center border-none outline-none"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={localForm.bagelDogPreShipmentReview?.results || ''}
                      onChange={(e) => {
                        const updated = { ...localForm };
                        if (updated.bagelDogPreShipmentReview) {
                          updated.bagelDogPreShipmentReview.results = e.target.value;
                          setLocalForm(updated);
                          onFormUpdate(localForm.id, { bagelDogPreShipmentReview: updated.bagelDogPreShipmentReview });
                        }
                      }}
                      className="w-full text-center border-none outline-none"
                      placeholder="Results"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={localForm.bagelDogPreShipmentReview?.signature || ''}
                      onChange={(e) => {
                        const updated = { ...localForm };
                        if (updated.bagelDogPreShipmentReview) {
                          updated.bagelDogPreShipmentReview.signature = e.target.value;
                          setLocalForm(updated);
                          onFormUpdate(localForm.id, { bagelDogPreShipmentReview: updated.bagelDogPreShipmentReview });
                        }
                      }}
                      className="w-full text-center border-none outline-none"
                      placeholder="Signature"
                      disabled={!isEditing}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Section - Ingredients Table (spans 2 columns) */}
        <div className="col-span-2">
          {/* Ingredients */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Ingredients & Lot #(s)</h3>
            <table className="w-full border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-2 py-2 text-center font-medium">Ingredients</th>
                  <th className="border border-gray-300 px-2 py-2 text-center font-medium">Lot #(s)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  'Unbleached Wheat Flour',
                  'Large chopped onions',
                  'Yeast',
                  'Toasted onions',
                  'Sugar',
                  'Soybean Oil',
                  'Salt',
                  'Malt',
                  'Egg',
                  'Poppy Seeds'
                ].map((ingredient, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-2 py-2 text-center font-medium">
                      {ingredient}
                    </td>
                    <td className="border border-gray-300 px-2 py-1">
                      <input
                        type="text"
                        value={localForm.ingredients[ingredient.toLowerCase().replace(/\s+/g, '') as keyof typeof localForm.ingredients] || ''}
                        onChange={(e) => {
                          const updated = { ...localForm };
                          const key = ingredient.toLowerCase().replace(/\s+/g, '') as keyof typeof updated.ingredients;
                          if (updated.ingredients[key]) {
                            updated.ingredients[key] = e.target.value;
                            setLocalForm(updated);
                            onFormUpdate(localForm.id, { ingredients: updated.ingredients });
                          }
                        }}
                        className="w-full text-center border-none outline-none"
                        placeholder="Lot #"
                        disabled={!isEditing}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Corrective Actions */}
      <div className="mt-6">
        <h3 className="font-semibold mb-2">Corrective Actions & Comments:</h3>
        <textarea
          value={correctiveText}
          onChange={(e) => setCorrectiveText(e.target.value)}
          onBlur={async () => {
            const rawText = stripNumberingToRaw(correctiveText);
            onFormUpdate(localForm.id, { correctiveActionsComments: rawText });
          }}
          className="w-full h-32 border border-gray-300 p-2 text-sm resize-none"
          placeholder="Enter any corrective actions taken or additional comments..."
          readOnly={readOnly}
        />
      </div>

      {/* Complete Button - Only show if form is not already complete and not read-only */}
      {!readOnly && localForm.status !== 'Complete' && (
        <div className="mt-6 text-center">
          <button
            onClick={async () => {
              try {
                console.log('🔄 Starting form completion process...');
                
                // Update form status to Complete
                updateFormStatus(localForm.id, 'Complete');
                
                // Update local form state for immediate UI feedback
                setLocalForm({ ...localForm, status: 'Complete' });
                
                // Also ensure the full form is saved to persist all changes
                setTimeout(async () => {
                  try {
                    await saveForm();
                    console.log('✅ Form status updated and full form saved successfully');
                  } catch (error) {
                    console.error('❌ Error saving form after status update:', error);
                  }
                }, 1000); // Wait a bit longer for the status update to complete
                
                console.log('✅ Form status updated to Complete');
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
      {localForm.status === 'Complete' && (
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

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${
              isEditing 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            {isEditing ? (
              <>
                <CheckCircleIcon className="h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <PencilIcon className="h-4 w-4" />
                Edit Form
              </>
            )}
          </button>
          
          {isEditing && (
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Save
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {errors.length > 0 && (
            <div className="flex items-center gap-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <span className="text-sm">{errors.length} validation error(s)</span>
            </div>
          )}
          
          {/* isAdmin prop is removed, so this button is removed */}
        </div>
      </div>
    </div>
  );
}
