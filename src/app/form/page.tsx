'use client';

import { useEffect, useState } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import type { PaperFormEntry } from '@/lib/paperFormTypes';
import { PaperForm } from '@/components/PaperForm';
import { validateForm, shouldHighlightCell } from '@/lib/validation';

export default function FormPage() {
  const { currentForm, createNewForm, updateFormStatus, saveForm, savedForms, loadForm } = usePaperFormStore();
  const [formUpdateKey, setFormUpdateKey] = useState(0); // Force re-render when form updates
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [lastValidationUpdate, setLastValidationUpdate] = useState<number>(0); // Track when validation last updated status

  // Create a default form on page load
  useEffect(() => {
    const loadDefaultForm = async () => {
      console.log('Loading default form');
      setIsLoadingForm(true);
      
      try {
        // Check if there's a form for today
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        // Look for an existing form for today
        const existingForm = savedForms.find((form: PaperFormEntry) => {
          const formDateString = form.date.toISOString().split('T')[0];
          return formDateString === todayString;
        });
        
        if (existingForm) {
          // Load the existing form for today
          console.log('Found existing form for today:', existingForm.id);
          console.log('Form status:', existingForm.status, 'Resolved errors:', existingForm.resolvedErrors?.length || 0);
          
          if (!currentForm || currentForm.id !== existingForm.id) {
            loadForm(existingForm.id);
          }
        } else if (!currentForm) {
          // Create a new form for today if none exists
          console.log('Creating new form for today');
          createNewForm('USER'); // Use a default initial
        }
      } catch (error) {
        console.error('Error loading form:', error);
      } finally {
        setIsLoadingForm(false);
      }
    };

    loadDefaultForm();
  }, [savedForms, currentForm, createNewForm, loadForm]);

  // Real-time status monitoring effect
  useEffect(() => {
    if (!currentForm) return;

    // Function to check and update form status based on validation
    const checkAndUpdateStatus = () => {
      // Only check for errors when all three fields (temp, time, initial) are complete for a cell
      let hasErrors = false;
      let hasCompleteEntries = false;
      
      currentForm.entries.forEach((entry, rowIndex) => {
        const stages = ['ccp1', 'ccp2', 'coolingTo80', 'coolingTo54', 'finalChill'];
        
        stages.forEach(stage => {
          const stageData = entry[stage as keyof typeof entry] as any;
          
          // Only validate if all three fields are present
          if (stageData && stageData.temp && stageData.time && stageData.initial) {
            hasCompleteEntries = true;
            
            // Check if this specific cell has validation errors
            const validation = shouldHighlightCell(currentForm, rowIndex, `${stage}.temp`);
            if (validation.highlight && validation.severity === 'error') {
              // Get the full validation to find the error message
              const fullValidation = validateForm(currentForm);
              const cellError = fullValidation.errors.find(
                error => error.rowIndex === rowIndex && error.field === `${stage}.temp`
              );
              
              if (cellError) {
                // Check if this error has been resolved by admin
                const errorId = `${rowIndex}-${stage}.temp-${cellError.message}`;
                const isResolved = currentForm.resolvedErrors?.includes(errorId);
                
                if (!isResolved) {
                  hasErrors = true;
                }
              }
            }
          }
        });
      });

      let newStatus: 'Complete' | 'In Progress' | 'Error';
      
      if (hasErrors) {
        newStatus = 'Error';
      } else if (hasCompleteEntries) {
        // Check if all entries that have data are complete
        const completeEntries = currentForm.entries.filter(entry => {
          const stages = ['ccp1', 'ccp2', 'coolingTo80', 'coolingTo54', 'finalChill'];
          return stages.every(stage => {
            const stageData = entry[stage as keyof typeof entry] as any;
            return stageData && stageData.temp && stageData.time && stageData.initial;
          });
        }).length;
        
        if (completeEntries === currentForm.entries.length && currentForm.entries.length > 0) {
          newStatus = 'Complete';
        } else {
          newStatus = 'In Progress';
        }
      } else {
        newStatus = 'In Progress';
      }

      // Only update if status has changed and we're not overriding a manually set 'Complete' status
      // Also don't override if admin has resolved errors and set status to 'In Progress'
      // Also don't override if validation just updated the status (within last 5 seconds)
      const adminHasResolvedErrors = currentForm.resolvedErrors && currentForm.resolvedErrors.length > 0;
      const shouldRespectAdminResolution = adminHasResolvedErrors && currentForm.status === 'In Progress';
      const validationRecentlyUpdated = Date.now() - lastValidationUpdate < 5000; // 5 seconds
      
      if (newStatus !== currentForm.status && currentForm.status !== 'Complete' && !shouldRespectAdminResolution && !validationRecentlyUpdated) {
        console.log('Real-time status update: Form', currentForm.id, 'status changed from', currentForm.status, 'to', newStatus);
        updateFormStatus(currentForm.id, newStatus);
        
        // Save the form to persist the status change
        setTimeout(() => saveForm(), 100);
      } else if (shouldRespectAdminResolution) {
        console.log('Skipping status update: Admin has resolved errors and set status to In Progress');
      } else if (validationRecentlyUpdated) {
        console.log('Skipping status update: Validation recently updated status, respecting that update');
      }
    };

    // Check status immediately
    checkAndUpdateStatus();

    // Set up an interval to check status every few seconds while form is being edited
    const statusCheckInterval = setInterval(checkAndUpdateStatus, 1000);

    return () => {
      clearInterval(statusCheckInterval);
    };
  }, [currentForm, updateFormStatus, saveForm]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Chilling Log Form</h1>
        </div>
      </div>

      {/* Form Content */}
      {isLoadingForm || !currentForm ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Form...</h2>
            <p className="text-gray-600">Please wait while we prepare your form for today.</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4">
          {/* Real-time Status Indicator */}
          <div className="mb-6 bg-white rounded-xl border-2 border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${
                  currentForm.status === 'Complete' ? 'bg-green-500' :
                  currentForm.status === 'Error' ? 'bg-red-500' :
                  'bg-yellow-500'
                }`}></div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Form Status</h3>
                  <p className={`text-sm font-medium ${
                    currentForm.status === 'Complete' ? 'text-green-600' :
                    currentForm.status === 'Error' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {currentForm.status === 'Complete' ? '✓ Complete' :
                     currentForm.status === 'Error' ? '⚠️ Has Errors' :
                     '⏳ In Progress'}
                  </p>
                  {/* Show error count when there are validation errors */}
                  {currentForm.status === 'Error' && (() => {
                    let errorCount = 0;
                    currentForm.entries.forEach((entry, rowIndex) => {
                      const stages = ['ccp1', 'ccp2', 'coolingTo80', 'coolingTo54', 'finalChill'];
                      stages.forEach(stage => {
                        const stageData = entry[stage as keyof typeof entry] as any;
                        // Only count errors for cells that have all three fields
                        if (stageData && stageData.temp && stageData.time && stageData.initial) {
                          const validation = shouldHighlightCell(currentForm, rowIndex, `${stage}.temp`);
                          if (validation.highlight && validation.severity === 'error') {
                            errorCount++;
                          }
                        }
                      });
                    });
                    return errorCount > 0 ? (
                      <p className="text-xs text-red-600 mt-1">
                        {errorCount} validation error{errorCount !== 1 ? 's' : ''} found
                      </p>
                    ) : null;
                  })()}
                </div>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div>Real-time monitoring active</div>
                <div>Last updated: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
          
          <PaperForm 
            key={formUpdateKey}
            formData={currentForm}
            readOnly={false}
            onFormUpdate={(formId, updates) => {
              console.log('Form updated in form page:', formId, updates);
              // Handle status updates by calling the store's updateFormStatus function
              if (updates.status) {
                console.log('Status updated to:', updates.status, 'updating store');
                updateFormStatus(formId, updates.status);
                // Track when validation last updated the status
                setLastValidationUpdate(Date.now());
                // Ensure the form is saved to persist the status change
                setTimeout(() => saveForm(), 100);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
