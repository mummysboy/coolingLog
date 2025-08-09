'use client';

import { useLogStore } from '@/stores/logStore';
import { STAGE_CONFIGS } from '@/lib/types';

export function StickyToolbar() {
  const { currentLog, advanceToNextStage, saveLog, submitForReview } = useLogStore();

  if (!currentLog) return null;

  const currentStageIndex = STAGE_CONFIGS.findIndex(s => s.id === currentLog.currentStage);
  const currentStageData = currentLog.stages[currentLog.currentStage];
  const isCurrentStageComplete = currentStageData.temperature !== undefined && 
                                currentStageData.time !== undefined;
  const isLastStage = currentStageIndex === STAGE_CONFIGS.length - 1;
  const isLogComplete = currentLog.isComplete;

  // Check if basic info is filled
  const hasBasicInfo = currentLog.product && currentLog.thermometerNumber && currentLog.lotNumber;
  
  // Check if all stages are complete
  const allStagesComplete = Object.values(currentLog.stages).every(stage => 
    stage.temperature !== undefined && stage.time !== undefined
  );

  const handleNextStage = () => {
    if (isCurrentStageComplete) {
      advanceToNextStage();
      saveLog(); // Save progress
    }
  };

  const handleSaveLog = () => {
    saveLog();
    alert('Log saved successfully!');
  };

  const handleSubmitForReview = () => {
    if (allStagesComplete) {
      submitForReview();
      saveLog();
      alert('Log submitted for review!');
    }
  };

  const handleCompleteLog = () => {
    // Mark as complete and save
    const { updateLogField } = useLogStore.getState();
    updateLogField('isComplete', true);
    updateLogField('completedAt', new Date());
    saveLog();
    alert('Log completed successfully!');
  };

  if (!hasBasicInfo) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-40">
        <div className="px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">!</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    Complete product information to begin logging stages
                  </p>
                  <p className="text-sm text-yellow-700">
                    Please fill in Product, Thermometer #, and Lot # above
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg z-40">
      <div className="px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">
                Stage {currentStageIndex + 1} of {STAGE_CONFIGS.length}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              {STAGE_CONFIGS[currentStageIndex]?.name}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {/* Save Progress Button */}
            <button
              onClick={handleSaveLog}
              className="touch-target px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
            >
              Save Progress
            </button>

            {/* Action Buttons */}
            {!isLogComplete ? (
              <div className="flex space-x-3">
                {/* Next Stage Button */}
                {!allStagesComplete ? (
                  <button
                    onClick={handleNextStage}
                    disabled={!isCurrentStageComplete}
                    className={`touch-target px-6 py-3 rounded-xl font-medium transition-colors ${
                      isCurrentStageComplete
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {isLastStage ? 'Complete Stages' : 'Next Stage'}
                  </button>
                ) : (
                  /* Submit for Review Button */
                  <button
                    onClick={handleSubmitForReview}
                    disabled={currentLog.requiresReview}
                    className={`touch-target px-6 py-3 rounded-xl font-medium transition-colors ${
                      !currentLog.requiresReview
                        ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                        : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    }`}
                  >
                    {currentLog.requiresReview ? 'Pending Review' : 'Submit for Review'}
                  </button>
                )}

                {/* Complete Log Button (only if approved or no review required) */}
                {allStagesComplete && (currentLog.isApproved === true || !currentLog.requiresReview) && (
                  <button
                    onClick={handleCompleteLog}
                    className="touch-target px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
                  >
                    Complete Log
                  </button>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <div className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                  ✓ Log Complete
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="touch-target px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  New Log
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${((currentStageIndex + (isCurrentStageComplete ? 1 : 0)) / STAGE_CONFIGS.length) * 100}%`
            }}
          ></div>
        </div>
      </div>
    </div>
  );
}
