'use client';

import { useEffect } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperForm } from '@/components/PaperForm';

export default function FormPage() {
  const { currentForm, createNewForm, savedForms } = usePaperFormStore();

  useEffect(() => {
    if (!currentForm) {
      createNewForm();
    }
  }, [currentForm, createNewForm]);

  if (!currentForm) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading form...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Food Safety Log</h1>
            <p className="text-gray-600">Digital replica of paper form</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={createNewForm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              New Form
            </button>
            <a
              href="/admin"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Admin Dashboard
            </a>
          </div>
        </div>
        {savedForms.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            {savedForms.length} form(s) saved locally
          </div>
        )}
      </div>

      {/* Form */}
      <PaperForm />
    </div>
  );
}
