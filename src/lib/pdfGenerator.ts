import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FormType, isPiroshkiForm, isBagelDogForm } from './paperFormTypes';

export interface PDFFormData {
  id: string;
  title: string;
  formType: string;
  date: string;
  status: string;
  approvedBy?: string;
  approvedAt?: string;
  correctiveActionsComments?: string;
  thermometerNumber?: string;
  lotNumbers?: {
    beef?: string;
    chicken?: string;
    liquidEggs?: string;
  };
  entries?: any[];
  quantityAndFlavor?: any;
  preShipmentReview?: any;
  frankFlavorSizeTable?: any;
  bagelDogPreShipmentReview?: any;
  lastRackBatch?: any; // Added for LAST RACK/BATCH of Production Day
  [key: string]: any;
}

// Helper functions for formatting data
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

export const generateFormPDF = async (formData: PDFFormData): Promise<void> => {
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
    
    // Generate the HTML content for the PDF that matches the actual form
    tempDiv.innerHTML = generateFormHTML(formData);
    
    // Add to DOM temporarily
    document.body.appendChild(tempDiv);
    
    // Convert to canvas
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
    
    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    // Add first page
    pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if needed
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(canvas, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    
    // Generate filename
    const date = new Date(formData.date).toISOString().split('T')[0];
    const filename = `${formData.formType}_${date}_${formData.id.slice(-6)}.pdf`;
    
    // Download the PDF
    pdf.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

const generateFormHTML = (formData: PDFFormData): string => {
  // Determine form type and generate appropriate content
  if (formData.formType === FormType.PIROSHKI_CALZONE_EMPANADA) {
    return generatePiroshkiFormHTML(formData);
  } else if (formData.formType === FormType.BAGEL_DOG_COOKING_COOLING) {
    return generateBagelDogFormHTML(formData);
  } else {
    return generateCookingCoolingFormHTML(formData);
  }
};

const generateCookingCoolingFormHTML = (formData: PDFFormData): string => {
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

    return formData.entries.map((entry, index) => `
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

const generatePiroshkiFormHTML = (formData: PDFFormData): string => {
  // Generate the main form table rows for Piroshki form
  const generateFormRows = () => {
    if (!formData.entries || formData.entries.length === 0) {
      return `
        <tr>
          <td colspan="9" class="border border-black p-4 text-center text-gray-500">
            No entries recorded
          </td>
        </tr>
      `;
    }

    return formData.entries.map((entry, index) => `
      <tr>
        <td class="border border-black p-2 text-center">
          ${entry.rack || index + 1}
        </td>
        <td class="border border-black p-2 text-center">
          ${entry.type || ''}
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
            <div class="text-center">${entry.heatTreating?.type || ''}</div>
            <div class="text-center">${formatTemperature(entry.heatTreating?.temp)}</div>
            <div class="text-center">${formatTime(entry.heatTreating?.time)}</div>
            <div class="text-center">${formatInitial(entry.heatTreating?.initial)}</div>
          </div>
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
            <div class="text-center">${formatTemperature(entry.ccp2_126?.temp)}</div>
            <div class="text-center">${formatTime(entry.ccp2_126?.time)}</div>
            <div class="text-center">${formatInitial(entry.ccp2_126?.initial)}</div>
          </div>
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
            <div class="text-center">${formatTemperature(entry.ccp2_80?.temp)}</div>
            <div class="text-center">${formatTime(entry.ccp2_80?.time)}</div>
            <div class="text-center">${formatInitial(entry.ccp2_80?.initial)}</div>
          </div>
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
            <div class="text-center">${formatTemperature(entry.ccp2_55?.temp)}</div>
            <div class="text-center">${formatTime(entry.ccp2_55?.time)}</div>
            <div class="text-center">${formatInitial(entry.ccp2_55?.initial)}</div>
          </div>
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
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
              Piroshki, Calzone, Empanada Heat Treating &amp; Cooling CCP 2
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
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; min-width: 900px;">
          <!-- Header Row 1 -->
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid black; padding: 8px; width: 64px;">Rack</th>
              <th style="border: 1px solid black; padding: 8px; width: 64px;">Type</th>
              <th style="border: 1px solid black; padding: 8px; width: 160px;">
                Heat Treating<br/>
                <small>Type, Temp, Time, Initial</small>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 128px;">
                126°F or greater<br/>
                <strong>CCP 2</strong>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 128px;">
                80°F or below<br/>
                <strong>CCP 2</strong>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 128px;">
                55°F or below<br/>
                <strong>CCP 2</strong>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 128px;">
                Final Chill<br/>
                <small>Temp, Time, Initial</small>
              </th>
            </tr>

            <!-- Header Row 2 -->
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid black; padding: 4px; font-size: 11px;">Rack</th>
              <th style="border: 1px solid black; padding: 4px; font-size: 11px;">Type</th>
              <th style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1px; font-size: 11px;">
                  <div style="text-align: center;">Type</div>
                  <div style="text-align: center;">Temp</div>
                  <div style="text-align: center;">Time</div>
                  <div style="text-align: center;">Initial</div>
                </div>
              </th>
              <th style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; font-size: 11px;">
                  <div style="text-align: center;">Temp</div>
                  <div style="text-align: center;">Time</div>
                  <div style="text-align: center;">Initial</div>
                </div>
              </th>
              <th style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; font-size: 11px;">
                  <div style="text-align: center;">Temp</div>
                  <div style="text-align: center;">Time</div>
                  <div style="text-align: center;">Initial</div>
                </div>
              </th>
              <th style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; font-size: 11px;">
                  <div style="text-align: center;">Temp</div>
                  <div style="text-align: center;">Time</div>
                  <div style="text-align: center;">Initial</div>
                </div>
              </th>
              <th style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; font-size: 11px;">
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

      <!-- LAST RACK/BATCH of Production Day Section -->
      <div style="margin-top: 24px; border: 2px solid black; border-top: 0;">
        <div style="background-color: #f3f4f6; padding: 8px; text-align: center; border-bottom: 1px solid black;">
          <h3 style="margin: 0; font-size: 16px; font-weight: bold;">LAST RACK/BATCH of Production Day</h3>
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid black; padding: 8px; width: 128px;">
                126°F or greater<br/>
                <strong>CCP 2</strong>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 128px;">
                80°F or below<br/>
                <strong>CCP 2</strong>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 128px;">
                55°F or below<br/>
                <strong>CCP 2</strong>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 160px;">
                Chill Continuously to 40°F or below
              </th>
            </tr>
            <tr style="background-color: #f9fafb;">
              <th style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; font-size: 11px;">
                  <div style="text-align: center;">Temp</div>
                  <div style="text-align: center;">Time</div>
                  <div style="text-align: center;">Initial</div>
                </div>
              </th>
              <th style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; font-size: 11px;">
                  <div style="text-align: center;">Temp</div>
                  <div style="text-align: center;">Time</div>
                  <div style="text-align: center;">Initial</div>
                </div>
              </th>
              <th style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; font-size: 11px;">
                  <div style="text-align: center;">Temp</div>
                  <div style="text-align: center;">Time</div>
                  <div style="text-align: center;">Initial</div>
                </div>
              </th>
              <th style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; font-size: 11px;">
                  <div style="text-align: center;">Temp</div>
                  <div style="text-align: center;">Time</div>
                  <div style="text-align: center;">Initial</div>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; align-items: center;">
                  <div style="text-align: center;">${formatTemperature(formData.lastRackBatch?.ccp2_126?.temp)}</div>
                  <div style="text-align: center;">${formatTime(formData.lastRackBatch?.ccp2_126?.time)}</div>
                  <div style="text-align: center;">${formatInitial(formData.lastRackBatch?.ccp2_126?.initial)}</div>
                </div>
              </td>
              <td style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; align-items: center;">
                  <div style="text-align: center;">${formatTemperature(formData.lastRackBatch?.ccp2_80?.temp)}</div>
                  <div style="text-align: center;">${formatTime(formData.lastRackBatch?.ccp2_80?.time)}</div>
                  <div style="text-align: center;">${formatInitial(formData.lastRackBatch?.ccp2_80?.initial)}</div>
                </div>
              </td>
              <td style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; align-items: center;">
                  <div style="text-align: center;">${formatTemperature(formData.lastRackBatch?.ccp2_55?.temp)}</div>
                  <div style="text-align: center;">${formatTime(formData.lastRackBatch?.ccp2_55?.time)}</div>
                  <div style="text-align: center;">${formatInitial(formData.lastRackBatch?.ccp2_55?.initial)}</div>
                </div>
              </td>
              <td style="border: 1px solid black; padding: 4px;">
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1px; align-items: center;">
                  <div style="text-align: center;">${formatTemperature(formData.lastRackBatch?.finalChill?.temp)}</div>
                  <div style="text-align: center;">${formatTime(formData.lastRackBatch?.finalChill?.time)}</div>
                  <div style="text-align: center;">${formatInitial(formData.lastRackBatch?.finalChill?.initial)}</div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Quantity and Flavor Section -->
      ${formData.quantityAndFlavor ? `
        <div style="margin-top: 24px; border: 2px solid black;">
          <div style="background-color: #f3f4f6; padding: 8px; text-align: center; border-bottom: 1px solid black;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold;">Quantity and Flavor</h3>
          </div>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid black; padding: 8px; background-color: #f9fafb;">Batch</th>
                <th style="border: 1px solid black; padding: 8px; background-color: #f9fafb;">Quantity</th>
                <th style="border: 1px solid black; padding: 8px; background-color: #f9fafb;">Flavor</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(formData.quantityAndFlavor).map(([batch, data]: [string, any]) => `
                <tr>
                  <td style="border: 1px solid black; padding: 8px; text-center;">${batch}</td>
                  <td style="border: 1px solid black; padding: 8px;">${data.quantity || ''}</td>
                  <td style="border: 1px solid black; padding: 8px;">${data.flavor || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      ` : ''}

      <!-- Pre-Shipment Review Section -->
      ${formData.preShipmentReview ? `
        <div style="margin-top: 24px; border: 2px solid black;">
          <div style="background-color: #f3f4f6; padding: 8px; text-align: center; border-bottom: 1px solid black;">
            <h3 style="margin: 0; font-size: 16px; font-weight: bold;">Pre-Shipment Review</h3>
          </div>
          <div style="padding: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
              <div>
                <span style="font-weight: 600;">Date: </span>
                <span style="border-bottom: 1px solid #d1d5db; padding: 4px 8px; display: inline-block; min-width: 120px;">
                  ${formData.preShipmentReview.date || ''}
                </span>
              </div>
              <div>
                <span style="font-weight: 600;">Initials: </span>
                <span style="border-bottom: 1px solid #d1d5db; padding: 4px 8px; display: inline-block; min-width: 120px;">
                  ${formData.preShipmentReview.initials || ''}
                </span>
              </div>
              <div>
                <span style="font-weight: 600;">Results: </span>
                <span style="border-bottom: 1px solid #d1d5db; padding: 4px 8px; display: inline-block; min-width: 120px;">
                  ${formData.preShipmentReview.results || ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      ` : ''}

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

const generateBagelDogFormHTML = (formData: PDFFormData): string => {
  // Generate the main form table rows for Bagel Dog form
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

    return formData.entries.map((entry, index) => `
      <tr>
        <td class="border border-black p-2 text-center">
          ${entry.type || ''}
        </td>
        <td class="border border-black p-2 text-center">
          ${index + 1}. ${entry.rack || ''}
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
            <div class="text-center">${formatTemperature(entry.ccp1?.temp)}</div>
            <div class="text-center">${formatTime(entry.ccp1?.time)}</div>
            <div class="text-center">${formatInitial(entry.ccp1?.initial)}</div>
          </div>
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
            <div class="text-center">${formatTemperature(entry.ccp2?.temp)}</div>
            <div class="text-center">${formatTime(entry.ccp2?.time)}</div>
            <div class="text-center">${formatInitial(entry.ccp2?.initial)}</div>
          </div>
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
            <div class="text-center">${formatTemperature(entry.coolingTo80?.temp)}</div>
            <div class="text-center">${formatTime(entry.coolingTo80?.time)}</div>
            <div class="text-center">${formatInitial(entry.coolingTo80?.initial)}</div>
          </div>
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
            <div class="text-center">${formatTemperature(entry.coolingTo54?.temp)}</div>
            <div class="text-center">${formatTime(entry.coolingTo54?.time)}</div>
            <div class="text-center">${formatInitial(entry.coolingTo54?.initial)}</div>
          </div>
        </td>
        <td class="border border-black p-1">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.25rem; align-items: center;">
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
              Bagel Dog Cooking &amp; Cooling
            </h1>
          </div>
          <div style="padding: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
              <div>
                <span style="font-weight: 600;">Date: </span>
                <span style="border-bottom: 2px solid #d1d5db; padding: 4px 8px; display: inline-block; min-width: 150px;">
                  ${formatDate(formData.date)}
                </span>
              </div>
              <div>
                <span style="font-weight: 600;">Lot #: </span>
                <span style="border-bottom: 2px solid #d1d5db; padding: 4px 8px; display: inline-block; min-width: 150px;">
                  ${(formData as any).lotNumber || ''}
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
        <table style="width: 100%; border-collapse: collapse; font-size: 12px; min-width: 900px;">
          <!-- Header Row 1 -->
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="border: 1px solid black; padding: 8px; width: 120px;">First Rack/Last Rack</th>
              <th style="border: 1px solid black; padding: 8px; width: 120px;">Rack # &amp; Flavor</th>
              <th style="border: 1px solid black; padding: 8px; width: 160px;">
                CCP #1. 166°F or higher. Around 200°F for quality<br/>
                <small>Temp, Time, Initial</small>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 160px;">
                CCP #2 127°F or higher<br/>
                <small>Temp, Time, Initial</small>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 160px;">
                80°F or lower within 105 minutes<br/>
                <small>Temp, Time, Initial</small>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 160px;">
                54°F or lower within 4.75 hrs<br/>
                <small>Temp, Time, Initial</small>
              </th>
              <th style="border: 1px solid black; padding: 8px; width: 160px;">
                Chill Continuously to 40°F or below<br/>
                <small>Temp, Time, Initial</small>
              </th>
            </tr>
          </thead>
          <tbody>
            ${generateFormRows()}
          </tbody>
        </table>
      </div>

      <!-- Bottom Sections -->
      <div style="margin-top: 24px; display: grid; grid-template-columns: 1fr 2fr; gap: 24px;">
        <!-- Left Section -->
        <div>
          <!-- Frank Flavor/Size Table -->
          <div style="border: 2px solid black; margin-bottom: 16px;">
            <div style="background-color: #f3f4f6; padding: 8px; text-align: center; border-bottom: 1px solid black;">
              <h3 style="margin: 0; font-size: 14px; font-weight: bold;">Frank Flavor/Size &amp; Packages Used</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background-color: #e5e7eb;">
                  <th style="border: 1px solid black; padding: 4px; text-align: center;">Frank Flavor/Size</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: center;">Lot #(s)</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: center;">Packages Used</th>
                </tr>
              </thead>
              <tbody>
                ${(formData as any).frankFlavorSizeTable ? Object.entries((formData as any).frankFlavorSizeTable).map(([key, item]: [string, any]) => `
                  <tr>
                    <td style="border: 1px solid black; padding: 4px; text-align: center; font-weight: 600;">${item.flavor || ''}</td>
                    <td style="border: 1px solid black; padding: 4px; text-align: center; min-height: 20px;">${item.lotNumbers || ''}</td>
                    <td style="border: 1px solid black; padding: 4px; text-align: center; min-height: 20px;">${item.packagesUsed || ''}</td>
                  </tr>
                `).join('') : ''}
              </tbody>
            </table>
          </div>

          <!-- Thermometer # -->
          <div style="border: 2px solid black; margin-bottom: 16px;">
            <div style="padding: 8px;">
              <span style="font-weight: 600;">Thermometer #: </span>
              <span style="border-bottom: 1px solid black; padding: 4px; display: inline-block; min-width: 150px;">
                ${formData.thermometerNumber || ''}
              </span>
            </div>
          </div>

          <!-- Pre-shipment Review -->
          <div style="border: 2px solid black;">
            <div style="background-color: #f3f4f6; padding: 8px; text-align: center; border-bottom: 1px solid black;">
              <h4 style="margin: 0; font-size: 12px; font-weight: bold;">Pre-shipment Review</h4>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background-color: #e5e7eb;">
                  <th style="border: 1px solid black; padding: 4px; text-align: center;">Date</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: center;">Results</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: center;">Signature</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; min-height: 20px;">
                    ${(formData as any).bagelDogPreShipmentReview?.date || ''}
                  </td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; min-height: 20px;">
                    ${(formData as any).bagelDogPreShipmentReview?.results || ''}
                  </td>
                  <td style="border: 1px solid black; padding: 4px; text-align: center; min-height: 20px;">
                    ${(formData as any).bagelDogPreShipmentReview?.signature || ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Right Section - Ingredients -->
        <div>
          <div style="border: 2px solid black;">
            <div style="background-color: #f3f4f6; padding: 8px; text-align: center; border-bottom: 1px solid black;">
              <h3 style="margin: 0; font-size: 14px; font-weight: bold;">Ingredients &amp; Lot #(s)</h3>
            </div>
            <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
              <thead>
                <tr style="background-color: #e5e7eb;">
                  <th style="border: 1px solid black; padding: 4px; text-align: center;">Ingredients</th>
                  <th style="border: 1px solid black; padding: 4px; text-align: center;">Lot #(s)</th>
                </tr>
              </thead>
              <tbody>
                ${[
                  'Unbleached Wheat Flour',
                  'Large chopped onions',
                  'Yeast',
                  'Toasted onions',
                  'Sugar',
                  'Soybean Oil',
                  'Salt',
                  'Malt',
                  'Egg',
                  'Poppy Seeds'
                ].map((ingredient, index) => `
                  <tr>
                    <td style="border: 1px solid black; padding: 4px; text-align: center; font-weight: 600;">${ingredient}</td>
                    <td style="border: 1px solid black; padding: 4px; text-align: center; min-height: 20px;">
                      ${(formData as any).ingredients?.[ingredient.toLowerCase().replace(/\s+/g, '')] || ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Corrective Actions -->
      ${formData.correctiveActionsComments ? `
        <div style="margin-top: 24px; border: 2px solid black;">
          <div style="background-color: #f3f4f6; padding: 8px; text-align: center; border-bottom: 1px solid black;">
            <h3 style="margin: 0; font-size: 14px; font-weight: bold;">Corrective Actions &amp; Comments</h3>
          </div>
          <div style="padding: 16px; min-height: 128px; font-size: 11px; white-space: pre-wrap;">
            ${formData.correctiveActionsComments}
          </div>
        </div>
      ` : ''}

      <!-- Form Status and Approval Info -->
      ${formData.status === 'Complete' ? `
        <div style="margin-top: 24px; padding: 16px; background-color: #f0fdf4; border: 2px solid #bbf7d0; border-radius: 8px; text-align: center;">
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px; color: #166534;">
            <span style="font-size: 18px; font-weight: 600;">✓ Form Completed Successfully!</span>
          </div>
          <p style="color: #16a34a; margin: 4px 0 0 0;">This form has been finalized and can no longer be edited</p>
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
