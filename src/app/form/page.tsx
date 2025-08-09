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
      {/* Form */}
      <PaperForm />
    </div>
  );
}
