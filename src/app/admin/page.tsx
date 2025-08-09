'use client';

import { useState, useEffect, useRef } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { useInitialsStore } from '@/stores/initialsStore';
import { usePinStore } from '@/stores/pinStore';
import { MOCK_USERS } from '@/lib/types';
import { PaperFormEntry } from '@/lib/paperFormTypes';
import { PaperForm } from '@/components/PaperForm';
import { getFormValidationSummary } from '@/lib/validation';

export default function AdminDashboard() {
  const { savedForms, currentForm, loadForm, updateFormStatus, deleteForm, isFormBlank } = usePaperFormStore();
  const { initials, addInitial, removeInitial, toggleInitialStatus } = useInitialsStore();
  const { createPin, updatePin, deletePin, getAllPins, getPinForInitials } = usePinStore();
  const [selectedForm, setSelectedForm] = useState<PaperFormEntry | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showInitialModal, setShowInitialModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [newInitialData, setNewInitialData] = useState({ initials: '', name: '' });
  const [pinModalData, setPinModalData] = useState({ initials: '', pin: '', isEdit: false });
  const settingsDropdownRef = useRef<HTMLDivElement>(null);

  const adminUser = MOCK_USERS.find(user => user.role === 'admin');

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target as Node)) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleViewForm = (form: PaperFormEntry) => {
    setSelectedForm(form);
    setShowFormModal(true);
    // Load the selected form into the store for editing
    loadForm(form.id);
  };

  const handleAddInitial = () => {
    if (newInitialData.initials.trim() && newInitialData.name.trim() && adminUser) {
      addInitial(newInitialData.initials.trim().toUpperCase(), newInitialData.name.trim(), adminUser.initials);
      setNewInitialData({ initials: '', name: '' });
      setShowInitialModal(false);
    }
  };

  const handleRemoveInitial = (id: string) => {
    if (confirm('Are you sure you want to remove this initial? This action cannot be undone.')) {
      const initial = initials.find(i => i.id === id);
      if (initial) {
        // Also remove PIN if it exists
        deletePin(initial.initials);
      }
      removeInitial(id);
    }
  };

  // PIN Management Functions
  const handleCreatePin = (initials: string) => {
    setPinModalData({ initials, pin: '', isEdit: false });
    setShowPinModal(true);
  };

  const handleEditPin = (initials: string) => {
    const existingPin = getPinForInitials(initials);
    setPinModalData({ 
      initials, 
      pin: existingPin?.pin || '', 
      isEdit: true 
    });
    setShowPinModal(true);
  };

  const handleDeletePin = (initials: string) => {
    if (confirm(`Are you sure you want to delete the PIN for "${initials}"? This will prevent them from accessing their forms.`)) {
      deletePin(initials);
    }
  };

  const handlePinSubmit = () => {
    const { initials: targetInitials, pin, isEdit } = pinModalData;
    
    if (!targetInitials.trim() || !pin.trim()) {
      alert('Please enter both initials and PIN');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      alert('PIN must be exactly 4 digits');
      return;
    }

    if (!adminUser) {
      alert('Admin user not found');
      return;
    }

    let success = false;
    if (isEdit) {
      success = updatePin(targetInitials, pin, adminUser.initials);
    } else {
      success = createPin(targetInitials, pin, adminUser.initials);
    }

    if (success) {
      setShowPinModal(false);
      setPinModalData({ initials: '', pin: '', isEdit: false });
    } else {
      alert(isEdit ? 'Failed to update PIN' : 'Failed to create PIN. PIN may already exist.');
    }
  };

  const handleStatusChange = (formId: string, newStatus: 'Complete' | 'In Progress' | 'Non-compliant') => {
    updateFormStatus(formId, newStatus);
  };

  const handlePrintForm = (form: PaperFormEntry) => {
    // Open form in a new window that matches the exact PaperForm component styling
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Food Chilling Log - Form #${form.id.slice(-6)}</title>
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
                <h1>Cooking and Cooling for Meat & Non Meat Ingredients</h1>
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

  const handleDeleteForm = (formId: string) => {
    if (confirm('Are you sure you want to delete this form? This action cannot be undone.')) {
      deleteForm(formId);
    }
  };

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

  const renderStatusDropdown = (form: PaperFormEntry) => {
    const getStatusStyles = (status: string) => {
      switch (status) {
        case 'Complete':
          return {
            bg: 'bg-green-100 hover:bg-green-200',
            text: 'text-green-800',
            border: 'border-green-300',
            ring: 'focus:ring-green-500',
            icon: '✓'
          };
        case 'In Progress':
          return {
            bg: 'bg-yellow-100 hover:bg-yellow-200',
            text: 'text-yellow-800',
            border: 'border-yellow-300',
            ring: 'focus:ring-yellow-500',
            icon: '⏳'
          };
        case 'Non-compliant':
          return {
            bg: 'bg-red-100 hover:bg-red-200',
            text: 'text-red-800',
            border: 'border-red-300',
            ring: 'focus:ring-red-500',
            icon: '❌'
          };
        default:
          return {
            bg: 'bg-gray-100 hover:bg-gray-200',
            text: 'text-gray-800',
            border: 'border-gray-300',
            ring: 'focus:ring-blue-500',
            icon: '?'
          };
      }
    };

    const styles = getStatusStyles(form.status);

    return (
      <select
        value={form.status}
        onChange={(e) => handleStatusChange(form.id, e.target.value as 'Complete' | 'In Progress' | 'Non-compliant')}
        className={`
          cursor-pointer
          px-3 py-2 text-sm font-medium 
          rounded-lg border-2 
          transition-all duration-200 ease-in-out
          focus:outline-none focus:ring-2 focus:ring-offset-1
          shadow-sm hover:shadow-md
          ${styles.bg} ${styles.text} ${styles.border} ${styles.ring}
        `}
        title={`Change status from ${form.status}`}
      >
        <option value="Complete">✓ Complete</option>
        <option value="In Progress">⏳ In Progress</option>
        <option value="Non-compliant">❌ Non-compliant</option>
      </select>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">Food Safety Form Management</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* Settings Dropdown */}
            <div className="relative" ref={settingsDropdownRef}>
              <button
                onClick={() => setShowSettingsDropdown(!showSettingsDropdown)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium">Settings</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showSettingsDropdown ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showSettingsDropdown && (
                <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b">
                      Initial Management
                    </div>
                    <button
                      onClick={() => {
                        setShowInitialModal(true);
                        setShowSettingsDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      <span>Add New Initial</span>
                    </button>
                    
                    <div className="border-t border-gray-100 mt-1">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        PIN Management
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-100 mt-1">
                      <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Current Initials ({initials.filter(i => i.isActive).length} active)
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {initials.map((initial) => {
                          const hasPin = getPinForInitials(initial.initials) !== null;
                          
                          return (
                            <div key={initial.id} className="px-4 py-2 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">{initial.initials}</span>
                                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${initial.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                      {initial.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className={`px-1.5 py-0.5 text-xs rounded-full ${hasPin ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                                      {hasPin ? 'PIN Set' : 'No PIN'}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">{initial.name}</div>
                                </div>
                                <div className="flex space-x-1">
                                  {/* PIN Management Buttons */}
                                  {hasPin ? (
                                    <>
                                      <button
                                        onClick={() => {
                                          handleEditPin(initial.initials);
                                          setShowSettingsDropdown(false);
                                        }}
                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded text-xs"
                                        title="Edit PIN"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                      </button>
                                      <button
                                        onClick={() => {
                                          handleDeletePin(initial.initials);
                                          setShowSettingsDropdown(false);
                                        }}
                                        className="p-1 text-orange-600 hover:bg-orange-50 rounded text-xs"
                                        title="Delete PIN"
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                      </button>
                                    </>
                                  ) : (
                                    <button
                                      onClick={() => {
                                        handleCreatePin(initial.initials);
                                        setShowSettingsDropdown(false);
                                      }}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded text-xs"
                                      title="Create PIN"
                                    >
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                    </button>
                                  )}
                                  
                                  {/* Existing Buttons */}
                                  <button
                                    onClick={() => toggleInitialStatus(initial.id)}
                                    className={`p-1 rounded text-xs ${initial.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                                    title={initial.isActive ? 'Deactivate' : 'Activate'}
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      {initial.isActive ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9V6a4 4 0 118 0v3M5 12h14l-1 7H6l-1-7z" />
                                      ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                      )}
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleRemoveInitial(initial.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded text-xs"
                                    title="Delete"
                                  >
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <p className="font-medium text-gray-900">{adminUser?.name}</p>
              <p className="text-sm text-gray-600">{adminUser?.role}</p>
            </div>
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{adminUser?.initials}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Controls */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Submitted Forms</h2>
              <p className="text-gray-600">Monitor and review food safety forms</p>
            </div>
          </div>

          {/* Forms Table */}
          <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {savedForms.filter(form => !isFormBlank(form)).map((form) => {
                    const completeEntries = form.entries.filter(entry => 
                      entry.type && entry.ccp1.temp && entry.ccp2.temp && 
                      entry.coolingTo80.temp && entry.coolingTo54.temp && entry.finalChill.temp
                    ).length;
                    const validation = getFormValidationSummary(form);
                    
                    return (
                      <tr 
                        key={form.id} 
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Form #{form.id.slice(-6)}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(form.date).toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              Therm: {form.thermometerNumber || 'Not set'}
                            </div>
                            <div className="text-sm text-blue-600 font-medium">
                              Initial: {form.formInitial || 'No initial'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {renderStatusDropdown(form)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewForm(form)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 hover:text-blue-700 transition-colors"
                              title="View and edit form details"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              View
                            </button>
                            
                            <button
                              onClick={() => handlePrintForm(form)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-md hover:bg-gray-100 hover:text-gray-700 transition-colors"
                              title="Print this form"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                              </svg>
                              Print
                            </button>
                            
                            <button
                              onClick={() => handleDeleteForm(form.id)}
                              className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 hover:text-red-700 transition-colors"
                              title="Delete this form permanently"
                            >
                              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {savedForms.filter(form => !isFormBlank(form)).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200 mt-6">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Forms Submitted</h3>
              <p className="text-gray-500">Forms will appear here once they are submitted through the form entry page.</p>
            </div>
          )}
        </div>
      </main>

      {/* Form Details Modal */}
      {showFormModal && selectedForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-50 rounded-2xl w-full h-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center p-4 bg-white border-b">
              <h3 className="text-xl font-semibold">Edit Form - {new Date(selectedForm.date).toLocaleDateString()}</h3>
              <button
                onClick={() => setShowFormModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <PaperForm />
            </div>
          </div>
        </div>
      )}

      {/* Add Initial Modal */}
      {showInitialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Add New Initial</h3>
              <button
                onClick={() => {
                  setShowInitialModal(false);
                  setNewInitialData({ initials: '', name: '' });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Initials
                </label>
                <input
                  type="text"
                  value={newInitialData.initials}
                  onChange={(e) => setNewInitialData(prev => ({ ...prev, initials: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g., JD"
                  maxLength={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newInitialData.name}
                  onChange={(e) => setNewInitialData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  placeholder="e.g., John Doe"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowInitialModal(false);
                  setNewInitialData({ initials: '', name: '' });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddInitial}
                disabled={!newInitialData.initials.trim() || !newInitialData.name.trim()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Initial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PIN Management Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">
                {pinModalData.isEdit ? 'Edit PIN' : 'Create PIN'} for {pinModalData.initials}
              </h3>
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinModalData({ initials: '', pin: '', isEdit: false });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  4-Digit PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={pinModalData.pin}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ''); // Only digits
                    setPinModalData(prev => ({ ...prev, pin: value }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-center text-xl font-mono tracking-widest"
                  placeholder="••••"
                />
                <p className="text-xs text-gray-500 mt-1">Enter exactly 4 digits</p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Security Notice:</p>
                    <p>This PIN will be required to access forms for this initial. Share it securely with the user.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 p-6 border-t">
              <button
                onClick={() => {
                  setShowPinModal(false);
                  setPinModalData({ initials: '', pin: '', isEdit: false });
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pinModalData.pin.length !== 4}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pinModalData.isEdit ? 'Update PIN' : 'Create PIN'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
