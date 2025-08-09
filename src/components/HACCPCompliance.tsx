'use client';

import { useLogStore } from '@/stores/logStore';
import { HACCP_RECORDS, STORAGE_LOCATIONS } from '@/lib/types';

export function HACCPCompliance() {
  const { 
    currentLog, 
    updateHACCPField, 
    updateVisualInspection, 
    updateLogField,
    addComplianceIssue,
    removeComplianceIssue,
    updateRiskLevel 
  } = useLogStore();

  if (!currentLog) return null;

  const handleComplianceIssueToggle = (issue: string, checked: boolean) => {
    if (checked) {
      addComplianceIssue(issue);
    } else {
      removeComplianceIssue(issue);
    }
  };

  const potentialIssues = [
    'Temperature not maintained',
    'Time limits exceeded',
    'Equipment malfunction',
    'Cross contamination risk',
    'Documentation incomplete',
    'Visual abnormalities detected',
    'Storage conditions compromised',
  ];

  return (
    <div className="space-y-6">
      {/* HACCP Critical Control Points */}
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center mr-3">
            <span className="text-white font-bold text-sm">CCP</span>
          </div>
          <h3 className="text-xl font-semibold text-red-900">HACCP Critical Control Points</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-red-200">
            <input
              type="checkbox"
              checked={currentLog.haccp.ccp1Verified}
              onChange={(e) => updateHACCPField('ccp1Verified', e.target.checked)}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
            <div>
              <span className="font-medium text-red-900">CCP1 - Cooking Temperature Verified</span>
              <p className="text-sm text-red-700">Internal temperature reaches safe minimum</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-red-200">
            <input
              type="checkbox"
              checked={currentLog.haccp.ccp2Verified}
              onChange={(e) => updateHACCPField('ccp2Verified', e.target.checked)}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
            <div>
              <span className="font-medium text-red-900">CCP2 - Cooling Process Verified</span>
              <p className="text-sm text-red-700">Time and temperature limits met</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-red-200">
            <input
              type="checkbox"
              checked={currentLog.haccp.monitoringCompleted}
              onChange={(e) => updateHACCPField('monitoringCompleted', e.target.checked)}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
            <div>
              <span className="font-medium text-red-900">Monitoring Completed</span>
              <p className="text-sm text-red-700">All monitoring procedures followed</p>
            </div>
          </label>

          <label className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-red-200">
            <input
              type="checkbox"
              checked={currentLog.haccp.correctiveActionsDocumented}
              onChange={(e) => updateHACCPField('correctiveActionsDocumented', e.target.checked)}
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
            <div>
              <span className="font-medium text-red-900">Corrective Actions Documented</span>
              <p className="text-sm text-red-700">Any deviations properly addressed</p>
            </div>
          </label>
        </div>
      </div>

      {/* Visual Inspection */}
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-green-900 mb-4">Visual Inspection</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">Color</label>
            <select
              value={currentLog.visualInspection.color}
              onChange={(e) => updateVisualInspection('color', e.target.value)}
              className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="abnormal">Abnormal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">Texture</label>
            <select
              value={currentLog.visualInspection.texture}
              onChange={(e) => updateVisualInspection('texture', e.target.value)}
              className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="abnormal">Abnormal</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-green-700 mb-2">Odor</label>
            <select
              value={currentLog.visualInspection.odor}
              onChange={(e) => updateVisualInspection('odor', e.target.value)}
              className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none"
            >
              <option value="normal">Normal</option>
              <option value="abnormal">Abnormal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-green-700 mb-2">Inspection Notes</label>
          <textarea
            value={currentLog.visualInspection.notes || ''}
            onChange={(e) => updateVisualInspection('notes', e.target.value)}
            placeholder="Any additional observations..."
            rows={3}
            className="w-full px-3 py-2 border-2 border-green-300 rounded-lg focus:border-green-500 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Storage Information */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-blue-900 mb-4">Storage Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">Storage Location</label>
            <select
              value={currentLog.storageLocation}
              onChange={(e) => updateLogField('storageLocation', e.target.value)}
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
            >
              <option value="">Select Location</option>
              {STORAGE_LOCATIONS.map((location) => (
                <option key={location} value={location}>
                  {location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">Storage Temperature (°F)</label>
            <input
              type="number"
              value={currentLog.storageTemperature || ''}
              onChange={(e) => updateLogField('storageTemperature', parseFloat(e.target.value))}
              placeholder="38"
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-700 mb-2">Storage Time</label>
            <input
              type="time"
              value={currentLog.storageTime?.toTimeString().slice(0, 5) || ''}
              onChange={(e) => {
                const [hours, minutes] = e.target.value.split(':');
                const newTime = new Date();
                newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                updateLogField('storageTime', newTime);
              }}
              className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Compliance Issues */}
      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-yellow-900 mb-4">Compliance Issues</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {potentialIssues.map((issue) => (
            <label key={issue} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-yellow-200">
              <input
                type="checkbox"
                checked={currentLog.complianceIssues.includes(issue)}
                onChange={(e) => handleComplianceIssueToggle(issue, e.target.checked)}
                className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
              />
              <span className="text-yellow-900">{issue}</span>
            </label>
          ))}
        </div>

        {/* Risk Level */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-yellow-700 mb-2">Risk Level Assessment</label>
          <div className="flex gap-4">
            {(['low', 'medium', 'high'] as const).map((level) => (
              <label key={level} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="riskLevel"
                  value={level}
                  checked={currentLog.riskLevel === level}
                  onChange={(e) => updateRiskLevel(e.target.value as 'low' | 'medium' | 'high')}
                  className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                />
                <span className={`capitalize font-medium ${
                  level === 'low' ? 'text-green-700' :
                  level === 'medium' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {level}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* HACCP Reference */}
      <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">HACCP Reference Guide</h3>
        <div className="space-y-4">
          {HACCP_RECORDS.map((record, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-2">{record.criticalControlPoint}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <span className="font-medium">Critical Limit:</span> {record.criticalLimit}
                </div>
                <div>
                  <span className="font-medium">Frequency:</span> {record.frequency}
                </div>
                <div>
                  <span className="font-medium">Monitoring:</span> {record.monitoringProcedure}
                </div>
                <div>
                  <span className="font-medium">Responsible Person:</span> {record.responsiblePerson}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
