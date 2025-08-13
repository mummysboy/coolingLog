'use client';

import React from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperFormEntry, FormType, ensureDate } from '@/lib/paperFormTypes';
import { TimePicker } from './TimePicker';

interface PiroshkiFormProps {
  formData?: PaperFormEntry;
  readOnly?: boolean;
  onSave?: () => void;
  onFormUpdate?: (formId: string, updates: Partial<PaperFormEntry>) => void;
}

export function PiroshkiForm({ formData, readOnly = false, onSave, onFormUpdate }: PiroshkiFormProps = {}) {
  const { currentForm, updateEntry, updateFormField, updateFormStatus, saveForm, updateAdminForm, savedForms } = usePaperFormStore();

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
  }, [isAdminForm, formData, savedForms, currentForm]);

  if (!form) return null;

  const handleCellChange = (rowIndex: number, field: string, value: string | boolean) => {
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
      
      // Auto-save after updating entry (only if form has data and not admin form)
      if (!isAdminForm) {
        setTimeout(() => saveForm(), 100);
      }
    }
  };

  const handleFormFieldChange = (field: string, value: any) => {
    if (!readOnly) {
      if (isAdminForm) {
        // For admin forms, update the specific form directly
        updateAdminForm(form.id, { [field]: value });
        
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
                onChange={(e) => handleFormFieldChange('title', e.target.value)}
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
                onChange={(e) => handleFormFieldChange('date', new Date(e.target.value))}
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
                  <td className="border border-black p-1">
                    <div className="grid grid-cols-4 gap-1">
                      <input
                        type="text"
                        value={entry.heatTreating?.type || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'heatTreating.type', e.target.value)}
                        className="w-full text-xs border-0 bg-transparent text-center"
                        placeholder="Type"
                        readOnly={readOnly}
                      />
                      <input
                        type="number"
                        value={entry.heatTreating?.temp || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'heatTreating.temp', e.target.value)}
                        className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                        placeholder="°F"
                        step="0.1"
                        min="0"
                        max="300"
                        readOnly={readOnly}
                      />
                      <TimePicker
                        value={entry.heatTreating?.time || ''}
                        onChange={(time) => handleCellChange(rowIndex, 'heatTreating.time', time)}
                        placeholder="Time"
                        className="w-full"
                        disabled={readOnly}
                        showQuickTimes={false}
                        compact={true}
                      />
                      <input
                        type="text"
                        value={entry.heatTreating?.initial || ''}
                        onChange={(e) => handleCellChange(rowIndex, 'heatTreating.initial', e.target.value.toUpperCase())}
                        className="w-full text-xs border-0 bg-transparent text-center"
                        placeholder="Init"
                        maxLength={3}
                        readOnly={readOnly}
                      />
                    </div>
                  </td>
                ) : (
                  <td className="border border-black p-1 bg-gray-50"></td>
                )}

                {/* 126°F or greater CCP 2 */}
                <td className="border border-black p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={entry.ccp2_126?.temp || ''}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2_126.temp', e.target.value)}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                      placeholder="°F"
                      step="0.1"
                      min="0"
                      max="300"
                      readOnly={readOnly}
                    />
                    <TimePicker
                      value={entry.ccp2_126?.time || ''}
                      onChange={(time) => handleCellChange(rowIndex, 'ccp2_126.time', time)}
                      placeholder="Time"
                      className="w-full"
                      disabled={readOnly}
                      showQuickTimes={false}
                      compact={true}
                    />
                    <input
                      type="text"
                      value={entry.ccp2_126?.initial || ''}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2_126.initial', e.target.value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* 80°F or below within 105 minutes */}
                <td className="border border-black p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={entry.ccp2_80?.temp || ''}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2_80.temp', e.target.value)}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                      placeholder="°F"
                      step="0.1"
                      min="0"
                      max="300"
                      readOnly={readOnly}
                    />
                    <TimePicker
                      value={entry.ccp2_80?.time || ''}
                      onChange={(time) => handleCellChange(rowIndex, 'ccp2_80.time', time)}
                      placeholder="Time"
                      className="w-full"
                      disabled={readOnly}
                      showQuickTimes={false}
                      compact={true}
                    />
                    <input
                      type="text"
                      value={entry.ccp2_80?.initial || ''}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2_80.initial', e.target.value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* 55°F or below within 4.75 hr */}
                <td className="border border-black p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={entry.ccp2_55?.temp || ''}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2_55.temp', e.target.value)}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                      placeholder="°F"
                      step="0.1"
                      min="0"
                      max="300"
                      readOnly={readOnly}
                    />
                    <TimePicker
                      value={entry.ccp2_55?.time || ''}
                      onChange={(time) => handleCellChange(rowIndex, 'ccp2_55.time', time)}
                      placeholder="Time"
                      className="w-full"
                      disabled={readOnly}
                      showQuickTimes={false}
                      compact={true}
                    />
                    <input
                      type="text"
                      value={entry.ccp2_55?.initial || ''}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2_55.initial', e.target.value.toUpperCase())}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
                      readOnly={readOnly}
                    />
                  </div>
                </td>

                {/* Chill Continuously to 40°F */}
                <td className="border border-black p-1">
                  <div className="grid grid-cols-3 gap-1">
                    <input
                      type="number"
                      value={entry.finalChill?.temp || ''}
                      onChange={(e) => handleCellChange(rowIndex, 'finalChill.temp', e.target.value)}
                      className="w-full text-xs text-center rounded-sm focus:ring-2 focus:ring-blue-300 focus:border-blue-500"
                      placeholder="°F"
                      step="0.1"
                      min="0"
                      max="300"
                      readOnly={readOnly}
                    />
                    <TimePicker
                      value={entry.finalChill?.time || ''}
                      onChange={(time) => handleCellChange(rowIndex, 'finalChill.time', time)}
                      placeholder="Time"
                      className="w-full"
                      disabled={readOnly}
                      showQuickTimes={false}
                      compact={true}
                    />
                    <input
                      type="text"
                      value={entry.finalChill?.initial || ''}
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
                value={form.correctiveActionsComments}
                onChange={(e) => handleFormFieldChange('correctiveActionsComments', e.target.value)}
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
            onClick={() => {
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
    </div>
  );
}
