'use client';

import { useEffect } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperForm } from '@/components/PaperForm';
import { InitialSelector } from '@/components/InitialSelector';

export default function FormPage() {
  const { currentForm, createNewForm, selectedInitial } = usePaperFormStore();

  useEffect(() => {
    // Only auto-create a form if we have a selected initial and no current form
    if (!currentForm && selectedInitial) {
      createNewForm();
    }
  }, [currentForm, createNewForm, selectedInitial]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header with Initial Selector */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Chilling Log Form</h1>
            <p className="text-gray-600">Select an initial to view and manage forms</p>
          </div>
          <InitialSelector />
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
      ) : !currentForm ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Forms Available</h2>
            <p className="text-gray-600">No forms found for initial "{selectedInitial}". A new form will be created automatically.</p>
          </div>
        </div>
      ) : (
        <PaperForm />
      )}
    </div>
  );
}
