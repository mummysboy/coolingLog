'use client';

import { useEffect, useState } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import type { PaperFormEntry } from '@/lib/paperFormTypes';
import { usePinStore } from '@/stores/pinStore';
import { PaperForm } from '@/components/PaperForm';
import { InitialSelector } from '@/components/InitialSelector';
import { PinAuthModal } from '@/components/PinAuthModal';
import { validateForm, shouldHighlightCell } from '@/lib/validation';

export default function FormPage() {
  const { currentForm, createNewForm, selectedInitial, setSelectedInitial, updateFormStatus, saveForm, savedForms, loadForm } = usePaperFormStore();
  const { isAuthenticated, clearAuthentication } = usePinStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingInitial, setPendingInitial] = useState<string>('');
  const [formUpdateKey, setFormUpdateKey] = useState(0); // Force re-render when form updates
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [lastValidationUpdate, setLastValidationUpdate] = useState<number>(0); // Track when validation last updated status

  // Check if current initial is authenticated
  const isCurrentInitialAuthenticated = selectedInitial ? isAuthenticated(selectedInitial) : false;

  // Effect to handle form loading when initial changes
  useEffect(() => {
    console.log('Form page useEffect triggered:', {
      selectedInitial,
      isCurrentInitialAuthenticated,
      currentFormId: currentForm?.id,
      currentFormInitial: currentForm?.formInitial,
      savedFormsCount: savedForms.length
    });

    if (!selectedInitial) {
      // No initial selected, clear any current form
      console.log('No initial selected, clearing form');
      return;
    }

    if (!isCurrentInitialAuthenticated) {
      // Not authenticated, don't load forms yet
      console.log('Initial not authenticated yet:', selectedInitial);
      return;
    }

    // Clear current form when initial changes to ensure clean state
    if (currentForm && currentForm.formInitial !== selectedInitial) {
      // Force clear the current form when switching to a different initial
      console.log('Switching to different initial, clearing current form');
      setFormUpdateKey(prev => prev + 1);
      return;
    }

    // Load or create form for the current initial
    const loadFormForInitial = async () => {
      console.log('Loading form for initial:', selectedInitial);
      setIsLoadingForm(true);
      
      try {
        // Check if there's a form for today
        const today = new Date();
        const todayString = today.toISOString().split('T')[0];
        
        // Look for an existing form for today
        const existingForm = savedForms.find((form: PaperFormEntry) => {
          const formDateString = form.date.toISOString().split('T')[0];
          return form.formInitial === selectedInitial && formDateString === todayString;
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
          console.log('Creating new form for initial:', selectedInitial);
          createNewForm(selectedInitial);
        }
      } catch (error) {
        console.error('Error loading form for initial:', error);
      } finally {
        setIsLoadingForm(false);
      }
    };

    loadFormForInitial();
  }, [selectedInitial, isCurrentInitialAuthenticated, savedForms, currentForm, createNewForm, loadForm]);

  // NEW: Real-time status monitoring effect
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

  // Handle initial selection with PIN authentication
  const handleInitialChange = (newInitial: string) => {
    console.log('handleInitialChange called:', { newInitial, currentInitial: selectedInitial });
    
    if (newInitial === selectedInitial) return;

    // Clear current form when changing initials to force refresh
    if (currentForm) {
      console.log('Clearing current form for initial change');
      // Reset the current form to trigger a clean state
      setFormUpdateKey(prev => prev + 1);
    }

    // If selecting a new initial, check if it needs authentication
    if (newInitial && !isAuthenticated(newInitial)) {
      console.log('New initial requires authentication:', newInitial);
      setPendingInitial(newInitial);
      setShowPinModal(true);
    } else {
      // Already authenticated or no initial selected
      console.log('Setting new initial (already authenticated):', newInitial);
      setSelectedInitial(newInitial);
    }
  };

  // Handle successful PIN authentication
  const handlePinSuccess = () => {
    setShowPinModal(false);
    setSelectedInitial(pendingInitial);
    setPendingInitial('');
    // Force a refresh after successful authentication
    setFormUpdateKey(prev => prev + 1);
  };

  // Handle PIN authentication cancel
  const handlePinCancel = () => {
    setShowPinModal(false);
    setPendingInitial('');
  };

  // Handle logout from current initial
  const handleLogout = () => {
    if (selectedInitial) {
      clearAuthentication(selectedInitial);
      setSelectedInitial('');
      // Clear current form and force refresh
      setFormUpdateKey(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header with Initial Selector */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Chilling Log Form</h1>
          </div>
          <InitialSelector onInitialChange={handleInitialChange} />
        </div>
      </div>

      {/* Form Content */}
      {!selectedInitial ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-6xl mb-4">👤</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select an Initial</h2>
            <p className="text-gray-600">Please select an initial from the dropdown above to view and manage forms.</p>
          </div>
        </div>
      ) : !isCurrentInitialAuthenticated ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-xl border-2 border-orange-200">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please authenticate with your PIN to access forms for &quot;{selectedInitial}&quot;.</p>
            <button
              onClick={() => {
                setPendingInitial(selectedInitial);
                setShowPinModal(true);
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enter PIN
            </button>
          </div>
        </div>
      ) : isLoadingForm || !currentForm ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Form...</h2>
            <p className="text-gray-600">Please wait while we prepare your form for today.</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4">
          {/* NEW: Real-time Status Indicator */}
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
                  {/* NEW: Show error count when there are validation errors */}
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

      {/* PIN Authentication Modal */}
      <PinAuthModal
        isOpen={showPinModal}
        initials={pendingInitial}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    </div>
  );
}
