'use client';

import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperFormEntry } from '@/lib/paperFormTypes';

interface PaperFormProps {
  formData?: PaperFormEntry;
  readOnly?: boolean;
  onSave?: () => void;
}

export function PaperForm({ formData, readOnly = false, onSave }: PaperFormProps = {}) {
  const { currentForm, updateEntry, updateFormField, saveForm } = usePaperFormStore();

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
      updateFormField(field, value);
    }
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
                      className="w-full text-xs border-0 bg-transparent text-center"
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
                      className="w-full text-xs border-0 bg-transparent text-center"
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
                      className="w-full text-xs border-0 bg-transparent text-center"
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
                      className="w-full text-xs border-0 bg-transparent text-center"
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
                      className="w-full text-xs border-0 bg-transparent text-center"
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
