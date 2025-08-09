'use client';

import { useState } from 'react';
import { StageType, STAGE_CONFIGS } from '@/lib/types';

interface CorrectiveActionSheetProps {
  isOpen: boolean;
  stageId: StageType | null;
  onSave: (action: string) => void;
  onClose: () => void;
}

export function CorrectiveActionSheet({ isOpen, stageId, onSave, onClose }: CorrectiveActionSheetProps) {
  const [action, setAction] = useState('');

  if (!isOpen || !stageId) return null;

  const stageConfig = STAGE_CONFIGS.find(s => s.id === stageId);

  const handleSave = () => {
    if (action.trim()) {
      onSave(action.trim());
      setAction('');
    }
  };

  const handleClose = () => {
    setAction('');
    onClose();
  };

  const suggestedActions = {
    cook: [
      'Continue cooking until target temperature reached',
      'Adjust heat settings and monitor closely',
      'Check thermometer calibration',
    ],
    startCooling: [
      'Return to heat source to reach proper temperature',
      'Verify thermometer accuracy',
      'Continue cooking process',
    ],
    to80: [
      'Move to blast chiller immediately',
      'Reduce portion size for faster cooling',
      'Place in ice bath to accelerate cooling',
      'Discard product if unsafe time exceeded',
    ],
    to54: [
      'Transfer to blast chiller',
      'Break into smaller portions',
      'Place in ice bath',
      'Discard product if unsafe time exceeded',
    ],
    finalChill: [
      'Continue cooling in refrigerator',
      'Check refrigerator temperature',
      'Move to colder storage unit',
      'Monitor closely until target reached',
    ],
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 md:items-center">
      <div className="bg-white rounded-t-2xl md:rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-semibold text-red-700">
              Temperature/Time Failure
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {stageConfig?.name} - {stageConfig?.requirement}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">!</span>
                </div>
              </div>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-red-800">
                  Critical Control Point Failure
                </h4>
                <p className="text-sm text-red-700 mt-1">
                  This stage did not meet the required temperature or time specifications. 
                  Immediate corrective action is required to ensure food safety.
                </p>
              </div>
            </div>
          </div>

          {/* Suggested Actions */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Suggested Corrective Actions:
            </h4>
            <div className="space-y-2">
              {suggestedActions[stageId]?.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setAction(suggestion)}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                >
                  <span className="text-sm text-gray-700">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Action Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Corrective Action Taken:
            </label>
            <textarea
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="Describe the corrective action taken to address this failure..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
              required
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 touch-target py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!action.trim()}
            className="flex-1 touch-target py-3 bg-red-600 text-white rounded-xl font-medium disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-red-700 transition-colors"
          >
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  );
}
