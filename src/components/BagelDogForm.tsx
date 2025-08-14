'use client';

import React, { useState, useEffect } from 'react';
import { PaperFormEntry, BaseFormRow, FormType } from '../lib/paperFormTypes';
import { shouldHighlightTemperature } from '../lib/validation';
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

interface BagelDogFormProps {
  formData: PaperFormEntry;
  readOnly: boolean;
  onFormUpdate: (formId: string, updates: any) => void;
}

export default function BagelDogForm({ formData, readOnly, onFormUpdate }: BagelDogFormProps) {
  const { deleteForm } = usePaperFormStore();
  const { isAuthenticated } = usePinStore();
  const [localForm, setLocalForm] = useState<PaperFormEntry>(formData);
  const [errors, setErrors] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(!readOnly);

  // Debug logging
  console.log('BagelDogForm render:', { formData, readOnly, isEditing, localForm: !!localForm });

  useEffect(() => {
    setLocalForm(formData);
  }, [formData]);

  useEffect(() => {
    const validationResult = validateForm(localForm);
    const errorMessages = validationResult.errors
      .filter(error => error.severity === 'error')
      .map(error => `Row ${error.rowIndex + 1}: ${error.message}`);
    setErrors(errorMessages);
  }, [localForm]);

  const handleInputChange = (field: keyof PaperFormEntry, value: any) => {
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

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bagel Dog Cooking & Cooling</h1>
        <div className="flex justify-center items-center gap-4">
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
              <th className="border border-gray-300 px-2 py-2 text-center font-medium">Lot #</th>
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
              const row = localForm.entries[index] || localForm.entries[0];
              const isSpecial = isSpecialRow(index);
              
              return (
                <tr key={index} className={isSpecial ? 'bg-blue-50' : ''}>
                  <td className="border border-gray-300 px-2 py-2 text-center font-medium">
                    {isSpecial ? (
                      <div className="text-xs">
                        <div className="font-bold">{getRowLabel(index)}</div>
                        <div className="text-gray-600">{getRowType(index)}</div>
                      </div>
                    ) : (
                      index + 1
                    )}
                  </td>
                  
                  {/* CCP #1 */}
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.ccp1?.temp || ''}
                      onChange={(e) => handleRowChange(index, 'ccp1', { temp: e.target.value })}
                      className={`w-full text-center border-none outline-none ${shouldHighlightTemperature(row.ccp1?.temp, 166, '>=') ? 'bg-red-100' : ''}`}
                      placeholder="°F"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="time"
                      value={row.ccp1?.time || ''}
                      onChange={(e) => handleRowChange(index, 'ccp1', { time: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.ccp1?.initial || ''}
                      onChange={(e) => handleRowChange(index, 'ccp1', { initial: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      placeholder="Initials"
                      disabled={!isEditing}
                    />
                  </td>
                  
                  {/* CCP #2 */}
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.ccp2?.temp || ''}
                      onChange={(e) => handleRowChange(index, 'ccp2', { temp: e.target.value })}
                      className={`w-full text-center border-none outline-none ${shouldHighlightTemperature(row.ccp2?.temp, 127, '>=') ? 'bg-red-100' : ''}`}
                      placeholder="°F"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="time"
                      value={row.ccp2?.time || ''}
                      onChange={(e) => handleRowChange(index, 'ccp2', { time: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.ccp2?.initial || ''}
                      onChange={(e) => handleRowChange(index, 'ccp2', { initial: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      placeholder="Initials"
                      disabled={!isEditing}
                    />
                  </td>
                  
                  {/* 80°F */}
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.coolingTo80?.temp || ''}
                      onChange={(e) => handleRowChange(index, 'coolingTo80', { temp: e.target.value })}
                      className={`w-full text-center border-none outline-none ${shouldHighlightTemperature(row.coolingTo80?.temp, 80, '<=') ? 'bg-red-100' : ''}`}
                      placeholder="°F"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="time"
                      value={row.coolingTo80?.time || ''}
                      onChange={(e) => handleRowChange(index, 'coolingTo80', { time: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.coolingTo80?.initial || ''}
                      onChange={(e) => handleRowChange(index, 'coolingTo80', { initial: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      placeholder="Initials"
                      disabled={!isEditing}
                    />
                  </td>
                  
                  {/* 54°F */}
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.coolingTo54?.temp || ''}
                      onChange={(e) => handleRowChange(index, 'coolingTo54', { temp: e.target.value })}
                      className={`w-full text-center border-none outline-none ${shouldHighlightTemperature(row.coolingTo54?.temp, 54, '<=') ? 'bg-red-100' : ''}`}
                      placeholder="°F"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="time"
                      value={row.coolingTo54?.time || ''}
                      onChange={(e) => handleRowChange(index, 'coolingTo54', { time: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.coolingTo54?.initial || ''}
                      onChange={(e) => handleRowChange(index, 'coolingTo54', { initial: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      placeholder="Initials"
                      disabled={!isEditing}
                    />
                  </td>
                  
                  {/* Final Chill */}
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.finalChill?.temp || ''}
                      onChange={(e) => handleRowChange(index, 'finalChill', { temp: e.target.value })}
                      className={`w-full text-center border-none outline-none ${shouldHighlightTemperature(row.finalChill?.temp, 40, '<=') ? 'bg-red-100' : ''}`}
                      placeholder="°F"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="time"
                      value={row.finalChill?.time || ''}
                      onChange={(e) => handleRowChange(index, 'finalChill', { time: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      disabled={!isEditing}
                    />
                  </td>
                  <td className="border border-gray-300 px-2 py-1">
                    <input
                      type="text"
                      value={row.finalChill?.initial || ''}
                      onChange={(e) => handleRowChange(index, 'finalChill', { initial: e.target.value })}
                      className="w-full text-center border-none outline-none"
                      placeholder="Initials"
                      disabled={!isEditing}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Bottom Sections */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Section */}
        <div className="space-y-4">
          {/* Frank Flavor/Size Table */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Frank Flavor/Size & Thermometer # & Pre-shipment Review</h3>
            
            {/* Frank Flavor/Size Table */}
            <div className="mb-4">
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
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Thermometer #:</label>
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
            <div>
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
        </div>

        {/* Right Section */}
        <div className="space-y-4">
          {/* Ingredients */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3 text-center">Ingredients</h3>
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
