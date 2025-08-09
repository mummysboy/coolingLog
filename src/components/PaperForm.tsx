'use client';

import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperFormEntry } from '@/lib/paperFormTypes';
import { shouldHighlightCell, validateForm } from '@/lib/validation';

interface PaperFormProps {
  formData?: PaperFormEntry;
  readOnly?: boolean;
  onSave?: () => void;
}

export function PaperForm({ formData, readOnly = false, onSave }: PaperFormProps = {}) {
  const { currentForm, updateEntry, updateFormField, saveForm, getFormByDateAndInitial, loadForm, selectedInitial } = usePaperFormStore();

  // Use provided formData or fall back to currentForm from store
  const form = formData || currentForm;

  if (!form) return null;

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    if (!readOnly) {
      updateEntry(rowIndex, field, value);
    }
  };

  const handleFormFieldChange = (field: string, value: any) => {
    if (!readOnly) {
      // Special handling for date changes
      if (field === 'date' && selectedInitial) {
        const newDate = new Date(value);
        const existingForm = getFormByDateAndInitial(newDate, selectedInitial);
        
        if (existingForm && existingForm.id !== form?.id) {
          // Load the existing form for this date
          loadForm(existingForm.id);
        } else {
          // No existing form for this date, just update the current form's date
          updateFormField(field, value);
        }
      } else {
        updateFormField(field, value);
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
                  <div className="font-bold text-sm">{rowIndex + 1}</div>
                  <input
                    type="text"
                    value={entry.type}
                    onChange={(e) => handleCellChange(rowIndex, 'type', e.target.value)}
                    className="w-full text-xs mt-1 border-0 bg-transparent text-center"
                    placeholder="Type"
                    readOnly={readOnly}
                  />

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
                    <input
                      type="time"
                      value={entry.ccp1.time}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp1.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                      readOnly={readOnly}
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
                    <input
                      type="time"
                      value={entry.ccp2.time}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                      readOnly={readOnly}
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
                    <input
                      type="time"
                      value={entry.coolingTo80.time}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo80.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                      readOnly={readOnly}
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
                    <input
                      type="time"
                      value={entry.coolingTo54.time}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo54.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                      readOnly={readOnly}
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
                    <input
                      type="time"
                      value={entry.finalChill.time}
                      onChange={(e) => handleCellChange(rowIndex, 'finalChill.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                      readOnly={readOnly}
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
          <div className="p-4">
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

      {/* Validation Summary */}
      {form && (() => {
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
                {validation.errors.map((error, index) => (
                  <div 
                    key={index} 
                    className={`text-sm p-2 rounded ${
                      error.severity === 'error' 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}
                  >
                    <span className="font-medium">Row {error.rowIndex + 1}:</span> {error.message}
                  </div>
                ))}
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

      {/* Save Button */}
      {!readOnly && (
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              saveForm();
              if (onSave) {
                onSave();
              }
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Save Form
          </button>
        </div>
      )}
    </div>
  );
}
