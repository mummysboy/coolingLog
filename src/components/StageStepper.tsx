'use client';

import { useState } from 'react';
import { useLogStore } from '@/stores/logStore';
import { STAGE_CONFIGS, StageType } from '@/lib/types';
import { KeypadInput } from './KeypadInput';
import { TimerBadge } from './TimerBadge';
import { CorrectiveActionSheet } from './CorrectiveActionSheet';

export function StageStepper() {
  const { currentLog, updateStageData, validateStage } = useLogStore();
  const [stageInputs, setStageInputs] = useState<Record<StageType, { temp: string; time: Date }>>({
    cook: { temp: '', time: new Date() },
    startCooling: { temp: '', time: new Date() },
    to80: { temp: '', time: new Date() },
    to54: { temp: '', time: new Date() },
    finalChill: { temp: '', time: new Date() },
  });
  const [correctiveActionStage, setCorrectiveActionStage] = useState<StageType | null>(null);

  if (!currentLog) return null;

  const getStageStatus = (stageId: StageType): 'pending' | 'active' | 'completed' | 'failed' => {
    const stage = currentLog.stages[stageId];
    const stageIndex = STAGE_CONFIGS.findIndex(s => s.id === stageId);
    const currentStageIndex = STAGE_CONFIGS.findIndex(s => s.id === currentLog.currentStage);

    if (stage.isValid === false) return 'failed';
    if (stage.temperature !== undefined && stage.time !== undefined && stage.isValid === true) return 'completed';
    if (stageIndex === currentStageIndex) return 'active';
    if (stageIndex < currentStageIndex) return 'completed';
    return 'pending';
  };

  const isStageAccessible = (stageId: StageType): boolean => {
    const stageIndex = STAGE_CONFIGS.findIndex(s => s.id === stageId);
    const currentStageIndex = STAGE_CONFIGS.findIndex(s => s.id === currentLog.currentStage);
    return stageIndex <= currentStageIndex;
  };

  const handleTemperatureChange = (stageId: StageType, temp: string) => {
    setStageInputs(prev => ({
      ...prev,
      [stageId]: { ...prev[stageId], temp }
    }));
  };

  const handleTimeChange = (stageId: StageType, time: Date) => {
    setStageInputs(prev => ({
      ...prev,
      [stageId]: { ...prev[stageId], time }
    }));
  };

  const handleSaveStage = (stageId: StageType) => {
    const input = stageInputs[stageId];
    const temperature = parseFloat(input.temp);
    
    if (isNaN(temperature)) {
      alert('Please enter a valid temperature');
      return;
    }

    const validation = validateStage(stageId, temperature, input.time);
    
    if (!validation.isValid) {
      // Open corrective action sheet
      setCorrectiveActionStage(stageId);
      return;
    }

    // Save valid stage data
    updateStageData(stageId, {
      temperature,
      time: input.time,
      isValid: true,
    });

    // Clear input for this stage
    setStageInputs(prev => ({
      ...prev,
      [stageId]: { temp: '', time: new Date() }
    }));
  };

  const handleCorrectiveActionSave = (action: string) => {
    if (!correctiveActionStage) return;

    const input = stageInputs[correctiveActionStage];
    const temperature = parseFloat(input.temp);

    // Save stage data with corrective action
    updateStageData(correctiveActionStage, {
      temperature,
      time: input.time,
      isValid: false,
      correctiveAction: action,
    });

    // Clear input and close sheet
    setStageInputs(prev => ({
      ...prev,
      [correctiveActionStage]: { temp: '', time: new Date() }
    }));
    setCorrectiveActionStage(null);
  };

  const getTimerStartTime = (stageId: StageType) => {
    if (stageId === 'to80' || stageId === 'to54') {
      return currentLog.stages.startCooling.time || null;
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {STAGE_CONFIGS.map((stageConfig) => {
        const status = getStageStatus(stageConfig.id);
        const isAccessible = isStageAccessible(stageConfig.id);
        const stageData = currentLog.stages[stageConfig.id];
        const input = stageInputs[stageConfig.id];

        return (
          <div key={stageConfig.id} className={`stage-card ${status}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {stageConfig.name}
                  {stageConfig.isCCP && (
                    <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">
                      CCP1
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600 font-medium">
                  {stageConfig.requirement}
                </p>
              </div>
              {stageConfig.hasDeadline && (
                <TimerBadge
                  startTime={getTimerStartTime(stageConfig.id)}
                  deadlineHours={stageConfig.deadlineHours!}
                  isActive={status === 'active' && getTimerStartTime(stageConfig.id) !== null}
                  isError={status === 'failed'}
                />
              )}
            </div>

            {isAccessible ? (
              <div className="space-y-4">
                {/* Display saved data or input fields */}
                {status === 'completed' || status === 'failed' ? (
                  <div className="bg-white rounded-lg p-4 border-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-2xl font-bold text-gray-900">
                          {stageData.temperature}°F
                        </span>
                        <span className="text-sm text-gray-600 ml-4">
                          at {stageData.time?.toLocaleTimeString()}
                        </span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {status === 'completed' ? '✓ Passed' : '✗ Failed'}
                      </div>
                    </div>
                    {stageData.correctiveAction && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                        <p className="text-sm font-medium text-yellow-800">Corrective Action:</p>
                        <p className="text-sm text-yellow-700">{stageData.correctiveAction}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 mobile:grid-cols-2 ipad:grid-cols-2 gap-4 mobile:gap-6 ipad:gap-8">
                    {/* Temperature Input */}
                    <div>
                      <label className="block text-sm mobile:text-base ipad:text-lg font-medium text-gray-700 mb-2">
                        Temperature
                      </label>
                      <KeypadInput
                        value={input.temp}
                        onChange={(temp) => handleTemperatureChange(stageConfig.id, temp)}
                        placeholder="0"
                      />
                    </div>

                    {/* Time Input */}
                    <div>
                      <label className="block text-sm mobile:text-base ipad:text-lg font-medium text-gray-700 mb-2">
                        Time
                      </label>
                      <input
                        type="time"
                        value={input.time.toTimeString().slice(0, 5)}
                        onChange={(e) => {
                          const [hours, minutes] = e.target.value.split(':');
                          const newTime = new Date();
                          newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
                          handleTimeChange(stageConfig.id, newTime);
                        }}
                        className="w-full px-3 py-2 mobile:px-4 mobile:py-3 ipad:px-6 ipad:py-4 text-base mobile:text-lg ipad:text-xl border-2 border-gray-300 rounded-lg mobile:rounded-xl ipad:rounded-2xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Save Button */}
                {status === 'active' && (
                  <button
                    onClick={() => handleSaveStage(stageConfig.id)}
                    disabled={!input.temp}
                    className="w-full py-3 mobile:py-4 ipad:py-5 bg-blue-600 text-white text-base mobile:text-lg ipad:text-xl font-semibold rounded-lg mobile:rounded-xl ipad:rounded-2xl disabled:bg-gray-400 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
                  >
                    Save Stage
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>Complete previous stages to unlock</p>
              </div>
            )}
          </div>
        );
      })}

      {/* Corrective Action Sheet */}
      <CorrectiveActionSheet
        isOpen={correctiveActionStage !== null}
        stageId={correctiveActionStage}
        onSave={handleCorrectiveActionSave}
        onClose={() => setCorrectiveActionStage(null)}
      />
    </div>
  );
}
