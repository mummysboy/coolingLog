'use client';

import { usePaperFormStore } from '@/stores/paperFormStore';

export function PaperForm() {
  const { currentForm, updateEntry, updateFormField, saveForm } = usePaperFormStore();

  if (!currentForm) return null;

  const handleCellChange = (rowIndex: number, field: string, value: string) => {
    updateEntry(rowIndex, field, value);
  };

  return (
    <div className="bg-white p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-2 border-black mb-4">
        <div className="bg-gray-100 p-4 text-center">
          <h1 className="text-xl font-bold">Cooking and Cooling for Meat & Non Meat Ingredients</h1>
        </div>
        <div className="p-4 flex justify-between items-center">
          <div>
            <span className="font-semibold">Date: </span>
            <input
              type="date"
              value={currentForm.date.toISOString().split('T')[0]}
              onChange={(e) => updateFormField('date', new Date(e.target.value))}
              className="border-b border-black bg-transparent"
            />
          </div>
          <div className="text-right">
            <div>Modified 05/01/24</div>
            <div>Previous 05/15/24</div>
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
            {currentForm.entries.map((entry, rowIndex) => (
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
                  />
                  {rowIndex === 5 && (
                    <div className="text-xs mt-2 font-semibold">
                      LAST RACK/BATCH of Production Day
                    </div>
                  )}
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
                    />
                    <input
                      type="time"
                      value={entry.ccp1.time}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp1.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={entry.ccp1.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp1.initial', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
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
                    />
                    <input
                      type="time"
                      value={entry.ccp2.time}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={entry.ccp2.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'ccp2.initial', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
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
                    />
                    <input
                      type="time"
                      value={entry.coolingTo80.time}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo80.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={entry.coolingTo80.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo80.initial', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
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
                    />
                    <input
                      type="time"
                      value={entry.coolingTo54.time}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo54.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={entry.coolingTo54.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'coolingTo54.initial', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent text-center"
                      placeholder="Init"
                      maxLength={3}
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
                    />
                    <input
                      type="time"
                      value={entry.finalChill.time}
                      onChange={(e) => handleCellChange(rowIndex, 'finalChill.time', e.target.value)}
                      className="w-full text-xs border-0 bg-transparent"
                    />
                    <input
                      type="text"
                      value={entry.finalChill.initial}
                      onChange={(e) => handleCellChange(rowIndex, 'finalChill.initial', e.target.value)}
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
          {/* Left side - Thermometer and Ingredients */}
          <div className="border-r border-black">
            {/* Thermometer # */}
            <div className="border-b border-black p-2 text-center">
              <span className="font-semibold">Thermometer #</span>
              <input
                type="text"
                value={currentForm.thermometerNumber}
                onChange={(e) => updateFormField('thermometerNumber', e.target.value)}
                className="ml-2 border-b border-black bg-transparent"
                placeholder="Enter thermometer number"
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
                      value={currentForm.lotNumbers.beef}
                      onChange={(e) => updateFormField('lotNumbers.beef', e.target.value)}
                      className="w-full border-0 bg-transparent text-sm"
                    />
                  </td>
                  <td className="border border-black p-1">
                    <input
                      type="text"
                      value={currentForm.lotNumbers.chicken}
                      onChange={(e) => updateFormField('lotNumbers.chicken', e.target.value)}
                      className="w-full border-0 bg-transparent text-sm"
                    />
                  </td>
                  <td className="border border-black p-1">
                    <input
                      type="text"
                      value={currentForm.lotNumbers.liquidEggs}
                      onChange={(e) => updateFormField('lotNumbers.liquidEggs', e.target.value)}
                      className="w-full border-0 bg-transparent text-sm"
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
              value={currentForm.correctiveActionsComments}
              onChange={(e) => updateFormField('correctiveActionsComments', e.target.value)}
              className="w-full h-32 border border-gray-300 p-2 text-sm resize-none"
              placeholder="Enter any corrective actions taken or additional comments..."
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-4 text-center">
        <button
          onClick={saveForm}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          Save Form
        </button>
      </div>
    </div>
  );
}
