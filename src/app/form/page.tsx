'use client';

import { useEffect, useState, useRef } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import type { PaperFormEntry } from '@/lib/paperFormTypes';
import { FormType, getFormTypeDisplayName, getFormTypeDescription, getFormTypeIcon, getFormTypeColors, ensureDate } from '@/lib/paperFormTypes';
import { PaperForm } from '@/components/PaperForm';
import { validateForm, shouldHighlightCell } from '@/lib/validation';

export default function FormPage() {
  const { currentForm, createNewForm, updateFormStatus, saveForm, savedForms, loadForm, deleteForm } = usePaperFormStore();
  const [formUpdateKey, setFormUpdateKey] = useState(0); // Force re-render when form updates
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [lastValidationUpdate, setLastValidationUpdate] = useState<number>(0); // Track when validation last updated status
  const [selectedForm, setSelectedForm] = useState<PaperFormEntry | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isAddFormDropdownOpen, setIsAddFormDropdownOpen] = useState(false); // State for add form dropdown
  const [newlyCreatedFormId, setNewlyCreatedFormId] = useState<string | null>(null); // Track newly created forms

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

  // Function to handle form creation and make it pop out into view
  const handleCreateForm = (formType: FormType) => {
    createNewForm(formType);
    setIsAddFormDropdownOpen(false);
    
    // Mark that we just created a new form
    setNewlyCreatedFormId('pending');
  };

  // Function to open form in modal
  const handleViewForm = (form: PaperFormEntry) => {
    setSelectedForm(form);
    setShowFormModal(true);
  };

  // Function to delete form
  const handleDeleteForm = (formId: string) => {
    const formToDelete = savedForms.find(form => form.id === formId);
    if (!formToDelete) return;

    const formDate = new Date(formToDelete.date).toLocaleDateString();
    const formInitial = formToDelete.formInitial || 'Unknown';
    
    if (confirm(`Are you sure you want to delete Form #${formToDelete.id.slice(-6)}?\n\nForm Details:\n• Date: ${formDate}\n• Initial: ${formInitial}\n• Status: ${formToDelete.status}\n\nThis will permanently delete ALL form data including:\n• All temperature and time entries\n• Thermometer number\n• Ingredients and lot numbers\n• Corrective actions and comments\n• Admin comments\n• Validation errors\n\nThis action cannot be undone.`)) {
      console.log('Deleting form:', formToDelete.id, 'with all associated data');
      
      // Delete the form using the store
      deleteForm(formId);
      
      // If this was the selected form in the modal, close the modal
      if (selectedForm?.id === formId) {
        setShowFormModal(false);
        setSelectedForm(null);
      }
    }
  };

  // Create a default form on page load
  useEffect(() => {
    const loadDefaultForm = async () => {
      console.log('Loading forms from storage');
      setIsLoadingForm(true);
      
      try {
        // Load existing forms from storage but don't create new ones automatically
        // Only show forms that the user has explicitly created
        if (savedForms.length === 0) {
          // If no forms exist, don't create any automatically
          console.log('No forms found - user must create forms manually');
        } else {
          // If forms exist, load the most recent one as current
          const mostRecentForm = savedForms[0]; // Forms are sorted by date, newest first
          if (!currentForm || currentForm.id !== mostRecentForm.id) {
            console.log('Loading most recent form:', mostRecentForm.id);
            loadForm(mostRecentForm.id);
          }
        }
      } catch (error) {
        console.error('Error loading forms:', error);
      } finally {
        setIsLoadingForm(false);
      }
    };

    loadDefaultForm();
  }, [savedForms, currentForm, loadForm]);

  // Automatically open newly created forms
  useEffect(() => {
    if (currentForm && newlyCreatedFormId === 'pending' && !showFormModal) {
      console.log('Automatically opening newly created form:', currentForm.id);
      setSelectedForm(currentForm);
      setShowFormModal(true);
      setNewlyCreatedFormId(currentForm.id); // Mark as opened
    }
  }, [currentForm, newlyCreatedFormId, showFormModal]);

  // Reset newly created form flag when modal is closed
  useEffect(() => {
    if (!showFormModal && newlyCreatedFormId) {
      setNewlyCreatedFormId(null);
    }
  }, [showFormModal, newlyCreatedFormId]);

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
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="flex items-center justify-center w-32 h-32 rounded-xl overflow-hidden">
              <img 
                src="/logo.avif" 
                alt="FoodChillingLog Logo" 
                className="w-full h-full object-cover"
              />
            </div>
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
                      handleCreateForm(FormType.FOOD_CHILLING_LOG);
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
                </div>
              </div>
            )}
          </div>
          
          {/* Load Existing Forms Button */}
          {savedForms.length === 0 && (
            <button
              onClick={async () => {
                try {
                  const { loadFormsFromStorage } = usePaperFormStore.getState();
                  await loadFormsFromStorage();
                  console.log('Existing forms loaded from AWS');
                } catch (error) {
                  console.error('Error loading existing forms:', error);
                  alert('Error loading existing forms. Please try again.');
                }
              }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              title="Load existing forms from AWS"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Load Existing Forms
            </button>
          )}
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
              <p className="text-gray-600 mb-4">Click the &quot;Add Form&quot; button above to create your first form.</p>
              <p className="text-sm text-gray-500">Forms are only created when you explicitly choose to create them.</p>
            </div>
          ) : (
            <>
              {savedForms
                .sort((a: PaperFormEntry, b: PaperFormEntry) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date, newest first
                .map((form: PaperFormEntry, index: number) => (
                <div 
                  key={form.id} 
                  className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6`}
                >
                  <div className={`p-6`}>
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
                            {form.title ? form.title : getFormTypeDisplayName(form.formType)} - {new Date(form.date).toLocaleDateString()}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Form #{form.id.slice(-6)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3">
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
                        
                        {/* View Form Button */}
                        <button
                          onClick={() => handleViewForm(form)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          title="View and edit form details"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Form
                        </button>
                        
                        {/* Delete Form Button */}
                        <button
                          onClick={() => handleDeleteForm(form.id)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors"
                          title="Delete form"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
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
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Form Details Modal - Exactly like admin page */}
      {showFormModal && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-50 rounded-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 bg-white border-b">
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedForm.title ? selectedForm.title : 'Edit Form'} - {new Date(selectedForm.date).toLocaleDateString()}
                </h3>
                <div className="text-sm text-gray-600 mt-1">
                  Status: <span className={`font-medium ${
                    selectedForm.status === 'Complete' ? 'text-green-600' :
                    selectedForm.status === 'In Progress' ? 'text-yellow-600' :
                    'text-orange-600'
                  }`}>
                    {selectedForm.status}
                  </span>

                </div>
              </div>
              <button
                onClick={() => {
                  setShowFormModal(false);
                  setSelectedForm(null);
                  setNewlyCreatedFormId(null); // Reset the flag when closing
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <PaperForm 
                key={`${selectedForm.id}-${formUpdateKey}`}
                formData={selectedForm}
                readOnly={false}
                onFormUpdate={(formId, updates) => {
                  console.log('Form updated in form modal:', formId, updates);
                  // Handle status updates by calling the store's updateFormStatus function
                  if (updates.status) {
                    console.log('Status updated to:', updates.status, 'updating store');
                    updateFormStatus(formId, updates.status);
                    // Track when validation last updated the status
                    setLastValidationUpdate(Date.now());
                    // Ensure the form is saved to persist the status change
                    setTimeout(() => saveForm(), 100);
                  }
                  
                  // Update the selectedForm state to reflect changes
                  if (selectedForm && selectedForm.id === formId) {
                    const updatedForm = { ...selectedForm, ...updates };
                    setSelectedForm(updatedForm);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
