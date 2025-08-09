'use client';

import { useEffect, useState } from 'react';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { usePinStore } from '@/stores/pinStore';
import { PaperForm } from '@/components/PaperForm';
import { InitialSelector } from '@/components/InitialSelector';
import { PinAuthModal } from '@/components/PinAuthModal';

export default function FormPage() {
  const { currentForm, createNewForm, selectedInitial, setSelectedInitial } = usePaperFormStore();
  const { isAuthenticated, clearAuthentication } = usePinStore();
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingInitial, setPendingInitial] = useState<string>('');

  // Check if current initial is authenticated
  const isCurrentInitialAuthenticated = selectedInitial ? isAuthenticated(selectedInitial) : false;

  useEffect(() => {
    // Only auto-create a form if we have a selected initial, it's authenticated, and no current form
    if (!currentForm && selectedInitial && isCurrentInitialAuthenticated) {
      createNewForm();
    }
  }, [currentForm, createNewForm, selectedInitial, isCurrentInitialAuthenticated]);

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
            <p className="text-gray-600">Select an initial to view and manage forms</p>
            {selectedInitial && isCurrentInitialAuthenticated && (
              <div className="flex items-center space-x-2 mt-2">
                <div className="flex items-center space-x-1 text-sm text-green-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Authenticated as {selectedInitial}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-xs text-gray-500 hover:text-red-600 hover:underline"
                  title="Logout and clear authentication"
                >
                  Logout
                </button>
              </div>
            )}
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
            <p className="text-gray-600">Please authenticate with your PIN to access forms for "{selectedInitial}".</p>
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
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">No Forms Available</h2>
            <p className="text-gray-600">No forms found for initial "{selectedInitial}". A new form will be created automatically.</p>
          </div>
        </div>
      ) : (
        <PaperForm />
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
