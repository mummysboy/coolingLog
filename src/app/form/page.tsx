'use client';

import { useEffect, useState } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import type { PaperFormEntry } from '@/lib/paperFormTypes';
import { usePinStore } from '@/stores/pinStore';
import { PaperForm } from '@/components/PaperForm';
import { InitialSelector } from '@/components/InitialSelector';
import { PinAuthModal } from '@/components/PinAuthModal';

export default function FormPage() {
  const { currentForm, createNewForm, selectedInitial, setSelectedInitial, updateFormStatus, saveForm, savedForms, loadForm } = usePaperFormStore();
  const { isAuthenticated, clearAuthentication } = usePinStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingInitial, setPendingInitial] = useState<string>('');
  const [formUpdateKey, setFormUpdateKey] = useState(0); // Force re-render when form updates

  // Check if current initial is authenticated
  const isCurrentInitialAuthenticated = selectedInitial ? isAuthenticated(selectedInitial) : false;

  useEffect(() => {
    // Always ensure there's a form for the current day when authenticated
    if (selectedInitial && isCurrentInitialAuthenticated) {
      // Check if there's a form for today
      const today = new Date();
      const todayString = today.toISOString().split('T')[0];
      
      // Look for an existing form for today
      const existingForm = savedForms.find((form: PaperFormEntry) => {
        const formDateString = form.date.toISOString().split('T')[0];
        return form.formInitial === selectedInitial && formDateString === todayString;
      });
      
      if (existingForm) {
        // Load the existing form for today
        if (!currentForm || currentForm.id !== existingForm.id) {
          loadForm(existingForm.id);
        }
      } else if (!currentForm) {
        // Create a new form for today if none exists
        createNewForm();
      }
    }
  }, [selectedInitial, isCurrentInitialAuthenticated, savedForms, currentForm, createNewForm, loadForm]);

  // Handle initial selection with PIN authentication
  const handleInitialChange = (newInitial: string) => {
    if (newInitial === selectedInitial) return;

    // If selecting a new initial, check if it needs authentication
    if (newInitial && !isAuthenticated(newInitial)) {
      setPendingInitial(newInitial);
      setShowPinModal(true);
    } else {
      // Already authenticated or no initial selected
      setSelectedInitial(newInitial);
    }
  };

  // Handle successful PIN authentication
  const handlePinSuccess = () => {
    setShowPinModal(false);
    setSelectedInitial(pendingInitial);
    setPendingInitial('');
  };

  // Handle PIN authentication cancel
  const handlePinCancel = () => {
    setShowPinModal(false);
    setPendingInitial('');
  };

  // Handle logout from current initial
  const handleLogout = () => {
    if (selectedInitial) {
      clearAuthentication(selectedInitial);
      setSelectedInitial('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Header with Initial Selector */}
      <div className="max-w-7xl mx-auto px-4 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Chilling Log Form</h1>
          </div>
          <InitialSelector onInitialChange={handleInitialChange} />
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
      ) : !isCurrentInitialAuthenticated ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-xl border-2 border-orange-200">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please authenticate with your PIN to access forms for &quot;{selectedInitial}&quot;.</p>
            <button
              onClick={() => {
                setPendingInitial(selectedInitial);
                setShowPinModal(true);
              }}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Enter PIN
            </button>
          </div>
        </div>
      ) : !currentForm ? (
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center py-12 bg-white rounded-xl border-2 border-gray-200">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Form...</h2>
            <p className="text-gray-600">Please wait while we prepare your form for today.</p>
          </div>
        </div>
      ) : (
        <PaperForm 
          key={formUpdateKey}
          onFormUpdate={(formId, updates) => {
            console.log('Form updated in form page:', formId, updates);
            // Handle status updates by calling the store's updateFormStatus function
            if (updates.status) {
              console.log('Status updated to:', updates.status, 'updating store');
              updateFormStatus(formId, updates.status);
              // Ensure the form is saved to persist the status change
              setTimeout(() => saveForm(), 100);
            }
          }}
        />
      )}

      {/* PIN Authentication Modal */}
      <PinAuthModal
        isOpen={showPinModal}
        initials={pendingInitial}
        onSuccess={handlePinSuccess}
        onCancel={handlePinCancel}
      />
    </div>
  );
}
