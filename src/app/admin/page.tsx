'use client';

import { useState, useEffect } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { MOCK_USERS } from '@/lib/types';
import { PaperFormEntry } from '@/lib/paperFormTypes';
import { PaperForm } from '@/components/PaperForm';

export default function AdminDashboard() {
  const { savedForms, currentForm, loadForm } = usePaperFormStore();
  const [selectedForm, setSelectedForm] = useState<PaperFormEntry | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);

  const adminUser = MOCK_USERS.find(user => user.role === 'admin');

  const handleViewForm = (form: PaperFormEntry) => {
    setSelectedForm(form);
    setShowFormModal(true);
    // Load the selected form into the store for editing
    loadForm(form.id);
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
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl border-2 border-gray-200 p-6">
              <div className="text-2xl font-bold text-gray-900">{savedForms.length}</div>
              <div className="text-gray-600">Total Forms</div>
            </div>
            <div className="bg-white rounded-xl border-2 border-yellow-200 p-6">
              <div className="text-2xl font-bold text-yellow-800">
                {savedForms.filter(form => hasCompleteData(form) && form.entries.some(entry => entry.type)).length}
              </div>
              <div className="text-yellow-700">In Progress</div>
            </div>
            <div className="bg-white rounded-xl border-2 border-green-200 p-6">
              <div className="text-2xl font-bold text-green-800">
                {savedForms.filter(form => form.entries.filter(entry => 
                  entry.type && entry.ccp1.temp && entry.ccp2.temp && 
                  entry.coolingTo80.temp && entry.coolingTo54.temp && entry.finalChill.temp
                ).length > 0).length}
              </div>
              <div className="text-green-700">Complete</div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Submitted Forms</h2>
                <p className="text-gray-600">Monitor and review food safety forms</p>
              </div>
              <div className="flex space-x-3">
                <a
                  href="/form"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  New Form Entry
                </a>
              </div>
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
              <p className="text-gray-500">No forms submitted yet.</p>
              <a
                href="/form"
                className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create First Form
              </a>
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
    </div>
  );
}
