'use client';

import { useEffect, useState } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import type { PaperFormEntry } from '@/lib/paperFormTypes';
import { FormType, getFormTypeDisplayName, getFormTypeDescription, getFormTypeIcon, getFormTypeColors } from '@/lib/paperFormTypes';
import { PaperForm } from '@/components/PaperForm';
import { validateForm, shouldHighlightCell } from '@/lib/validation';

export default function FormPage() {
  const { currentForm, createNewForm, updateFormStatus, saveForm, savedForms, loadForm } = usePaperFormStore();
  const [formUpdateKey, setFormUpdateKey] = useState(0); // Force re-render when form updates
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [lastValidationUpdate, setLastValidationUpdate] = useState<number>(0); // Track when validation last updated status
  const [isFormExpanded, setIsFormExpanded] = useState(false); // New state for expandable form
  const [isAddFormDropdownOpen, setIsAddFormDropdownOpen] = useState(false); // State for add form dropdown
  const [expandedForms, setExpandedForms] = useState<Set<string>>(new Set()); // Track which forms are expanded

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isAddFormDropdownOpen && !target.closest('.add-form-dropdown')) {
        setIsAddFormDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddFormDropdownOpen]);

  // Function to toggle form expansion
  const toggleFormExpanded = (formId: string) => {
    setExpandedForms(prev => {
      const newSet = new Set(prev);
      if (newSet.has(formId)) {
        newSet.delete(formId);
      } else {
        newSet.add(formId);
      }
      return newSet;
    });
  };

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
          createNewForm(FormType.FOOD_CHILLING_LOG, 'USER'); // Use a default initial
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Chilling Log Form</h1>
          </div>
          
          {/* Add Form Button with Dropdown */}
          <div className="relative add-form-dropdown">
            <button
              onClick={() => setIsAddFormDropdownOpen(!isAddFormDropdownOpen)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Form
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            {isAddFormDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10 add-form-dropdown">
                <div className="py-1" role="menu" aria-orientation="vertical">
                  <button
                    onClick={() => {
                      createNewForm(FormType.FOOD_CHILLING_LOG);
                      setIsAddFormDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 ${getFormTypeColors(FormType.FOOD_CHILLING_LOG).hover} hover:text-gray-900`}
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 ${getFormTypeColors(FormType.FOOD_CHILLING_LOG).bg} rounded-lg flex items-center justify-center mr-3`}>
                        <svg className={`w-4 h-4 ${getFormTypeColors(FormType.FOOD_CHILLING_LOG).text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getFormTypeIcon(FormType.FOOD_CHILLING_LOG)} />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">{getFormTypeDisplayName(FormType.FOOD_CHILLING_LOG)}</div>
                        <div className="text-xs text-gray-500">{getFormTypeDescription(FormType.FOOD_CHILLING_LOG)}</div>
                      </div>
                    </div>
                  </button>
                  
                  {/* Placeholder for future form types */}
                  <div className="px-4 py-2 text-xs text-gray-400 border-t border-gray-100">
                    More form types coming soon...
                  </div>
                  
                  {/* Example of how to add a new form type:
                  <button
                    onClick={() => {
                      createNewForm(FormType.TEMPERATURE_LOG);
                      setIsAddFormDropdownOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm text-gray-700 ${getFormTypeColors(FormType.TEMPERATURE_LOG).hover} hover:text-gray-900`}
                    role="menuitem"
                  >
                    <div className="flex items-center">
                      <div className={`w-8 h-8 ${getFormTypeColors(FormType.TEMPERATURE_LOG).bg} rounded-lg flex items-center justify-center mr-3`}>
                        <svg className={`w-4 h-4 ${getFormTypeColors(FormType.TEMPERATURE_LOG).text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getFormTypeIcon(FormType.TEMPERATURE_LOG)} />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">{getFormTypeDisplayName(FormType.TEMPERATURE_LOG)}</div>
                        <div className="text-xs text-gray-500">{getFormTypeDescription(FormType.TEMPERATURE_LOG)}</div>
                      </div>
                    </div>
                  </button>
                  */}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Form Content */}
      {isLoadingForm ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Form...</h2>
            <p className="text-gray-600">Please wait while we prepare your form for today.</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4">
          {/* Display all forms */}
          {savedForms.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
              <div className="text-6xl mb-4">📝</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Forms Yet</h2>
              <p className="text-gray-600">Click the &quot;Add Form&quot; button above to create your first form.</p>
            </div>
          ) : (
            savedForms
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date, newest first
              .map((form, index) => (
              <div key={form.id} className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6">
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleFormExpanded(form.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Status Indicator */}
                      <div className={`w-4 h-4 rounded-full ${
                        form.status === 'Complete' ? 'bg-green-500' :
                        form.status === 'Error' ? 'bg-red-500' :
                        'bg-yellow-500'
                      }`}></div>
                      
                      {/* Form Info */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getFormTypeDisplayName(form.formType)} - {new Date(form.date).toLocaleDateString()}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <span>Form #{form.id.slice(-6)}</span>
                          <span>•</span>
                          <span>Initial: {form.formInitial || 'Not set'}</span>
                          <span>•</span>
                          <span>Thermometer: {form.thermometerNumber || 'Not set'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expand/Collapse Indicator */}
                    <div className="flex items-center space-x-3">
                      {/* New Badge - Show on the first form (newest) */}
                      {index === 0 && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          ✨ New
                        </span>
                      )}
                      
                      {/* Status Badge */}
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        form.status === 'Complete' ? 'bg-green-100 text-green-800' :
                        form.status === 'Error' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {form.status === 'Complete' ? '✓ Complete' :
                         form.status === 'Error' ? '⚠️ Has Errors' :
                         '⏳ In Progress'}
                      </span>
                      
                      {/* Expand/Collapse Arrow */}
                      <svg 
                        className={`w-5 h-5 text-gray-400 transition-transform ${expandedForms.has(form.id) ? 'rotate-180' : ''}`}
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Additional Form Summary Info */}
                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-700">Entries with Data</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {form.entries.filter(entry => 
                          entry.type || 
                          entry.ccp1.temp || 
                          entry.ccp2.temp || 
                          entry.coolingTo80.temp || 
                          entry.coolingTo54.temp || 
                          entry.finalChill.temp
                        ).length} / {form.entries.length}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-700">Last Updated</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {new Date().toLocaleTimeString()}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="font-medium text-gray-700">Real-time Monitoring</div>
                      <div className="flex items-center text-green-600">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                        <span className="text-sm">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Expanded Form Content */}
                {expandedForms.has(form.id) && (
                  <div className="border-t border-gray-200">
                    {/* Real-time Status Indicator */}
                    <div className="bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            form.status === 'Complete' ? 'bg-green-500' :
                            form.status === 'Error' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}></div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Form Status</h3>
                            <p className={`text-sm font-medium ${
                              form.status === 'Complete' ? 'text-green-600' :
                              form.status === 'Error' ? 'text-red-600' :
                              'text-yellow-600'
                            }`}>
                              {form.status === 'Complete' ? '✓ Complete' :
                               form.status === 'Error' ? '⚠️ Has Errors' :
                               '⏳ In Progress'}
                            </p>
                            {/* Show error count when there are validation errors */}
                            {form.status === 'Error' && (() => {
                              let errorCount = 0;
                              form.entries.forEach((entry, rowIndex) => {
                                const stages = ['ccp1', 'ccp2', 'coolingTo80', 'coolingTo54', 'finalChill'];
                                stages.forEach(stage => {
                                  const stageData = entry[stage as keyof typeof entry] as any;
                                  // Only count errors for cells that have all three fields
                                  if (stageData && stageData.temp && stageData.time && stageData.initial) {
                                    const validation = shouldHighlightCell(form, rowIndex, `${stage}.temp`);
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
                    
                    {/* The Actual Form */}
                    <div className="p-4">
                      <PaperForm 
                        key={`${form.id}-${formUpdateKey}`}
                        formData={form}
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
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
