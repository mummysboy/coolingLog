'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePaperFormStore } from '@/stores/paperFormStore';
import type { PaperFormEntry } from '@/lib/paperFormTypes';
import { FormType, getFormTypeDisplayName, getFormTypeDescription, getFormTypeIcon, getFormTypeColors, ensureDate } from '@/lib/paperFormTypes';
import PaperForm from '@/components/PaperForm';
import { PiroshkiForm } from '@/components/PiroshkiForm';
import { validateForm, shouldHighlightCell } from '@/lib/validation';
import BagelDogForm from '@/components/BagelDogForm';
import { generateFormPDF } from '@/lib/pdfGenerator';

// Debug flag for development
const DEBUG_ALLOW_EDIT = false;

export default function FormPage() {
  const { currentForm, createNewForm, updateFormStatus, approveForm, saveForm, savedForms, loadForm, deleteForm, loadFormsFromStorage } = usePaperFormStore();
  const store = usePaperFormStore; // Get store reference for getState()
  const [formUpdateKey, setFormUpdateKey] = useState(0); // Force re-render when form updates
  const [isRefreshingForms, setIsRefreshingForms] = useState(false);

  const [selectedForm, setSelectedForm] = useState<PaperFormEntry | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [isAddFormDropdownOpen, setIsAddFormDropdownOpen] = useState(false);
  const [newlyCreatedFormId, setNewlyCreatedFormId] = useState<string | null>(null);

  // Refs for outside-click detection
  const addFormDropdownRef = useRef<HTMLDivElement>(null);

  // Memoized form lists to avoid repeated filtering/sorting on every render
  const activeForms = useMemo(() => 
    savedForms
      .filter((form: PaperFormEntry) => form.status !== 'Complete' && form.status !== 'Approved')
      .sort((a: PaperFormEntry, b: PaperFormEntry) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [savedForms]
  );

  const completedForms = useMemo(() => 
    savedForms
      .filter((form: PaperFormEntry) => form.status === 'Complete')
      .sort((a: PaperFormEntry, b: PaperFormEntry) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [savedForms]
  );

  const approvedForms = useMemo(() => 
    savedForms
      .filter((form: PaperFormEntry) => form.status === 'Approved')
      .sort((a: PaperFormEntry, b: PaperFormEntry) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [savedForms]
  );

  // Close dropdown when clicking outside using ref
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isAddFormDropdownOpen && addFormDropdownRef.current && !addFormDropdownRef.current.contains(event.target as Node)) {
        setIsAddFormDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAddFormDropdownOpen]);

  // Body scroll lock when modal is open
  useEffect(() => {
    if (showFormModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showFormModal]);

  // Function to handle form creation and return the new ID
  const handleCreateForm = useCallback(async (formType: FormType) => {
    // Set a default initial (can be changed later by the user)
    const defaultInitial = 'USER';
    store.getState().setSelectedInitial(defaultInitial);
    
    // Create the form locally
    createNewForm(formType, defaultInitial);
    setIsAddFormDropdownOpen(false);

    // Try to persist immediately; on failure still open the local form
    try {
      await saveForm();
    } catch (err) {
      console.error('Error saving newly created form to AWS (continuing with local form):', err);
    }

    // Get the newly created form from the store (may have been updated by save)
    const { currentForm } = store.getState();
    if (currentForm) {
      // Store the new form ID to track it (used to auto-open the modal)
      setNewlyCreatedFormId(currentForm.id);
    }
  }, [createNewForm, store]);

  // Function to handle PDF download
  const handleDownloadPDF = useCallback(async (form: PaperFormEntry) => {
    try {
      await generateFormPDF({
        id: form.id,
        title: form.title || getFormTypeDisplayName(form.formType),
        formType: form.formType,
        date: form.date.toISOString(),
        status: form.status,
        approvedBy: form.approvedBy,
        approvedAt: form.approvedAt ? form.approvedAt.toISOString() : undefined,
        correctiveActionsComments: form.correctiveActionsComments,
        thermometerNumber: form.thermometerNumber,
        lotNumbers: form.lotNumbers,
        entries: form.entries,
        quantityAndFlavor: (form as any).quantityAndFlavor,
        preShipmentReview: (form as any).preShipmentReview,
        frankFlavorSizeTable: (form as any).frankFlavorSizeTable,
        bagelDogPreShipmentReview: (form as any).bagelDogPreShipmentReview
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF. Please try again.');
    }
  }, []);

  // Function to handle form printing
  const handlePrintForm = useCallback((form: PaperFormEntry) => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${form.title ? form.title : 'Food Chilling Log'} - Form #${form.id.slice(-6)}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: system-ui, -apple-system, sans-serif;
              background: white;
              padding: 24px;
              color: black;
            }
            .form-container {
              background: white;
              max-width: 1200px;
              margin: 0 auto;
            }
            .header-section {
              border: 2px solid black;
              margin-bottom: 16px;
            }
            .header-title {
              background: #f3f4f6;
              padding: 16px;
              text-align: center;
            }
            .header-title h1 {
              font-size: 20px;
              font-weight: bold;
            }
            .header-content {
              padding: 16px;
            }
            .main-table-container {
              border: 2px solid black;
            }
            .main-table {
              width: 100%;
              border-collapse: collapse;
            }
            .main-table th,
            .main-table td {
              border: 1px solid black;
              padding: 8px;
              text-align: center;
              vertical-align: top;
            }
            .main-table td:first-child {
              text-align: left;
            }
            .main-table thead tr:first-child th {
              background: #f3f4f6;
              font-weight: bold;
              font-size: 13px;
            }
            .main-table thead tr:nth-child(2) th {
              background: #f9fafb;
              font-size: 12px;
              padding: 4px;
            }
            .row-number {
              font-weight: bold;
              font-size: 14px;
            }
            .cell-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 4px;
              font-size: 12px;
            }
            .bottom-section {
              border: 2px solid black;
              border-top: 0;
              display: grid;
              grid-template-columns: 1fr 1fr;
            }
            .left-section {
              border-right: 1px solid black;
            }
            .thermometer-section {
              border-bottom: 1px solid black;
              padding: 8px;
              text-align: center;
              font-weight: bold;
            }
            .ingredients-table {
              width: 100%;
              border-collapse: collapse;
            }
            .ingredients-table th,
            .ingredients-table td {
              border: 1px solid black;
              padding: 4px;
              text-align: center;
              font-size: 12px;
            }
            .right-section {
              padding: 8px;
            }
            .comments-title {
              font-weight: bold;
              margin-bottom: 4px;
            }
            .comments-content {
              min-height: 60px;
              border: 1px solid #d1d5db;
              padding: 4px;
              font-size: 12px;
            }
            @media print {
              body { padding: 0; }
              .form-container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="form-container">
            <div class="header-section">
              <div class="header-title">
                <h1>${form.title ? form.title : getFormTypeDisplayName(form.formType)}</h1>
              </div>
              <div class="header-content">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; font-size: 14px;">
                  <div>
                    <strong>Form ID:</strong> ${form.id}<br>
                    <strong>Date:</strong> ${new Date(form.date).toLocaleDateString()}<br>
                    <strong>Initial:</strong> ${form.formInitial || 'N/A'}
                  </div>
                  <div>
                    <strong>Status:</strong> ${form.status}<br>
                    <strong>Thermometer:</strong> ${form.thermometerNumber || 'N/A'}<br>
                    ${form.approvedBy ? `<strong>Approved by:</strong> ${form.approvedBy}` : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <div class="main-table-container">
              <table class="main-table">
                <thead>
                  <tr>
                    <th rowspan="2">Row</th>
                    <th rowspan="2">Time</th>
                    <th colspan="3">Temperature (°F)</th>
                    <th rowspan="2">Initials</th>
                  </tr>
                  <tr>
                    <th>Beef</th>
                    <th>Chicken</th>
                    <th>Liquid Eggs</th>
                  </tr>
                </thead>
                <tbody>
                  ${form.entries ? form.entries.map((entry, index) => `
                    <tr>
                      <td class="row-number">${index + 1}</td>
                      <td>${entry.time || ''}</td>
                      <td>${entry.beefTemp || ''}</td>
                      <td>${entry.chickenTemp || ''}</td>
                      <td>${entry.liquidEggsTemp || ''}</td>
                      <td>${entry.initials || ''}</td>
                    </tr>
                  `).join('') : ''}
                </tbody>
              </table>
            </div>
            
            <div class="bottom-section">
              <div class="left-section">
                <div class="thermometer-section">
                  Thermometer Number: ${form.thermometerNumber || 'N/A'}
                </div>
                <div style="padding: 8px;">
                  <table class="ingredients-table">
                    <tr>
                      <th>Ingredient</th>
                      <th>Lot Number</th>
                    </tr>
                    <tr>
                      <td>Beef</td>
                      <td>${form.ingredients?.beef || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Chicken</td>
                      <td>${form.ingredients?.chicken || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td>Liquid Eggs</td>
                      <td>${form.ingredients?.liquidEggs || 'N/A'}</td>
                    </tr>
                  </table>
                </div>
              </div>
              <div class="right-section">
                <div class="comments-title">Corrective Actions & comments:</div>
                <div class="comments-content">
                  ${form.correctiveActionsComments || ''}
                </div>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
    }
  }, []);

  // Function to open form in modal - exactly like admin page
  const handleViewForm = (form: PaperFormEntry) => {
    // Load the authoritative form data into the store first so the modal shows the same title
    (async () => {
      try {
        await loadForm(form.id);
        // Prefer the freshly loaded currentForm from the store (may include computed/filled title)
        const loaded = (usePaperFormStore as any).getState().currentForm as PaperFormEntry | null;
        setSelectedForm(loaded || form);
      } catch (err) {
        // Fallback to the provided form if loading fails
        setSelectedForm(form);
        console.error('Failed to load form for view, falling back to provided object', err);
      }
      setShowFormModal(true);
    })();
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

  // Function to save a specific form to AWS
  const handleSaveFormToAWS = useCallback(async (formId: string) => {
    try {
      // Load the specific form first
      await loadForm(formId);
      // Then save it
      await saveForm();
      alert('Form saved successfully to AWS DynamoDB!');
    } catch (error) {
      console.error('Error saving form:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Error saving form: ${errorMessage}`);
    }
  }, [loadForm, saveForm]);

  // Load forms from AWS when form page loads - exactly like admin page
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Form page: Loading data from AWS...');
        
        // Load forms
        await loadFormsFromStorage();
        console.log('Form page: Forms loaded successfully');
        
        // Debug: Check data count after loading
        const { savedForms } = usePaperFormStore.getState();
    
        console.log(`Form page: After loading, savedForms count: ${savedForms.length}`);
        
      } catch (error) {
        console.error('Form page: Error loading data from AWS:', error);
        // No fallback to local storage - AWS is required
      }
    };
    
    loadData();
  }, [loadFormsFromStorage]);

  // Automatically open newly created forms and manage the flag
  useEffect(() => {
    // Check if the newly created form ID has appeared in savedForms
    if (newlyCreatedFormId && newlyCreatedFormId !== 'pending' && savedForms.some(form => form.id === newlyCreatedFormId)) {
      const formToOpen = savedForms.find(form => form.id === newlyCreatedFormId);
      if (formToOpen && !showFormModal) {
        console.log('Automatically opening newly created form:', newlyCreatedFormId);
        setSelectedForm(formToOpen);
        setShowFormModal(true);
        // Clear the flag after opening
        setNewlyCreatedFormId(null);
      }
    }
    
    // Reset the flag when modal is closed
    if (!showFormModal && newlyCreatedFormId) {
      setNewlyCreatedFormId(null);
    }
  }, [newlyCreatedFormId, savedForms, showFormModal]);

  // Enhanced form update handler
  const handleFormUpdate = useCallback((formId: string, updates: Partial<PaperFormEntry>) => {
    console.log('Form updated in form modal:', formId, updates);
    
    // Handle status updates by calling the store's updateFormStatus function
    if (updates.status) {
      console.log('Status updated to:', updates.status, 'updating store');
      updateFormStatus(formId, updates.status);
      
      // Force a re-render of the form list by updating the formUpdateKey
      setFormUpdateKey(prev => prev + 1);
    }
    
    // Update the selectedForm state to reflect changes
    if (selectedForm && selectedForm.id === formId) {
      const updatedForm = { ...selectedForm, ...updates } as PaperFormEntry;
      setSelectedForm(updatedForm);
      console.log('SelectedForm updated to:', updatedForm.status);
    }
  }, [updateFormStatus, selectedForm]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="flex items-center justify-center w-32 h-32 rounded-xl overflow-hidden">
              <Image 
                src="/logo.avif" 
                alt="FoodChillingLog Logo" 
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* NEW: Navigation and Add Form Section */}
          <div className="flex items-center space-x-4">
            <button
              onClick={async () => {
                setIsRefreshingForms(true);
                try {
                  await loadFormsFromStorage();
                } catch (err) {
                  console.error('Refresh failed', err);
                } finally {
                  setIsRefreshingForms(false);
                  setFormUpdateKey(k => k + 1);
                }
              }}
              disabled={isRefreshingForms}
              aria-label="Refresh forms"
              title="Refresh forms"
              className={`inline-flex items-center px-3 py-2 border rounded-lg shadow-sm text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${isRefreshingForms ? 'bg-gray-100 text-gray-600 cursor-not-allowed opacity-80' : 'bg-white text-gray-800 hover:bg-gray-50'}`}
            >
              <span className="flex items-center space-x-2">
                <svg className={`w-5 h-5 text-gray-600 ${isRefreshingForms ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M12 4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M20.07 7.93A10 10 0 1112 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{isRefreshingForms ? 'Refreshing...' : 'Refresh'}</span>
              </span>
            </button>
            {/* Add Form Button with Dropdown */}
            <div className="relative" ref={addFormDropdownRef}>
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
                <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => {
                        handleCreateForm(FormType.COOKING_AND_COOLING);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 ${getFormTypeColors(FormType.COOKING_AND_COOLING).bg} rounded-lg flex items-center justify-center mr-3`}>
                          <span className={`text-lg ${getFormTypeColors(FormType.COOKING_AND_COOLING).text}`}>
                            {getFormTypeIcon(FormType.COOKING_AND_COOLING)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{getFormTypeDisplayName(FormType.COOKING_AND_COOLING)}</div>
                          <div className="text-xs text-gray-500">{getFormTypeDescription(FormType.COOKING_AND_COOLING)}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleCreateForm(FormType.PIROSHKI_CALZONE_EMPANADA);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 ${getFormTypeColors(FormType.PIROSHKI_CALZONE_EMPANADA).bg} rounded-lg flex items-center justify-center mr-3`}>
                          <span className={`text-lg ${getFormTypeColors(FormType.PIROSHKI_CALZONE_EMPANADA).text}`}>
                            {getFormTypeIcon(FormType.PIROSHKI_CALZONE_EMPANADA)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{getFormTypeDisplayName(FormType.PIROSHKI_CALZONE_EMPANADA)}</div>
                          <div className="text-xs text-gray-500">{getFormTypeDescription(FormType.PIROSHKI_CALZONE_EMPANADA)}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleCreateForm(FormType.BAGEL_DOG_COOKING_COOLING);
                      }}
                      className={`block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 ${getFormTypeColors(FormType.BAGEL_DOG_COOKING_COOLING).bg} rounded-lg flex items-center justify-center mr-3`}>
                          <span className={`text-lg ${getFormTypeColors(FormType.BAGEL_DOG_COOKING_COOLING).text}`}>
                            {getFormTypeIcon(FormType.BAGEL_DOG_COOKING_COOLING)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{getFormTypeDisplayName(FormType.BAGEL_DOG_COOKING_COOLING)}</div>
                          <div className="text-xs text-gray-500">{getFormTypeDescription(FormType.BAGEL_DOG_COOKING_COOLING)}</div>
                        </div>
                      </div>
                    </button>
                  
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Content */}
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
            {/* Active Forms Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Active Forms
              </h2>
              {activeForms.map((form: PaperFormEntry, index: number) => (
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
                              {form.title ? form.title : getFormTypeDisplayName(form.formType)}
                            </h3>
                            <div className="text-sm text-gray-600 mt-1">
                              {getFormTypeDisplayName(form.formType)}
                            </div>
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
                          <div className="font-medium text-gray-700">Date Created</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {new Date(form.dateCreated || form.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {new Date(form.dateCreated || form.date).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-700">Last Updated</div>
                          <div className="text-lg font-semibold text-gray-900">
                            {form.lastTextEntry ? new Date(form.lastTextEntry).toLocaleDateString() : 'No text entered yet'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {form.lastTextEntry ? new Date(form.lastTextEntry).toLocaleTimeString() : ''}
                          </div>
                        </div>
                        
                        {/* Corrective Actions and Comments - Always shown */}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-700">Corrective Actions & Comments</div>
                          <div className="text-sm text-gray-600 mt-1">
                            <textarea
                              readOnly
                              className="w-full h-20 p-2 text-sm text-gray-700 bg-white border rounded-md resize-none"
                              value={form.correctiveActionsComments && form.correctiveActionsComments.trim() ?
                                form.correctiveActionsComments.split('\n').map((l, i) => `${i+1}. ${l}`).join('\n') : '(no comments)'}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              
              {/* No Active Forms Message */}
              {activeForms.length === 0 && (
                <div className="text-center py-8 bg-white rounded-xl border-2 border-gray-200">
                  <div className="text-4xl mb-3">✅</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">All Forms Completed!</h3>
                  <p className="text-gray-600">Great job! All your forms have been marked as complete.</p>
                </div>
              )}
            </div>

            {/* Completed Forms Section */}
            {completedForms.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Completed Forms
                </h2>
                
                {completedForms.map((form: PaperFormEntry, index: number) => (
                    <div 
                      key={form.id} 
                      className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6`}
                    >
                      <div className={`p-6`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            {/* Form Info */}
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                {form.title ? form.title : getFormTypeDisplayName(form.formType)}
                              </h3>
                              <div className="text-sm text-gray-600 mt-1">
                                {getFormTypeDisplayName(form.formType)}
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                                <span>Form #{form.id.slice(-6)}</span>
                                <span className="text-gray-600 font-medium">✓ Finalized</span>
                                {form.approvedBy && (
                                  <span className="ml-2 text-indigo-600 text-sm">Approved by {form.approvedBy}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            {/* Status Badge */}
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                              ✓ Complete
                            </span>
                            
                                                                                  {/* Download PDF Button */}
                            <button
                              onClick={() => handleDownloadPDF(form)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:text-green-700 transition-colors"
                              title="Download form as PDF"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              Download PDF
                            </button>

                            {/* Print Button */}
                            <button
                              onClick={() => handlePrintForm(form)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors"
                              title="Print form"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print
                            </button>

                          {/* Print Button */}
                          <button
                            onClick={() => handlePrintForm(form)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors"
                            title="Print form"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Print
                          </button>
                            
                            {/* View Form Button - Read Only */}
                            <button
                              onClick={() => handleViewForm(form)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                              title="View completed form (read-only)"
                            >
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Form
                            </button>
                            
                            {/* Approval is handled from Admin UI; remove approve button from /form page */}
                          </div>
                        </div>
                        
                        {/* Additional Form Summary Info */}
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium text-gray-700">Date Created</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {new Date(form.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {new Date(form.date).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium text-gray-700">Completion Date</div>
                            <div className="text-lg font-semibold text-gray-900">
                              {new Date(form.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {new Date(form.date).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          {/* Corrective Actions and Comments - Always shown */}
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="font-medium text-gray-700">Corrective Actions & Comments</div>
                            <div className="text-sm text-gray-600 mt-1">
                              <textarea
                                readOnly
                                className="w-full h-20 p-2 text-sm text-gray-700 bg-white border rounded-md resize-none"
                                value={form.correctiveActionsComments && form.correctiveActionsComments.trim() ?
                                  form.correctiveActionsComments.split('\n').map((l, i) => `${i+1}. ${l}`).join('\n') : '(no comments)'}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
            {/* Approved Forms Section */}
            {approvedForms.length > 0 && (
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approved Forms
                </h2>

                {approvedForms.map((form: PaperFormEntry) => (
                  <div key={form.id} className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6`}>
                    <div className={`p-6`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{form.title ? form.title : getFormTypeDisplayName(form.formType)}</h3>
                            <div className="text-sm text-gray-600 mt-1">{getFormTypeDisplayName(form.formType)}</div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>Form #{form.id.slice(-6)}</span>
                              {form.approvedBy && (
                                <span className="text-sm text-indigo-600 font-medium">Approved by {form.approvedBy}{form.approvedAt ? ` • ${new Date(form.approvedAt).toLocaleString()}` : ''}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <div className="flex flex-col items-end text-sm text-gray-600">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">✓ Approved</span>
                            {form.approvedBy && (
                              <span className="text-xs text-indigo-700 mt-1">By {form.approvedBy}{form.approvedAt ? ` • ${new Date(form.approvedAt).toLocaleString()}` : ''}</span>
                            )}
                          </div>
                          
                          {/* Download PDF Button */}
                          <button
                            onClick={() => handleDownloadPDF(form)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:text-green-700 transition-colors"
                            title="Download form as PDF"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                          </button>
                          
                          <button
                            onClick={() => handleViewForm(form)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            title="View approved form (read-only)"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Form
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

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
                    selectedForm.status === 'Approved' ? 'text-indigo-600' :
                    selectedForm.status === 'Complete' ? 'text-green-600' :
                    selectedForm.status === 'In Progress' ? 'text-yellow-600' :
                    'text-orange-600'
                  }`}>
                    {selectedForm.status}
                  </span>
                  {(selectedForm.status === 'Complete' || selectedForm.status === 'Approved') && (
                    <span className={`ml-2 font-medium ${selectedForm.status === 'Approved' ? 'text-indigo-600' : 'text-green-600'}`}>(Read-Only)</span>
                  )}
                  {DEBUG_ALLOW_EDIT && (
                    <div className="mt-1 text-orange-600 font-medium">
                      ⚠️ Debug mode: Forms are editable regardless of status
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={async () => {
                  // Auto-save form to AWS when closing modal
                  try {
                    console.log('Modal closing - auto-saving form to AWS');
                    await saveForm();
                    console.log('Form auto-saved successfully to AWS');
                  } catch (error) {
                    console.error('Error auto-saving form when closing modal:', error);
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    alert(`Warning: Form could not be auto-saved: ${errorMessage}`);
                  }
                  
                  // Close the modal
                  setShowFormModal(false);
                  setSelectedForm(null);
                  setNewlyCreatedFormId(null); // Reset the flag when closing
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
                title="Close and save form to AWS"
                aria-label="Close modal and save form to AWS"
              >
                ✕
              </button>
              
              {/* Temporary button to reset form status */}
              {selectedForm.status === 'Complete' && DEBUG_ALLOW_EDIT && (
                <button
                  onClick={() => {
                    if (confirm('Reset form status from Complete to In Progress? This will allow editing.')) {
                      updateFormStatus(selectedForm.id, 'In Progress');
                      // Update the local state
                      setSelectedForm({ ...selectedForm, status: 'In Progress' });
                      // Force re-render
                      setFormUpdateKey(prev => prev + 1);
                    }
                  }}
                  className="ml-2 px-3 py-1 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
                  title="Reset form status to allow editing"
                  aria-label="Reset form status to In Progress"
                >
                  Reset Status
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {selectedForm.formType === FormType.PIROSHKI_CALZONE_EMPANADA ? (
                <PiroshkiForm 
                  key={`${selectedForm.id}-${formUpdateKey}`}
                  formData={selectedForm}
                  readOnly={(selectedForm.status === 'Complete' || selectedForm.status === 'Approved') && !DEBUG_ALLOW_EDIT}
                  onFormUpdate={handleFormUpdate}
                />
              ) : (
                <PaperForm 
                  key={`${selectedForm.id}-${formUpdateKey}`}
                  formId={selectedForm.id}
                  readOnly={(selectedForm.status === 'Complete' || selectedForm.status === 'Approved') && !DEBUG_ALLOW_EDIT}
                  onFormUpdate={handleFormUpdate}
                />
              )}
              
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
