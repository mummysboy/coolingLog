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
  const [isLoadingForm, setIsLoadingForm] = useState(false);

  // Check if current initial is authenticated
  const isCurrentInitialAuthenticated = selectedInitial ? isAuthenticated(selectedInitial) : false;

  // Effect to handle form loading when initial changes
  useEffect(() => {
    console.log('Form page useEffect triggered:', {
      selectedInitial,
      isCurrentInitialAuthenticated,
      currentFormId: currentForm?.id,
      currentFormInitial: currentForm?.formInitial,
      savedFormsCount: savedForms.length
    });

    if (!selectedInitial) {
      // No initial selected, clear any current form
      console.log('No initial selected, clearing form');
      return;
    }

    if (!isCurrentInitialAuthenticated) {
      // Not authenticated, don't load forms yet
      console.log('Initial not authenticated yet:', selectedInitial);
      return;
    }

    // Clear current form when initial changes to ensure clean state
    if (currentForm && currentForm.formInitial !== selectedInitial) {
      // Force clear the current form when switching to a different initial
      console.log('Switching to different initial, clearing current form');
      setFormUpdateKey(prev => prev + 1);
      return;
    }

    // Load or create form for the current initial
    const loadFormForInitial = async () => {
      console.log('Loading form for initial:', selectedInitial);
      setIsLoadingForm(true);
      
      try {
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
          console.log('Found existing form for today:', existingForm.id);
          if (!currentForm || currentForm.id !== existingForm.id) {
            loadForm(existingForm.id);
          }
        } else if (!currentForm) {
          // Create a new form for today if none exists
          console.log('Creating new form for initial:', selectedInitial);
          createNewForm(selectedInitial);
        }
      } catch (error) {
        console.error('Error loading form for initial:', error);
      } finally {
        setIsLoadingForm(false);
      }
    };

    loadFormForInitial();
  }, [selectedInitial, isCurrentInitialAuthenticated, savedForms, currentForm, createNewForm, loadForm]);

  // Handle initial selection with PIN authentication
  const handleInitialChange = (newInitial: string) => {
    console.log('handleInitialChange called:', { newInitial, currentInitial: selectedInitial });
    
    if (newInitial === selectedInitial) return;

    // Clear current form when changing initials to force refresh
    if (currentForm) {
      console.log('Clearing current form for initial change');
      // Reset the current form to trigger a clean state
      setFormUpdateKey(prev => prev + 1);
    }

    // If selecting a new initial, check if it needs authentication
    if (newInitial && !isAuthenticated(newInitial)) {
      console.log('New initial requires authentication:', newInitial);
      setPendingInitial(newInitial);
      setShowPinModal(true);
    } else {
      // Already authenticated or no initial selected
      console.log('Setting new initial (already authenticated):', newInitial);
      setSelectedInitial(newInitial);
    }
  };

  // Handle successful PIN authentication
  const handlePinSuccess = () => {
    setShowPinModal(false);
    setSelectedInitial(pendingInitial);
    setPendingInitial('');
    // Force a refresh after successful authentication
    setFormUpdateKey(prev => prev + 1);
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
      // Clear current form and force refresh
      setFormUpdateKey(prev => prev + 1);
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
      ) : isLoadingForm || !currentForm ? (
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
