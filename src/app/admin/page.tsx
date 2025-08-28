'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { usePinStore } from '@/stores/pinStore';
import { MOCK_USERS } from '@/lib/types';
import { PaperFormEntry, FormType, getFormTypeDisplayName, getFormTypeIcon, getFormTypeColors } from '@/lib/paperFormTypes';
import PaperForm from '@/components/PaperForm';
import { generateFormPDF } from '@/lib/pdfGenerator';
import { PiroshkiForm } from '@/components/PiroshkiForm';
import BagelDogForm from '@/components/BagelDogForm';
import { shouldHighlightCell } from '@/lib/validation';


export default function AdminDashboard() {
  const { savedForms, currentForm, loadForm, loadFormsFromStorage, updateFormStatus, approveForm, deleteForm, isFormBlank, exportState, syncFormsToAWS, saveForm } = usePaperFormStore();

  const { createPin, updatePin, deletePin, getAllPins, getPinForInitials } = usePinStore();
  const [selectedForm, setSelectedForm] = useState<PaperFormEntry | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // Simple form update handler that only updates local state (no auto-saving)
  const handleFormUpdate = useCallback((formId: string, updates: Partial<PaperFormEntry>) => {
    console.log('Admin form updated:', formId, updates);
    
    // Only auto-save status changes (like 'Complete') - same as form page
    if (updates.status) {
      console.log('Status updated to:', updates.status, 'updating store');
      updateFormStatus(formId, updates.status);
      // Force dashboard refresh to show updated status
      setDashboardRefreshKey(prev => prev + 1);
      
      // Close modal when form is completed
      if (updates.status === 'Complete') {
        setShowFormModal(false);
        setSelectedForm(null);
      }
    }
    
    // Update the selectedForm state to reflect changes (local only)
    if (selectedForm && selectedForm.id === formId) {
      const updatedForm = { ...selectedForm, ...updates } as PaperFormEntry;
      setSelectedForm(updatedForm);
      console.log('SelectedForm updated to:', updatedForm.status);
    }
  }, [updateFormStatus, selectedForm]);

  // Compute a reliable header title for the modal: prefer the explicitly-selected form's title
  // (admin is explicitly viewing this form), then fall back to the store's currentForm title,
  // then the human-friendly form type name, finally a placeholder.
  const headerTitle = (() => {
    if (selectedForm?.title && selectedForm.title.trim()) return selectedForm.title;
    if (currentForm?.title && currentForm.title.trim()) return currentForm.title;
    if (selectedForm?.formType) return getFormTypeDisplayName(selectedForm.formType);
    return '(untitled form)';
  })();

  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState<string | null>(null); // Track which status dropdown is open

  const [dashboardRefreshKey, setDashboardRefreshKey] = useState(0); // Force dashboard refresh
  const [isRefreshingAdmin, setIsRefreshingAdmin] = useState(false);
  const [deleteSuccessMessage, setDeleteSuccessMessage] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'complete' | 'error'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'status' | 'initial' | 'thermometer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // NEW: Toast notification state
  const [toasts, setToasts] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    formId?: string;
    timestamp: Date;
  }>>([]);

  const settingsDropdownRef = useRef<HTMLDivElement>(null);


  const adminUser = MOCK_USERS.find(user => user.role === 'admin');

  // NOTE: intentionally do NOT mirror `selectedForm` into the global paperForm store here.
  // Mirroring caused race conditions where components reading `currentForm` would show
  // stale or unrelated forms when an admin was explicitly viewing a different `selectedForm`.
  // The authoritative syncing between the store and UI should happen via loadForm() / saveForm().

  // Load forms and initials from AWS when admin page loads
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Admin page: Loading data from AWS...');
        
        // Load forms
        await loadFormsFromStorage();
        console.log('Admin page: Forms loaded successfully');
        
        // Debug: Check data count after loading
        const { savedForms } = usePaperFormStore.getState();
    
        console.log(`Admin page: After loading, savedForms count: ${savedForms.length}`);
        
      } catch (error) {
        console.error('Admin page: Error loading data from AWS:', error);
        // No fallback to local storage - AWS is required
      }
    };
    
    loadData();
  }, [loadFormsFromStorage]);

  // NEW: Real-time dashboard refresh effect with status change detection
  useEffect(() => {
    // Store previous form statuses to detect changes
    const previousStatuses = new Map(savedForms.map(form => [form.id, form.status]));
    
    // Only refresh when there are actual status changes, not on a timer
    const checkForStatusChanges = () => {
      let hasChanges = false;
      
      savedForms.forEach(form => {
        const previousStatus = previousStatuses.get(form.id);
        if (previousStatus && previousStatus !== form.status) {
          hasChanges = true;
          
          // Status changed - show notification
          const toast: {
            id: string;
            type: 'success' | 'error' | 'warning' | 'info';
            message: string;
            formId?: string;
            timestamp: Date;
          } = {
            id: `${form.id}-${Date.now()}`,
            type: form.status === 'Error' ? 'error' : 
                  form.status === 'Complete' ? 'success' : 'warning',
            message: `Form #${form.id.slice(-6)} status changed from ${previousStatus} to ${form.status}`,
            formId: form.id,
            timestamp: new Date()
          };
          
          setToasts(prev => [...prev, toast]);
          
          // Auto-remove toast after 5 seconds
          setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== toast.id));
          }, 5000);
          
          // Update the previous status
          previousStatuses.set(form.id, form.status);
        }
      });
      
      // Only refresh dashboard if there were actual changes
      if (hasChanges) {
        setDashboardRefreshKey(prev => prev + 1);
      }
    };
    
    // Check for changes immediately when savedForms changes
    checkForStatusChanges();
    
    // No more automatic interval - we'll rely on React's natural re-rendering
    // when savedForms actually changes
  }, [savedForms]);

  // OPTIMIZATION: Memoize filtered forms to avoid repeated isFormBlank calls
  const filteredForms = useMemo(() => {
    return savedForms.filter(form => !isFormBlank(form));
  }, [savedForms, isFormBlank]);

  const errorForms = useMemo(() => {
    return filteredForms.filter(form => form.status === 'Error');
  }, [filteredForms]);

  const activeForms = useMemo(() =>
    filteredForms
      .filter((form) => form.status !== 'Complete' && form.status !== 'Approved')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredForms]
  );

  const completedForms = useMemo(() =>
    filteredForms
      .filter(form => form.status === 'Complete')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredForms]
  );

  const approvedForms = useMemo(() =>
    filteredForms
      .filter(form => form.status === 'Approved')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [filteredForms]
  );

  const formCounts = useMemo(() => {
    return {
      total: filteredForms.length,
  pending: activeForms.length,
      complete: filteredForms.filter(f => f.status === 'Complete').length,
      error: errorForms.length
    };
  }, [filteredForms, activeForms, errorForms]);

  // REMOVED: Complex status calculation logic that was interfering with form page status updates
  // The admin page should just display the current status from the store, not try to recalculate it
  // This prevents conflicts when the form page updates status to "Error"

  // Close dropdown and modals when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Close settings dropdown
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
      
      // Close status dropdown
      setShowStatusDropdown(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (deleteSuccessMessage) {
      const timer = setTimeout(() => {
        setDeleteSuccessMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [deleteSuccessMessage]);

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
        console.error('Failed to load form for admin view, falling back to provided object', err);
      }
      setShowFormModal(true);
    })();
  };





  const handlePrintForm = (form: PaperFormEntry) => {
    // Open form in a new window that matches the exact PaperForm component styling
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
              padding: 8px;
              text-align: center;
              font-size: 12px;
            }
            .ingredients-table th {
              background: #f3f4f6;
              font-weight: bold;
            }
            .right-section {
              padding: 16px;
            }
            .comments-title {
              font-weight: bold;
              margin-bottom: 8px;
            }
            .comments-content {
              min-height: 120px;
              padding: 8px;
              border: 1px solid #d1d5db;
              font-size: 14px;
              line-height: 1.4;
            }
            .row-separator {
              border-top: 4px solid black !important;
            }
            @media print {
              body { padding: 0; margin: 0; }
              .form-container { max-width: none; }
            }
          </style>
        </head>
        <body>
          <div class="form-container">
            <!-- Header -->
            <div class="header-section">
                          <div class="header-title">
              <h1>${form.title ? form.title : 'Cooking and Cooling for Meat & Non Meat Ingredients'}</h1>
            </div>
              <div class="header-content">
                <div>
                  <strong>Date: </strong>${new Date(form.date).toLocaleDateString()}
                </div>
              </div>
            </div>

            <!-- Main Table -->
            <div class="main-table-container">
              <table class="main-table">
                <thead>
                  <tr>
                    <th style="width: 120px;">Rack</th>
                    <th style="width: 120px;">Date</th>
                    <th style="width: 160px;">
                      Temperature Must reach 166°F or greater<br/>
                      <strong>CCP 1</strong>
                    </th>
                    <th style="width: 160px;">
                      127°F or greater<br/>
                      <strong>CCP 2</strong><br/>
                      <small>Record Temperature of 1st and LAST rack/batch of the day</small>
                    </th>
                    <th style="width: 160px;">
                      80°F or below within 105 minutes<br/>
                      <strong>CCP 2</strong><br/>
                      <small>Record Temperature of 1st rack/batch of the day</small>
                    </th>
                    <th style="width: 160px;">
                      <strong>54</strong> or below within 4.75 hr
                    </th>
                    <th style="width: 160px;">
                      Chill Continuously to<br/>
                      39°F or below
                    </th>
                  </tr>
                  <tr>
                    <th>Rack</th>
                    <th>Type</th>
                    <th>
                      <div class="cell-grid">
                        <div>Temp</div>
                        <div>Time</div>
                        <div>Initial</div>
                      </div>
                    </th>
                    <th>
                      <div class="cell-grid">
                        <div>Temp</div>
                        <div>Time</div>
                        <div>Initial</div>
                      </div>
                    </th>
                    <th>
                      <div class="cell-grid">
                        <div>Temp</div>
                        <div>Time</div>
                        <div>Initial</div>
                      </div>
                    </th>
                    <th>
                      <div class="cell-grid">
                        <div>Temp</div>
                        <div>Time</div>
                        <div>Initial</div>
                      </div>
                    </th>
                    <th>
                      <div class="cell-grid">
                        <div>Temp</div>
                        <div>Time</div>
                        <div>Initial</div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${form.entries.map((entry, index) => `
                    <tr${index === 5 ? ' class="row-separator"' : ''}>
                      <td>
                        <div style="text-align: center; font-size: 12px;">
                          ${entry.rack || ''}
                        </div>
                      </td>
                      <td>
                        <div style="display: flex; align-items: flex-start; text-align: left;">
                          <div class="row-number" style="margin-right: 8px;">${index + 1}</div>
                          <div style="font-size: 12px; flex-grow: 1;">${entry.type || ''}</div>
                        </div>
                      </td>
                      <td>
                        <div class="cell-grid">
                          <div>${entry.ccp1.temp || ''}</div>
                          <div>${entry.ccp1.time || ''}</div>
                          <div>${entry.ccp1.time ? (entry.ccp1.initial || form.formInitial || '') : ''}</div>
                        </div>
                      </td>
                      <td>
                        <div class="cell-grid">
                          <div>${entry.ccp2.temp || ''}</div>
                          <div>${entry.ccp2.time || ''}</div>
                          <div>${entry.ccp2.time ? (entry.ccp2.initial || form.formInitial || '') : ''}</div>
                        </div>
                      </td>
                      <td>
                        <div class="cell-grid">
                          <div>${entry.coolingTo80.temp || ''}</div>
                          <div>${entry.coolingTo80.time || ''}</div>
                          <div>${entry.coolingTo80.time ? (entry.coolingTo80.initial || form.formInitial || '') : ''}</div>
                        </div>
                      </td>
                      <td>
                        <div class="cell-grid">
                          <div>${entry.coolingTo54.temp || ''}</div>
                          <div>${entry.coolingTo54.time || ''}</div>
                          <div>${entry.coolingTo54.time ? (entry.coolingTo54.initial || form.formInitial || '') : ''}</div>
                        </div>
                      </td>
                      <td>
                        <div class="cell-grid">
                          <div>${entry.finalChill.temp || ''}</div>
                          <div>${entry.finalChill.time || ''}</div>
                          <div>${entry.finalChill.time ? (entry.finalChill.initial || form.formInitial || '') : ''}</div>
                        </div>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <!-- Bottom Section -->
            <div class="bottom-section">
              <!-- Left side - Thermometer and Ingredients -->
              <div class="left-section">
                <!-- Thermometer # -->
                <div class="thermometer-section">
                  <span>Thermometer # </span>
                  <span style="border-bottom: 1px solid black; padding-bottom: 2px; min-width: 100px; display: inline-block;">
                    ${form.thermometerNumber || ''}
                  </span>
                </div>
                
                <!-- Ingredients Table -->
                <table class="ingredients-table">
                  <thead>
                    <tr>
                      <th>Ingredient</th>
                      <th>Beef</th>
                      <th>Chicken</th>
                      <th>Liquid Eggs</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style="font-weight: bold;">Lot #(s)</td>
                      <td>${form.lotNumbers.beef || ''}</td>
                      <td>${form.lotNumbers.chicken || ''}</td>
                      <td>${form.lotNumbers.liquidEggs || ''}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Right side - Corrective Actions -->
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
  };

  // Download PDF from admin page for approved forms
  const handleDownloadPDF = async (form: PaperFormEntry) => {
    try {
      await generateFormPDF({
        id: form.id,
        title: form.title || getFormTypeDisplayName(form.formType),
        formType: form.formType,
        date: form.date instanceof Date ? form.date.toISOString() : new Date(form.date).toISOString(),
        status: form.status,
        approvedBy: form.approvedBy,
        approvedAt: form.approvedAt ? (form.approvedAt instanceof Date ? form.approvedAt.toISOString() : new Date(form.approvedAt).toISOString()) : undefined,
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
      showToast('error', 'Failed to download PDF. Please try again.');
    }
  };

  // Download JPEG from admin page for approved forms
  const handleDownloadJPEG = async (form: PaperFormEntry) => {
    try {
      // Create a temporary div to render the form content
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '1200px';
      tempDiv.style.backgroundColor = 'white';
      tempDiv.style.padding = '20px';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.fontSize = '12px';
      tempDiv.style.lineHeight = '1.4';
      
      // Use the exact same HTML generation as the PDF generator
      const { generateFormPDF } = await import('@/lib/pdfGenerator');
      
      // Create the same data structure that the PDF generator expects
      const pdfFormData = {
        id: form.id,
        title: form.title || getFormTypeDisplayName(form.formType),
        formType: form.formType,
        date: form.date instanceof Date ? form.date.toISOString() : new Date(form.date).toISOString(),
        status: form.status,
        approvedBy: form.approvedBy,
        approvedAt: form.approvedAt ? (form.approvedAt instanceof Date ? form.approvedAt.toISOString() : new Date(form.approvedAt).toISOString()) : undefined,
        correctiveActionsComments: form.correctiveActionsComments,
        thermometerNumber: form.thermometerNumber,
        lotNumbers: form.lotNumbers,
        entries: form.entries,
        quantityAndFlavor: (form as any).quantityAndFlavor,
        preShipmentReview: (form as any).preShipmentReview,
        frankFlavorSizeTable: (form as any).frankFlavorSizeTable,
        bagelDogPreShipmentReview: (form as any).bagelDogPreShipmentReview
      };
      
      // Generate the exact same HTML that the PDF uses
      tempDiv.innerHTML = generateFormHTML(pdfFormData);
      
      // Add to DOM temporarily
      document.body.appendChild(tempDiv);
      
      // Convert to canvas using html2canvas
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(tempDiv, {
        width: 1200,
        height: tempDiv.scrollHeight,
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Remove temporary div
      document.body.removeChild(tempDiv);
      
      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${form.title ? form.title.replace(/[^a-zA-Z0-9]/g, '_') : 'FoodChillingLog'}_${form.id.slice(-6)}_${new Date(form.date).toISOString().split('T')[0]}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          showToast('success', 'JPEG downloaded successfully!', form.id);
        }
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Error downloading JPEG:', error);
      showToast('error', 'Failed to download JPEG. Please try again.', form.id);
    }
  };

  // Helper function to generate HTML for JPEG conversion - using the exact same logic as PDF generator
  const generateFormHTML = (formData: any): string => {
    // Import the same functions used by the PDF generator
    const { FormType, isPiroshkiForm, isBagelDogForm } = require('@/lib/paperFormTypes');
    
    // Determine form type and generate appropriate content - exactly like PDF generator
    if (formData.formType === FormType.PIROSHKI_CALZONE_EMPANADA) {
      return generatePiroshkiFormHTML(formData);
    } else if (formData.formType === FormType.BAGEL_DOG_COOKING_COOLING) {
      return generateBagelDogFormHTML(formData);
    } else {
      return generateCookingCoolingFormHTML(formData);
    }
  };

  // Copy the exact same HTML generation functions from pdfGenerator.ts
  const generateCookingCoolingFormHTML = (formData: any): string => {
    // Generate the main form table rows
    const generateFormRows = () => {
      if (!formData.entries || formData.entries.length === 0) {
        return `
          <tr>
            <td colspan="7" class="border border-black p-4 text-center text-gray-500">
              No entries recorded
            </td>
          </tr>
        `;
      }

      return formData.entries.map((entry: any, index: number) => `
        <tr>
          <td class="border border-black p-2 text-center">
            ${entry.rack || index + 1}
          </td>
          <td class="border border-black p-2 text-center">
            ${entry.type || ''}
          </td>
          <td class="border border-black p-1" style="${getDataLogClass(entry.ccp1?.dataLog)}">
            <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 0.25rem; align-items: center;">
              <div class="text-center">${formatTemperature(entry.ccp1?.temp)}</div>
              <div class="text-center">${formatTime(entry.ccp1?.time)}</div>
              <div class="text-center">${formatInitial(entry.ccp1?.initial)}</div>
            </div>
          </td>
          <td class="border border-black p-1" style="${getDataLogClass(entry.ccp2?.dataLog)}">
            <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 0.25rem; align-items: center;">
              <div class="text-center">${formatTemperature(entry.ccp2?.temp)}</div>
              <div class="text-center">${formatTime(entry.ccp2?.time)}</div>
              <div class="text-center">${formatInitial(entry.ccp2?.initial)}</div>
            </div>
          </td>
          <td class="border border-black p-1" style="${getDataLogClass(entry.coolingTo80?.dataLog)}">
            <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 0.25rem; align-items: center;">
              <div class="text-center">${formatTemperature(entry.coolingTo80?.temp)}</div>
              <div class="text-center">${formatTime(entry.coolingTo80?.time)}</div>
              <div class="text-center">${formatInitial(entry.coolingTo80?.initial)}</div>
            </div>
          </td>
          <td class="border border-black p-1" style="${getDataLogClass(entry.coolingTo54?.dataLog)}">
            <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 0.25rem; align-items: center;">
              <div class="text-center">${formatTemperature(entry.coolingTo54?.temp)}</div>
              <div class="text-center">${formatTime(entry.coolingTo54?.time)}</div>
              <div class="text-center">${formatInitial(entry.coolingTo54?.initial)}</div>
            </div>
          </td>
          <td class="border border-black p-1" style="${getDataLogClass(entry.finalChill?.dataLog)}">
            <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 0.25rem; align-items: center;">
              <div class="text-center">${formatTemperature(entry.finalChill?.temp)}</div>
              <div class="text-center">${formatTime(entry.finalChill?.time)}</div>
              <div class="text-center">${formatInitial(entry.finalChill?.initial)}</div>
            </div>
          </td>
        </tr>
      `).join('');
    };

    return `
      <div style="font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; background-color: white;">
        <!-- Form Header -->
        <div style="margin-bottom: 24px;">
          <div style="border: 2px solid black; margin-bottom: 16px;">
            <div style="background-color: #f3f4f6; padding: 16px; text-align: center;">
              <h1 style="color: #111827; margin: 0; font-size: 20px; font-weight: bold;">
                Cooking and Cooling for Meat &amp; Non Meat Ingredients
              </h1>
            </div>
            <div style="padding: 16px;">
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                <div>
                  <span style="font-weight: 600;">Title: </span>
                  <span style="border-bottom: 2px solid #d1d5db; padding: 4px 8px; display: inline-block; min-width: 200px;">
                    ${formData.title || ''}
                  </span>
                </div>
                <div>
                  <span style="font-weight: 600;">Date: </span>
                  <span style="border-bottom: 2px solid #d1d5db; padding: 4px 8px; display: inline-block; min-width: 150px;">
                    ${formatDate(formData.date)}
                  </span>
                </div>
                <div>
                  <span style="font-weight: 600;">Status: </span>
                  <span style="color: ${formData.status === 'Approved' ? '#4f46e5' : formData.status === 'Complete' ? '#059669' : '#d97706'}; font-weight: bold;">
                    ${formData.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Table -->
        <div style="border: 2px solid black; overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; min-width: 760px;">
            <!-- Header Row 1 -->
            <thead>
              <tr style="background-color: #f3f4f6;">
                <th style="border: 1px solid black; padding: 8px; width: 64px;">Rack</th>
                <th style="border: 1px solid black; padding: 8px; width: 64px;">Type</th>
                <th style="border: 1px solid black; padding: 8px; width: 128px;">
                  Temperature Must reach 166°F or greater<br/>
                  <strong>CCP 1</strong>
                </th>
                <th style="border: 1px solid black; padding: 8px; width: 128px;">
                  127°F or greater<br/>
                  <strong>CCP 2</strong><br/>
                  <small>Record Temperature of 1st and LAST rack/batch of the day</small>
                </th>
                <th style="border: 1px solid black; padding: 8px; width: 128px;">
                  80°F or below within 105 minutes<br/>
                  <strong>CCP 2</strong><br/>
                  <small>Record Temperature of 1st rack/batch of the day</small><br/>
                  <small>Time: from CCP2 (127°F)</small>
                </th>
                <th style="border: 1px solid black; padding: 8px; width: 128px;">
                  <strong>54°F</strong> or below within 4.75 hr<br/>
                  <small>Time: from CCP2 (127°F)</small>
                </th>
                <th style="border: 1px solid black; padding: 8px; width: 160px;">
                  Chill Continuously to<br/>
                  39°F or below
                </th>
              </tr>

              <!-- Header Row 2 -->
              <tr style="background-color: #f9fafb;">
                <th style="border: 1px solid black; padding: 4px; font-size: 11px;">Rack</th>
                <th style="border: 1px solid black; padding: 4px; font-size: 11px;">Type</th>
                <th style="border: 1px solid black; padding: 4px;">
                  <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 1px; font-size: 11px;">
                    <div style="text-align: center;">Temp</div>
                    <div style="text-align: center;">Time</div>
                    <div style="text-align: center;">Initial</div>
                  </div>
                </th>
                <th style="border: 1px solid black; padding: 4px;">
                  <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 1px; font-size: 11px;">
                    <div style="text-align: center;">Temp</div>
                    <div style="text-align: center;">Time</div>
                    <div style="text-align: center;">Initial</div>
                  </div>
                </th>
                <th style="border: 1px solid black; padding: 4px;">
                  <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 1px; font-size: 11px;">
                    <div style="text-align: center;">Temp</div>
                    <div style="text-align: center;">Time</div>
                    <div style="text-align: center;">Initial</div>
                  </div>
                </th>
                <th style="border: 1px solid black; padding: 4px;">
                  <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 1px; font-size: 11px;">
                    <div style="text-align: center;">Temp</div>
                    <div style="text-align: center;">Time</div>
                    <div style="text-align: center;">Initial</div>
                  </div>
                </th>
                <th style="border: 1px solid black; padding: 4px;">
                  <div style="display: grid; grid-template-columns: 1fr 1.618fr 0.618fr; gap: 1px; font-size: 11px;">
                    <div style="text-align: center;">Temp</div>
                    <div style="text-align: center;">Time</div>
                    <div style="text-align: center;">Initial</div>
                  </div>
                </th>
              </tr>
            </thead>

            <!-- Form Data Rows -->
            <tbody>
              ${generateFormRows()}
            </tbody>
          </table>
        </div>

        <!-- Bottom Section -->
        <div style="border: 2px solid black; border-top: 0;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0;">
            <!-- Left side -->
            <div style="border-right: 1px solid black;">
              <!-- Thermometer # -->
              <div style="border-bottom: 1px solid black; padding: 8px; text-align: center;">
                <span style="font-weight: 600;">Thermometer #</span>
                <span style="margin-left: 8px; border-bottom: 1px solid black; padding: 4px; display: inline-block; min-width: 150px;">
                  ${formData.thermometerNumber || ''}
                </span>
              </div>

              <!-- Ingredients Table -->
              <table style="width: 100%; border-collapse: collapse;">
                <thead>
                  <tr>
                    <th style="border: 1px solid black; padding: 8px; background-color: #f3f4f6;">Ingredient</th>
                    <th style="border: 1px solid black; padding: 8px; background-color: #f3f4f6;">Beef</th>
                    <th style="border: 1px solid black; padding: 8px; background-color: #f3f4f6;">Chicken</th>
                    <th style="border: 1px solid black; padding: 8px; background-color: #f3f4f6;">Liquid Eggs</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style="border: 1px solid black; padding: 8px; font-weight: 600;">Lot #(s)</td>
                    <td style="border: 1px solid black; padding: 4px; min-height: 20px;">
                      ${formData.lotNumbers?.beef || ''}
                    </td>
                    <td style="border: 1px solid black; padding: 4px; min-height: 20px;">
                      ${formData.lotNumbers?.chicken || ''}
                    </td>
                    <td style="border: 1px solid black; padding: 4px; min-height: 20px;">
                      ${formData.lotNumbers?.liquidEggs || ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Right side - Corrective Actions -->
            <div style="padding: 16px; position: relative;">
              <div style="margin-bottom: 8px;">
                <h3 style="font-weight: 600; margin: 0;">Corrective Actions &amp; comments:</h3>
              </div>
              <div style="width: 100%; min-height: 128px; border: 1px solid #d1d5db; padding: 8px; font-size: 11px; background-color: white; white-space: pre-wrap;">
                ${formData.correctiveActionsComments || ''}
              </div>
            </div>
          </div>
        </div>

        <!-- Form Status and Approval Info -->
        ${formData.status === 'Complete' ? `
          <div style="margin-top: 24px; padding: 16px; background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 8px; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #374151;">
              <span style="font-size: 18px; font-weight: 600;">✓ Form Completed Successfully!</span>
            </div>
            <p style="color: #6b7280; margin: 4px 0 0 0;">This form has been finalized and can no longer be edited</p>
          </div>
        ` : ''}

        ${formData.status === 'Approved' ? `
          <div style="margin-top: 24px; padding: 16px; background-color: #eef2ff; border: 2px solid #c7d2fe; border-radius: 8px; text-align: center;">
            <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #3730a3;">
              <span style="font-size: 18px; font-weight: 600;">✓ Form Approved</span>
            </div>
            <p style="color: #6366f1; margin: 4px 0 0 0;">
              Approved by: ${formData.approvedBy || 'N/A'}
              ${formData.approvedAt ? ` • ${formatDate(formData.approvedAt)}` : ''}
            </p>
          </div>
        ` : ''}

        <!-- Footer -->
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #d1d5db; text-align: center; color: #6b7280; font-size: 11px;">
          <p style="margin: 0;">Generated on ${new Date().toLocaleString('en-US')}</p>
          <p style="margin: 5px 0 0 0;">Food Safety Monitoring System - Form ID: ${formData.id}</p>
        </div>
      </div>
    `;
  };

  // Helper functions for formatting data - copied from pdfGenerator.ts
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  const formatTemperature = (temp: string | number) => {
    if (!temp) return '';
    return `${temp}°F`;
  };

  const formatInitial = (initial: string) => {
    if (!initial) return '';
    return initial.toUpperCase();
  };

  const getDataLogClass = (dataLog: boolean) => {
    return dataLog ? 'background-color: #dbeafe;' : '';
  };

  // Placeholder functions for other form types - these would need to be implemented similarly
  const generatePiroshkiFormHTML = (formData: any): string => {
    return `<div>Piroshki form HTML generation not yet implemented for JPEG</div>`;
  };

  const generateBagelDogFormHTML = (formData: any): string => {
    return `<div>Bagel Dog form HTML generation not yet implemented for JPEG</div>`;
  };

  const handleDeleteForm = (formId: string) => {
    const formToDelete = savedForms.find(form => form.id === formId);
    if (!formToDelete) return;

    const formDate = new Date(formToDelete.date).toLocaleDateString();
    const formInitial = formToDelete.formInitial || 'Unknown';
    
    if (confirm(`Are you sure you want to delete Form #${formToDelete.id.slice(-6)}?\n\nForm Details:\n• Date: ${formDate}\n• Initial: ${formInitial}\n• Status: ${formToDelete.status}\n\nThis will permanently delete ALL form data including:\n• All temperature and time entries\n• Thermometer number\n• Ingredients and lot numbers\n• Corrective actions and comments\n• Admin comments\n• Validation errors\n\nThis action cannot be undone.`)) {
      console.log('Deleting form:', formToDelete.id, 'with all associated data');
      
      // Log state before deletion
      console.log('State before deletion:', exportState());
      
      deleteForm(formId);
      
      // Force dashboard refresh to update the UI immediately
      setDashboardRefreshKey(prev => prev + 1);
      setDeleteSuccessMessage(`Form #${formToDelete.id.slice(-6)} deleted successfully.`);
      
      // If this was the selected form in the modal, close the modal
      if (selectedForm?.id === formId) {
        setShowFormModal(false);
        setSelectedForm(null);
      }
      
      // Log state after deletion
      setTimeout(() => {
        console.log('State after deletion:', exportState());
      }, 200);
    }
  };

  const handleDebugExport = () => {
    const state = exportState();
    console.log('Current Form Store State:', state);
    
    // Copy to clipboard for easy sharing
    navigator.clipboard.writeText(JSON.stringify(state, null, 2)).then(() => {
      alert('State exported to clipboard! Check console for details.');
    }).catch(() => {
      alert('State exported to console! Check browser console for details.');
    });
  };

  const getFilteredAndSortedForms = () => {
    let filtered = savedForms; // Show ALL forms in admin page, including blank ones
    
    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(form => {
        switch (filterStatus) {
          case 'pending':
            return form.status !== 'Complete';
          case 'complete':
            return form.status === 'Complete';
          case 'error':
            return form.status === 'Error';
          default:
            return true;
        }
      });
    }
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(form => 
        form.id.toLowerCase().includes(term) ||
        (form.formInitial && form.formInitial.toLowerCase().includes(term)) ||
        (form.thermometerNumber && form.thermometerNumber.toLowerCase().includes(term)) ||
        form.date.toString().includes(term)
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'initial':
          aValue = a.formInitial || '';
          bValue = b.formInitial || '';
          break;
        case 'thermometer':
          aValue = a.thermometerNumber || '';
          bValue = b.thermometerNumber || '';
          break;
        default:
          aValue = new Date(a.date).getTime();
          bValue = new Date(b.date).getTime();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    return filtered;
  };

  // getFormCounts is now replaced by the memoized formCounts above



  const hasCompleteData = (form: PaperFormEntry) => {
    return form.entries.some(entry => 
      entry.type || 
      entry.ccp1.temp || 
      entry.ccp2.temp || 
      entry.coolingTo80.temp || 
      entry.coolingTo54.temp || 
      entry.finalChill.temp
    );
  };

  const renderStatusDisplay = (form: PaperFormEntry) => {
    const getStatusStyles = (status: string) => {
      switch (status) {
        case 'Complete':
          return {
            text: 'text-green-600',
            icon: '✓',
            bg: 'bg-green-50',
            border: 'border-green-200'
          };
        case 'In Progress':
          return {
            text: 'text-yellow-600',
            icon: '⏳',
            bg: 'bg-yellow-50',
            border: 'border-yellow-200'
          };
        case 'Error':
          return {
            text: 'text-orange-600',
            icon: '⚠️',
            bg: 'bg-orange-50',
            border: 'border-orange-200'
          };
        default:
          return {
            text: 'text-gray-600',
            icon: '?',
            bg: 'bg-gray-50',
            border: 'border-gray-200'
          };
      }
    };

    const styles = getStatusStyles(form.status);

    const handleStatusChange = (newStatus: 'Complete' | 'In Progress' | 'Error' | 'Approved') => {
      updateFormStatus(form.id, newStatus);
      setShowStatusDropdown(null); // Close dropdown after selection
      // Force dashboard refresh to show updated status
      setDashboardRefreshKey(prev => prev + 1);
      showToast('success', `Form status updated to ${newStatus}`, form.id);
    };

    const availableStatuses: Array<'Complete' | 'In Progress' | 'Error' | 'Approved'> = ['In Progress', 'Complete', 'Error', 'Approved'];

    return (
      <div className="space-y-1">
        <div className="relative">
          <button
            onClick={() => {
              console.log('Status button clicked for form:', form.id);
              console.log('Current showStatusDropdown:', showStatusDropdown);
              setShowStatusDropdown(showStatusDropdown === form.id ? null : form.id);
            }}
            className={`
              w-full px-3 py-2 text-sm font-medium rounded-lg border transition-all duration-200
              ${styles.bg} ${styles.border} ${styles.text}
              hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500
              ${showStatusDropdown === form.id ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
            `}
          >
            <div className="flex items-center justify-between">
              <span>{styles.icon} {form.status}</span>
              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </button>

          {showStatusDropdown === form.id && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white border-2 border-blue-300 rounded-lg shadow-xl z-50">
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  Change Status
                </div>
                {availableStatuses.map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors
                      ${form.status === status ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}
                    `}
                  >
                    {getStatusStyles(status).icon} {status}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Show last update time */}
        <div className="text-xs text-gray-500 px-3">
          Last updated: {form.lastTextEntry ? `${new Date(form.lastTextEntry).toLocaleDateString()} at ${new Date(form.lastTextEntry).toLocaleTimeString()}` : 'No text entered yet'}
        </div>
      </div>
    );
  };

  const showToast = (type: 'success' | 'error' | 'warning' | 'info', message: string, formId?: string) => {
    const toastId = `${formId || 'global'}-${Date.now()}`;
    setToasts(prev => [...prev, { id: toastId, type, message, formId, timestamp: new Date() }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 5000);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 mb-6">
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600">Food Safety Form Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            
            {/* Refresh button removed per request */}

            <div className="text-right">
              <p className="font-medium text-gray-900">{adminUser?.name}</p>
              <p className="text-sm text-gray-600">{adminUser?.role}</p>
            </div>
            
            <div className="relative" ref={settingsDropdownRef}>
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors cursor-pointer"
                title="Settings"
              >
                <span className="text-white font-bold text-lg">{adminUser?.initials}</span>
              </button>

              {showSettingsDropdown && (
                <div className="absolute top-full right-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                      Settings
                    </div>
                    <div className="px-4 py-2 text-sm text-gray-500">
                      No settings available
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4">
          {/* Success Message */}
          {deleteSuccessMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">{deleteSuccessMessage}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setDeleteSuccessMessage(null)}
                    className="text-green-400 hover:text-green-600"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* Active Forms Section (card layout identical to /form page) */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
              <svg className="w-6 h-6 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Active Forms
            </h2>
            {activeForms
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((form) => {
                // Don't auto-update status here - just display the current status from the store
                // The form page handles status updates, admin page should just display them

                return (
                  <div key={form.id} className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6`}>
                    <div className={`p-6`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`w-4 h-4 rounded-full ${
                            form.status === 'Complete' ? 'bg-green-500' :
                            form.status === 'Error' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`} />

                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">{form.title ? form.title : getFormTypeDisplayName(form.formType)}</h3>
                            <div className="text-sm text-gray-600 mt-1">{getFormTypeDisplayName(form.formType)}</div>
                            <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                              <span>Form #{form.id.slice(-6)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            form.status === 'Complete' ? 'bg-green-100 text-green-800' :
                            form.status === 'Error' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {form.status === 'Complete' ? '✓ Complete' : form.status === 'Error' ? '⚠️ Has Errors' : '⏳ In Progress'}
                          </span>

                          <button
                            onClick={() => handleViewForm(form)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Form
                          </button>

                          <button
                            onClick={() => handleDeleteForm(form.id)}
                            className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors"
                          >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-700">Date Created</div>
                          <div className="text-lg font-semibold text-gray-900">{new Date(form.dateCreated || form.date).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-600 mt-1">{new Date(form.dateCreated || form.date).toLocaleTimeString()}</div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="font-medium text-gray-700">Last Updated</div>
                          <div className="text-lg font-semibold text-gray-900">{form.lastTextEntry ? new Date(form.lastTextEntry).toLocaleDateString() : 'No text entered yet'}</div>
                          <div className="text-sm text-gray-600 mt-1">{form.lastTextEntry ? new Date(form.lastTextEntry).toLocaleTimeString() : ''}</div>
                        </div>

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
                );
              })}
          </div>

          {getFilteredAndSortedForms().filter(form => form.status !== 'Complete').length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200 mt-6">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Forms</h3>
              <p className="text-gray-500">No forms match your current search criteria or filters.</p>
            </div>
          )}

          {/* Completed Forms Section (card layout identical to /form page) */}
          {completedForms.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Completed Forms
              </h2>
              {completedForms.map((form) => (
                <div key={form.id} className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6`}>
                  <div className={`p-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{form.title ? form.title : getFormTypeDisplayName(form.formType)}</h3>
                          <div className="text-sm text-gray-600 mt-1">{getFormTypeDisplayName(form.formType)}</div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Form #{form.id.slice(-6)}</span>
                            <span className="text-gray-600 font-medium">✓ Finalized</span>
                            {/* Approved by text removed per request */}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">✓ Complete</span>
                        <button
                          onClick={() => handleViewForm(form)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Form
                        </button>
                        <button
                          onClick={() => {
                            try {
                              // First update the local state immediately for better UX
                              updateFormStatus(form.id, 'In Progress');
                              // removed success toast for reopen to avoid green notification
                              // Force dashboard refresh to show updated status
                              setDashboardRefreshKey(prev => prev + 1);
                            } catch (error) {
                              console.error('Error reopening form:', error);
                              showToast('error', `Failed to reopen form: ${error instanceof Error ? error.message : 'Unknown error'}`, form.id);
                            }
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 hover:text-orange-700 transition-colors"
                          title="Reopen form for editing"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.003 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reopen
                        </button>
                        <button
                          onClick={async () => {
                            if (!adminUser) {
                              showToast('error', 'No admin user configured; cannot approve form', form.id);
                              return;
                            }

                            try {
                              await approveForm(form.id, adminUser.initials);
                              // removed success toast for approve to avoid green notification
                              setDashboardRefreshKey(prev => prev + 1);
                            } catch (error) {
                              console.error('Error approving form:', error);
                              showToast('error', `Failed to approve form: ${error instanceof Error ? error.message : 'Unknown error'}`, form.id);
                            }
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-indigo-600 rounded-md hover:bg-indigo-700 hover:text-white transition-colors"
                          title="Approve form"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Approve
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-700">Date Created</div>
                        <div className="text-lg font-semibold text-gray-900">{new Date(form.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600 mt-1">{new Date(form.date).toLocaleTimeString()}</div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="font-medium text-gray-700">Completion Date</div>
                        <div className="text-lg font-semibold text-gray-900">{new Date(form.date).toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600 mt-1">{new Date(form.date).toLocaleTimeString()}</div>
                      </div>

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

          {getFilteredAndSortedForms().length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200 mt-6">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Forms Found</h3>
              <p className="text-gray-500">No forms match your current search criteria or filters.</p>
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

              {approvedForms.map((form) => (
                <div key={form.id} className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6`}>
                  <div className={`p-6`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{form.title ? form.title : getFormTypeDisplayName(form.formType)}</h3>
                          <div className="text-sm text-gray-600 mt-1">{getFormTypeDisplayName(form.formType)}</div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                            <span>Form #{form.id.slice(-6)}</span>
                            {/* Approved by text removed per request */}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex flex-col items-end text-sm text-gray-600">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800">✓ Approved</span>
                          {/* Approved by text removed per request */}
                        </div>
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
                        <button
                          onClick={() => handleDownloadPDF(form)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 bg-green-50 border border-green-200 rounded-md hover:bg-green-100 hover:text-green-700 transition-colors"
                          title="Download approved form as PDF"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download PDF
                        </button>
                        <button
                          onClick={() => handleDownloadJPEG(form)}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 hover:text-purple-700 transition-colors"
                          title="Download approved form as JPEG"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L22 10" />
                          </svg>
                          Download JPEG
                        </button>
                        <button
                          onClick={() => {
                            try {
                              // First update the local state immediately for better UX
                              updateFormStatus(form.id, 'In Progress');
                              // removed success toast for reopen to avoid green notification
                              // Force dashboard refresh to show updated status
                              setDashboardRefreshKey(prev => prev + 1);
                            } catch (error) {
                              console.error('Error reopening form:', error);
                              showToast('error', `Failed to reopen form: ${error instanceof Error ? error.message : 'Unknown error'}`, form.id);
                            }
                          }}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 border border-orange-200 rounded-md hover:bg-orange-100 hover:text-orange-700 transition-colors"
                          title="Reopen form for editing"
                        >
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.003 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reopen
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </main>

      {/* Form Details Modal */}
      {showFormModal && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-50 rounded-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 bg-white border-b">
              <div>
                <h3 className="text-xl font-semibold">
                  {headerTitle} - {new Date(selectedForm.date).toLocaleDateString()}
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
              
              {/* Right side buttons container */}
              <div className="flex items-center space-x-3">
                {/* Save Button */}
                <button
                  onClick={async () => {
                    // Save form to AWS when clicking save button
                    try {
                      console.log('Saving form to AWS...');
                      await saveForm();
                      console.log('Form saved successfully to AWS');
                      
                      // Close the modal after successful save
                      setShowFormModal(false);
                      setSelectedForm(null);
                      // Force a re-render of the dashboard to show updated status
                      setDashboardRefreshKey(prev => prev + 1);
                      console.log('Dashboard refresh triggered on modal close');
                    } catch (error) {
                      console.error('Error saving form:', error);
                      const errorMessage = error instanceof Error ? error.message : String(error);
                      alert(`Error saving form: ${errorMessage}`);
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                  title="Save form to AWS and close"
                  aria-label="Save form to AWS and close"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Save
                </button>
                
                {/* Cancel Button */}
                <button
                  onClick={() => {
                    console.log('Canceling admin modal - closing without saving');
                    setShowFormModal(false);
                    setSelectedForm(null);
                    // Force a re-render of the dashboard to show updated status
                    setDashboardRefreshKey(prev => prev + 1);
                    console.log('Dashboard refresh triggered on modal close');
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  title="Cancel and close modal without saving"
                  aria-label="Cancel and close modal without saving"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                {selectedForm.formType === FormType.PIROSHKI_CALZONE_EMPANADA ? (
                  <PiroshkiForm 
                    key={`${selectedForm.id}-${dashboardRefreshKey}`}
                    formData={selectedForm}
                    readOnly={false}
                    onFormUpdate={handleFormUpdate}
                  />
                                 ) : selectedForm.formType === FormType.BAGEL_DOG_COOKING_COOLING ? (
                   <BagelDogForm
                     key={`${selectedForm.id}-${dashboardRefreshKey}`}
                     formData={selectedForm}
                     readOnly={false}
                     onFormUpdate={handleFormUpdate}
                   />
                ) : (
                  <PaperForm 
                    key={`${selectedForm?.id || 'none'}-${dashboardRefreshKey}`}
                    formId={selectedForm?.id || ''}
                    formData={selectedForm}
                    isAdminForm={true}
                    readOnly={false}
                    onFormUpdate={handleFormUpdate}
                  />
                )}
              </div>
          </div>
        </div>
      )}



      {/* Toast Notifications */}
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-50 p-3 rounded-lg shadow-lg text-white font-medium ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'error' ? 'bg-red-500' :
            toast.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
        >
          {toast.message}
          {toast.formId && (
            <span className="ml-2 text-xs font-normal">
              (Form #{toast.formId.slice(-6)})
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
