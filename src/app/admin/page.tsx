'use client';

import { useState, useEffect, useRef } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { useInitialsStore } from '@/stores/initialsStore';
import { MOCK_USERS } from '@/lib/types';
import { PaperFormEntry } from '@/lib/paperFormTypes';
import { PaperForm } from '@/components/PaperForm';

export default function AdminDashboard() {
  const { savedForms, currentForm, loadForm } = usePaperFormStore();
  const { initials, addInitial, removeInitial, toggleInitialStatus } = useInitialsStore();
  const [selectedForm, setSelectedForm] = useState<PaperFormEntry | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [showInitialModal, setShowInitialModal] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [newInitialData, setNewInitialData] = useState({ initials: '', name: '' });
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
      removeInitial(id);
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

  const getFormStatus = (form: PaperFormEntry) => {
    if (!hasCompleteData(form)) {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">📝 Draft</span>;
    }
    
    const completeEntries = form.entries.filter(entry => 
      entry.type && 
      entry.ccp1.temp && 
      entry.ccp2.temp && 
      entry.coolingTo80.temp && 
      entry.coolingTo54.temp && 
      entry.finalChill.temp
    ).length;
    
    if (completeEntries === 0) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">⏳ In Progress</span>;
    }
    
    return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">✓ Complete</span>;
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
                        Current Initials ({initials.filter(i => i.isActive).length} active)
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {initials.map((initial) => (
                          <div key={initial.id} className="px-4 py-2 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-medium text-gray-900">{initial.initials}</span>
                                  <span className={`px-1.5 py-0.5 text-xs rounded-full ${initial.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {initial.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">{initial.name}</div>
                              </div>
                              <div className="flex space-x-1">
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
                        ))}
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
                      Products
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Entries
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {savedForms.map((form) => {
                    const completeEntries = form.entries.filter(entry => 
                      entry.type && entry.ccp1.temp && entry.ccp2.temp && 
                      entry.coolingTo80.temp && entry.coolingTo54.temp && entry.finalChill.temp
                    ).length;
                    const usedProducts = form.entries.filter(entry => entry.type).map(entry => entry.type).join(', ') || 'No products';
                    
                    return (
                      <tr key={form.id} className="hover:bg-gray-50">
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
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {usedProducts}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getFormStatus(form)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm">
                            <span className="text-green-600">{completeEntries}/9 complete</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleViewForm(form)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {savedForms.length === 0 && (
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
              <PaperForm onSave={() => setShowFormModal(false)} />
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
    </div>
  );
}
