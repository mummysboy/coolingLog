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
  const { currentForm, createNewForm, updateFormStatus, approveForm, saveForm, savedForms, loadForm, loadFormsFromStorage } = usePaperFormStore();
  const store = usePaperFormStore; // Get store reference for getState()
  const [formUpdateKey, setFormUpdateKey] = useState(0); // Force re-render when form updates

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

  // Function to handle JPEG download
  const handleDownloadJPEG = useCallback(async (form: PaperFormEntry) => {
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
          
          alert('JPEG downloaded successfully!');
        }
      }, 'image/jpeg', 0.9);
      
    } catch (error) {
      console.error('Error downloading JPEG:', error);
      alert('Failed to download JPEG. Please try again.');
    }
  }, []);

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
      // Close the modal when the form is completed
      if (updates.status === 'Complete') {
        setShowFormModal(false);
        setSelectedForm(null);
        setNewlyCreatedFormId(null);
      }
    }
    
    // Update the selectedForm state to reflect changes
    if (selectedForm && selectedForm.id === formId) {
      const updatedForm = { ...selectedForm, ...updates } as PaperFormEntry;
      setSelectedForm(updatedForm);
      console.log('SelectedForm updated to:', updatedForm.status);
    }
  }, [updateFormStatus, selectedForm]);

  return (
    <div className="min-h-screen bg-gray-50 py-responsive">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-responsive mb-6">
        <div className="flex flex-col mobile:flex-row mobile:items-center mobile:justify-between space-y-4 mobile:space-y-0">
          <div className="flex items-center justify-center mobile:justify-start space-x-3">
            {/* Logo */}
            <div className="flex items-center justify-center w-24 h-24 mobile:w-32 mobile:h-32 ipad:w-40 ipad:h-40 rounded-xl overflow-hidden">
              <Image 
                src="/logo.avif" 
                alt="FoodChillingLog Logo" 
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          
          {/* Navigation and Add Form Section */}
          <div className="flex items-center justify-center mobile:justify-end space-x-4">
            {/* Add Form Button with Dropdown */}
            <div className="relative" ref={addFormDropdownRef}>
              <button
                onClick={() => setIsAddFormDropdownOpen(!isAddFormDropdownOpen)}
                className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-3 ipad:px-4 ipad:py-3 border border-transparent text-sm mobile:text-base ipad:text-base font-medium rounded-lg mobile:rounded-xl ipad:rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200"
              >
                <svg className="w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Form
                <svg className="w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {isAddFormDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 mobile:w-64 ipad:w-72 rounded-lg mobile:rounded-xl ipad:rounded-2xl shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => {
                        handleCreateForm(FormType.COOKING_AND_COOLING);
                      }}
                      className={`block w-full text-left px-3 py-2 mobile:py-3 ipad:py-3 text-sm mobile:text-base ipad:text-base text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 mobile:w-10 mobile:h-10 ipad:w-12 ipad:h-12 ${getFormTypeColors(FormType.COOKING_AND_COOLING).bg} rounded-lg mobile:rounded-xl ipad:rounded-2xl flex items-center justify-center mr-3`}>
                          <span className={`text-lg mobile:text-xl ipad:text-2xl ${getFormTypeColors(FormType.COOKING_AND_COOLING).text}`}>
                            {getFormTypeIcon(FormType.COOKING_AND_COOLING)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{getFormTypeDisplayName(FormType.COOKING_AND_COOLING)}</div>
                          <div className="text-xs mobile:text-sm ipad:text-base text-gray-500">{getFormTypeDescription(FormType.COOKING_AND_COOLING)}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleCreateForm(FormType.PIROSHKI_CALZONE_EMPANADA);
                      }}
                      className={`block w-full text-left px-3 py-2 mobile:py-3 ipad:py-3 text-sm mobile:text-base ipad:text-base text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 mobile:w-10 mobile:h-10 ipad:w-12 ipad:h-12 ${getFormTypeColors(FormType.PIROSHKI_CALZONE_EMPANADA).bg} rounded-lg mobile:rounded-xl ipad:rounded-2xl flex items-center justify-center mr-3`}>
                          <span className={`text-lg mobile:text-xl ipad:text-2xl ${getFormTypeColors(FormType.PIROSHKI_CALZONE_EMPANADA).text}`}>
                            {getFormTypeIcon(FormType.PIROSHKI_CALZONE_EMPANADA)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{getFormTypeDisplayName(FormType.PIROSHKI_CALZONE_EMPANADA)}</div>
                          <div className="text-xs mobile:text-sm ipad:text-base text-gray-500">{getFormTypeDescription(FormType.PIROSHKI_CALZONE_EMPANADA)}</div>
                        </div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        handleCreateForm(FormType.BAGEL_DOG_COOKING_COOLING);
                      }}
                      className={`block w-full text-left px-3 py-2 mobile:py-3 ipad:py-3 text-sm mobile:text-base ipad:text-base text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <div className={`w-8 h-8 mobile:w-10 mobile:h-10 ipad:w-12 ipad:h-12 ${getFormTypeColors(FormType.BAGEL_DOG_COOKING_COOLING).bg} rounded-lg mobile:rounded-xl ipad:rounded-2xl flex items-center justify-center mr-3`}>
                          <span className={`text-lg mobile:text-xl ipad:text-2xl ${getFormTypeColors(FormType.BAGEL_DOG_COOKING_COOLING).text}`}>
                            {getFormTypeIcon(FormType.BAGEL_DOG_COOKING_COOLING)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{getFormTypeDisplayName(FormType.BAGEL_DOG_COOKING_COOLING)}</div>
                          <div className="text-xs mobile:text-sm ipad:text-base text-gray-500">{getFormTypeDescription(FormType.BAGEL_DOG_COOKING_COOLING)}</div>
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
      <div className="max-w-7xl mx-auto px-responsive">
        {/* Display all forms */}
        {savedForms.length === 0 ? (
          <div className="text-center py-12 mobile:py-16 ipad:py-20 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-4xl mobile:text-5xl ipad:text-6xl mb-4">📝</div>
            <h2 className="text-lg mobile:text-xl ipad:text-2xl font-semibold text-gray-900 mb-2">No Forms Yet</h2>
            <p className="text-sm mobile:text-base ipad:text-lg text-gray-600 mb-4">Click the &quot;Add Form&quot; button above to create your first form.</p>
            <p className="text-xs mobile:text-sm ipad:text-base text-gray-500">Forms are only created when you explicitly choose to create them.</p>
          </div>
        ) : (
          <>
            {/* Active Forms Section */}
            <div className="mb-8">
              <h2 className="text-xl mobile:text-2xl ipad:text-3xl font-bold text-gray-900 mb-4 flex items-center">
                <svg className="w-5 h-5 mobile:w-6 mobile:h-6 ipad:w-7 ipad:h-7 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Active Forms
              </h2>
              {activeForms.map((form: PaperFormEntry, index: number) => (
                  <div 
                    key={form.id} 
                    className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6`}
                  >
                    <div className={`p-4 mobile:p-6 ipad:p-8`}>
                      <div className="flex flex-col mobile:flex-row mobile:items-center mobile:justify-between space-y-4 mobile:space-y-0">
                        <div className="flex items-center space-x-4">
                          {/* Status Indicator */}
                          <div className={`w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 rounded-full ${
                            form.status === 'Complete' ? 'bg-green-500' :
                            form.status === 'Error' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}></div>
                          
                          {/* Form Info */}
                          <div>
                            <h3 className="text-base mobile:text-lg ipad:text-xl font-semibold text-gray-900">
                              {form.title ? form.title : getFormTypeDisplayName(form.formType)}
                            </h3>
                            <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                              {getFormTypeDisplayName(form.formType)}
                            </div>
                            <div className="flex items-center space-x-4 text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                              <span>Form #{form.id.slice(-6)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col mobile:flex-row items-start mobile:items-center space-y-3 mobile:space-y-0 mobile:space-x-3">
                          {/* Status Badge */}
                          <span className={`inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-2 ipad:px-4 ipad:py-2 rounded-full text-sm mobile:text-base ipad:text-base font-medium ${
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
                            className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-3 ipad:px-4 ipad:py-3 text-sm mobile:text-base ipad:text-base font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg mobile:rounded-xl ipad:rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            title="View and edit form details"
                          >
                            <svg className="w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Form
                          </button>
                          

                        </div>
                      </div>
                      
                      {/* Additional Form Summary Info */}
                      <div className="mt-4 grid grid-cols-1 mobile:grid-cols-2 ipad:grid-cols-3 gap-4 text-sm mobile:text-base ipad:text-lg">
                        <div className="bg-gray-50 rounded-lg p-3 mobile:p-4 ipad:p-5">
                          <div className="font-medium text-gray-700">Date Created</div>
                          <div className="text-base mobile:text-lg ipad:text-xl font-semibold text-gray-900">
                            {new Date(form.dateCreated || form.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                            {new Date(form.dateCreated || form.date).toLocaleTimeString()}
                          </div>
                        </div>
                        
                        <div className="bg-gray-50 rounded-lg p-3 mobile:p-4 ipad:p-5">
                          <div className="font-medium text-gray-700">Last Updated</div>
                          <div className="text-base mobile:text-lg ipad:text-xl font-semibold text-gray-900">
                            {form.lastTextEntry ? new Date(form.lastTextEntry).toLocaleDateString() : 'No text entered yet'}
                          </div>
                          <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                            {form.lastTextEntry ? new Date(form.lastTextEntry).toLocaleTimeString() : ''}
                          </div>
                        </div>
                        
                        {/* Corrective Actions and Comments - Always shown */}
                        <div className="bg-gray-50 rounded-lg p-3 mobile:p-4 ipad:p-5 mobile:col-span-2 ipad:col-span-1">
                          <div className="font-medium text-gray-700">Corrective Actions & Comments</div>
                          <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                            <textarea
                              readOnly
                              className="w-full h-20 mobile:h-24 ipad:h-28 p-2 mobile:p-3 ipad:p-4 text-sm mobile:text-base ipad:text-lg text-gray-700 bg-white border rounded-md resize-none"
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
                <div className="text-center py-8 mobile:py-12 ipad:py-16 bg-white rounded-xl border-2 border-gray-200">
                  <div className="text-3xl mobile:text-4xl ipad:text-5xl mb-3">✅</div>
                  <h3 className="text-base mobile:text-lg ipad:text-xl font-semibold text-gray-900 mb-2">All Forms Completed!</h3>
                  <p className="text-sm mobile:text-base ipad:text-lg text-gray-600">Great job! All your forms have been marked as complete.</p>
                </div>
              )}
            </div>

            {/* Completed Forms Section */}
            {completedForms.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl mobile:text-2xl ipad:text-3xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mobile:w-6 mobile:h-6 ipad:w-7 ipad:h-7 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Completed Forms
                </h2>
                
                {completedForms.map((form: PaperFormEntry, index: number) => (
                    <div 
                      key={form.id} 
                      className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6`}
                    >
                      <div className={`p-4 mobile:p-6 ipad:p-8`}>
                        <div className="flex flex-col mobile:flex-row mobile:items-center mobile:justify-between space-y-4 mobile:space-y-0">
                          <div className="flex items-center space-x-4">
                            {/* Form Info */}
                            <div>
                              <h3 className="text-base mobile:text-lg ipad:text-xl font-semibold text-gray-900">
                                {form.title ? form.title : getFormTypeDisplayName(form.formType)}
                              </h3>
                              <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                                {getFormTypeDisplayName(form.formType)}
                              </div>
                              <div className="flex items-center space-x-4 text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                                <span>Form #{form.id.slice(-6)}</span>
                                <span className="text-gray-600 font-medium">✓ Finalized</span>
                                {form.approvedBy && (
                                  <span className="ml-2 text-indigo-600 text-sm mobile:text-base ipad:text-lg">Approved by {form.approvedBy}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex flex-col mobile:flex-row items-start mobile:items-center space-y-3 mobile:space-y-0 mobile:space-x-3">
                            {/* Status Badge */}
                                                      <span className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-2 ipad:px-4 ipad:py-2 rounded-full text-sm mobile:text-base ipad:text-base font-medium bg-green-100 text-green-800">
                            ✓ Complete
                          </span>
                            
                            {/* View Form Button - Read Only */}
                            <button
                              onClick={() => handleViewForm(form)}
                              className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-3 ipad:px-4 ipad:py-3 text-sm mobile:text-base ipad:text-base font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg mobile:rounded-xl ipad:rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-colors"
                              title="View completed form (read-only)"
                            >
                              <svg className="w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View Form
                            </button>
                            
                            {/* Approval is handled from Admin UI; remove approve button from /form page */}
                          </div>
                        </div>
                        
                        {/* Additional Form Summary Info */}
                        <div className="mt-4 grid grid-cols-1 mobile:grid-cols-2 ipad:grid-cols-3 gap-4 text-sm mobile:text-base ipad:text-lg">
                          <div className="bg-gray-50 rounded-lg p-3 mobile:p-4 ipad:p-5">
                            <div className="font-medium text-gray-700">Date Created</div>
                            <div className="text-base mobile:text-lg ipad:text-xl font-semibold text-gray-900">
                              {new Date(form.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                              {new Date(form.date).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          <div className="bg-gray-50 rounded-lg p-3 mobile:p-4 ipad:p-5">
                            <div className="font-medium text-gray-700">Completion Date</div>
                            <div className="text-base mobile:text-lg ipad:text-xl font-semibold text-gray-900">
                              {new Date(form.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                              {new Date(form.date).toLocaleTimeString()}
                            </div>
                          </div>
                          
                          {/* Corrective Actions and Comments - Always shown */}
                          <div className="bg-gray-50 rounded-lg p-3 mobile:p-4 ipad:p-5 mobile:col-span-2 ipad:col-span-1">
                            <div className="font-medium text-gray-700">Corrective Actions & Comments</div>
                            <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                              <textarea
                                readOnly
                                className="w-full h-20 mobile:h-24 ipad:h-28 p-2 mobile:p-3 ipad:p-4 text-sm mobile:text-base ipad:text-lg text-gray-700 bg-white border rounded-md resize-none"
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
                <h2 className="text-xl mobile:text-2xl ipad:text-3xl font-bold text-gray-900 mb-4 flex items-center">
                  <svg className="w-5 h-5 mobile:w-6 mobile:h-6 ipad:w-7 ipad:h-7 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Approved Forms
                </h2>

                {approvedForms.map((form: PaperFormEntry) => (
                  <div key={form.id} className={`bg-white rounded-xl border-2 border-gray-200 overflow-hidden mb-6`}>
                    <div className={`p-4 mobile:p-6 ipad:p-8`}>
                      <div className="flex flex-col mobile:flex-row mobile:items-center mobile:justify-between space-y-4 mobile:space-y-0">
                        <div className="flex items-center space-x-4">
                          <div>
                            <h3 className="text-base mobile:text-lg ipad:text-xl font-semibold text-gray-900">{form.title ? form.title : getFormTypeDisplayName(form.formType)}</h3>
                            <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">{getFormTypeDisplayName(form.formType)}</div>
                            <div className="flex items-center space-x-4 text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
                              <span>Form #{form.id.slice(-6)}</span>
                              {form.approvedBy && (
                                <span className="text-sm mobile:text-base ipad:text-lg text-indigo-600 font-medium">Approved by {form.approvedBy}{form.approvedAt ? ` • ${new Date(form.approvedAt).toLocaleString()}` : ''}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col mobile:flex-row items-start mobile:items-center space-y-3 mobile:space-y-0 mobile:space-x-3">
                          <div className="flex flex-col items-end text-sm mobile:text-base ipad:text-lg text-gray-600">
                            <span className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-2 ipad:px-5 ipad:py-3 rounded-full text-sm mobile:text-base ipad:text-lg font-medium bg-indigo-100 text-indigo-800">✓ Approved</span>
                            {form.approvedBy && (
                              <span className="text-xs mobile:text-sm ipad:text-base text-indigo-700 mt-1">By {form.approvedBy}{form.approvedAt ? ` • ${new Date(form.approvedAt).toLocaleString()}` : ''}</span>
                            )}
                          </div>
                          
                          {/* Download PDF Button */}
                          <button
                            onClick={() => handleDownloadPDF(form)}
                            className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-3 ipad:px-4 ipad:py-3 text-sm mobile:text-base ipad:text-base font-medium text-green-600 bg-green-50 border border-green-200 rounded-lg mobile:rounded-xl ipad:rounded-xl hover:bg-green-100 hover:text-green-700 transition-colors"
                            title="Download form as PDF"
                          >
                            <svg className="w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                          </button>
                          
                          {/* Download JPEG Button */}
                          <button
                            onClick={() => handleDownloadJPEG(form)}
                            className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-3 ipad:px-4 ipad:py-3 text-sm mobile:text-base ipad:text-base font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg mobile:rounded-xl ipad:rounded-xl hover:bg-purple-100 hover:text-purple-700 transition-colors"
                            title="Download form as JPEG"
                          >
                            <svg className="w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L22 10" />
                            </svg>
                            Download JPEG
                          </button>
                          
                          <button
                            onClick={() => handleViewForm(form)}
                            className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-3 ipad:px-4 ipad:py-3 text-sm mobile:text-base ipad:text-base font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg mobile:rounded-xl ipad:rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-colors"
                            title="View approved form (read-only)"
                          >
                            <svg className="w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex flex-col mobile:flex-row mobile:justify-between mobile:items-center p-4 mobile:p-6 ipad:p-8 bg-white border-b space-y-4 mobile:space-y-0">
              <div>
                <h3 className="text-lg mobile:text-xl ipad:text-2xl font-semibold">
                  {selectedForm.title ? selectedForm.title : 'Edit Form'} - {new Date(selectedForm.date).toLocaleDateString()}
                </h3>
                <div className="text-sm mobile:text-base ipad:text-lg text-gray-600 mt-1">
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
              
              {/* Right side buttons container */}
              <div className="flex flex-col mobile:flex-row items-start mobile:items-center space-y-3 mobile:space-y-0 mobile:space-x-3">
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
                    className="px-3 py-2 mobile:px-4 mobile:py-2 ipad:px-4 ipad:py-2 text-sm mobile:text-base ipad:text-base bg-orange-500 text-white rounded-lg mobile:rounded-xl ipad:rounded-xl hover:bg-orange-600 transition-colors"
                    title="Reset form status to allow editing"
                    aria-label="Reset form status to In Progress"
                  >
                    Reset Status
                  </button>
                )}
                
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
                       setNewlyCreatedFormId(null);
                     } catch (error) {
                       console.error('Error saving form:', error);
                       const errorMessage = error instanceof Error ? error.message : String(error);
                       alert(`Error saving form: ${errorMessage}`);
                     }
                   }}
                   className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-3 ipad:px-4 ipad:py-3 text-sm mobile:text-base ipad:text-base font-medium text-white bg-blue-600 border border-transparent rounded-lg mobile:rounded-xl ipad:rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                   title="Save form to AWS and close"
                   aria-label="Save form to AWS and close"
                 >
                   <svg className="w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                   </svg>
                   Save
                 </button>
                
                {/* Cancel Button */}
                <button
                  onClick={() => {
                    // Close the modal without saving
                    setShowFormModal(false);
                    setSelectedForm(null);
                    setNewlyCreatedFormId(null); // Reset the flag when closing
                  }}
                  className="inline-flex items-center px-3 py-2 mobile:px-4 mobile:py-3 ipad:px-4 ipad:py-3 text-sm mobile:text-base ipad:text-base font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg mobile:rounded-xl ipad:rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                  title="Cancel and close modal without saving"
                  aria-label="Cancel and close modal without saving"
                >
                  <svg className="w-4 h-4 mobile:w-5 mobile:h-5 ipad:w-6 ipad:h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {selectedForm.formType === FormType.PIROSHKI_CALZONE_EMPANADA ? (
                <PiroshkiForm 
                  key={`${selectedForm.id}-${formUpdateKey}`}
                  formData={selectedForm}
                  readOnly={(selectedForm.status === 'Complete' || selectedForm.status === 'Approved') && !DEBUG_ALLOW_EDIT}
                  onFormUpdate={handleFormUpdate}
                />
              ) : selectedForm.formType === FormType.BAGEL_DOG_COOKING_COOLING ? (
                <BagelDogForm
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
