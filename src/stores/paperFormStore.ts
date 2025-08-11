import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaperFormEntry, createEmptyForm } from '@/lib/paperFormTypes';
import { validateForm, generateErrorId } from '@/lib/validation';

interface PaperFormStore {
  currentForm: PaperFormEntry | null;
  savedForms: PaperFormEntry[];
  selectedInitial: string;
  
  // Actions
  createNewForm: (initial?: string) => void;
  updateEntry: (rowIndex: number, field: string, value: string) => void;
  updateFormField: (field: string, value: any) => void;
  updateFormStatus: (formId: string, status: 'Complete' | 'In Progress' | 'Error') => void;
  deleteForm: (formId: string) => void;
  saveForm: () => void;
  loadForm: (id: string) => void;
  isFormBlank: (form: PaperFormEntry) => boolean;
  setSelectedInitial: (initial: string) => void;
  getFormsByInitial: (initial: string) => PaperFormEntry[];
  getFormsForCurrentInitial: () => PaperFormEntry[];
  getFormByDateAndInitial: (date: Date, initial: string) => PaperFormEntry | null;
  
  // Admin comment actions
  addAdminComment: (formId: string, adminInitial: string, comment: string) => void;
  resolveError: (formId: string, errorId: string) => void;
  unresolveError: (formId: string, errorId: string) => void;
  
  // Admin form updates
  updateAdminForm: (formId: string, updates: Partial<PaperFormEntry>) => void;
  
  // Debug function to export current state
  exportState: () => {
    savedFormsCount: number;
    savedFormIds: string[];
    currentFormId: string | null;
    currentFormStatus: 'Complete' | 'In Progress' | 'Error' | null;
    selectedInitial: string;
  };
}

export const usePaperFormStore = create<PaperFormStore>()(
  persist(
    (set, get) => ({
      currentForm: null,
      savedForms: [],
      selectedInitial: '',

      createNewForm: (initial) => {
        const { selectedInitial } = get();
        const formInitial = initial || selectedInitial;
        const newForm = createEmptyForm(formInitial);
        set({ currentForm: newForm });
      },

      updateEntry: (rowIndex, field, value) => {
        const { currentForm } = get();
        if (!currentForm || rowIndex < 0 || rowIndex >= currentForm.entries.length) return;

        const updatedEntries = [...currentForm.entries];
        const [section, subField] = field.split('.');
        
        if (subField) {
          const entry = updatedEntries[rowIndex];
          const sectionData = entry[section as keyof typeof entry] as any;
          updatedEntries[rowIndex] = {
            ...entry,
            [section]: {
              ...sectionData,
              [subField]: value,
            },
          };
        } else {
          updatedEntries[rowIndex] = {
            ...updatedEntries[rowIndex],
            [field]: value,
          };
        }

        set({
          currentForm: {
            ...currentForm,
            entries: updatedEntries,
          },
        });
      },

      updateFormField: (field, value) => {
        const { currentForm } = get();
        if (!currentForm) return;

        // Handle nested fields like ingredients.beef or lotNumbers.chicken
        if (field.includes('.')) {
          const [mainField, subField] = field.split('.');
          const mainFieldData = currentForm[mainField as keyof PaperFormEntry] as any;
          set({
            currentForm: {
              ...currentForm,
              [mainField]: {
                ...mainFieldData,
                [subField]: value,
              },
            },
          });
        } else {
          set({
            currentForm: {
              ...currentForm,
              [field]: value,
            },
          });
        }
      },

      updateFormStatus: (formId, status) => {
        console.log('updateFormStatus called with formId:', formId, 'status:', status);
        const { savedForms, currentForm } = get();
        const updatedForms = savedForms.map(form => 
          form.id === formId ? { ...form, status } : form
        );
        
        // Also update current form if it matches
        const updatedCurrentForm = currentForm?.id === formId 
          ? { ...currentForm, status }
          : currentForm;
        
        console.log('Setting new state with updated forms, new status for form:', status);
        set({ savedForms: updatedForms, currentForm: updatedCurrentForm });
      },

      deleteForm: (formId) => {
        const { savedForms, currentForm } = get();
        
        // Find the form being deleted for logging
        const formToDelete = savedForms.find(form => form.id === formId);
        if (formToDelete) {
          console.log('Deleting form completely:', {
            id: formToDelete.id,
            date: formToDelete.date,
            initial: formToDelete.formInitial,
            status: formToDelete.status,
            entriesCount: formToDelete.entries.length,
            hasAdminComments: formToDelete.adminComments?.length > 0,
            hasResolvedErrors: formToDelete.resolvedErrors?.length > 0
          });
        }
        
        // Remove the form from savedForms
        const updatedForms = savedForms.filter(form => form.id !== formId);
        
        // Clear current form if it's the one being deleted
        const updatedCurrentForm = currentForm?.id === formId ? null : currentForm;
        
        // Update the state
        set({ savedForms: updatedForms, currentForm: updatedCurrentForm });
        
        console.log('Form deletion completed. Remaining forms:', updatedForms.length);
        
        // Verify deletion was complete
        setTimeout(() => {
          const { savedForms: verifyForms } = get();
          const formStillExists = verifyForms.some(form => form.id === formId);
          if (formStillExists) {
            console.error('Form deletion verification failed - form still exists:', formId);
          } else {
            console.log('Form deletion verification successful - form completely removed:', formId);
          }
          
          // Additional cleanup check - ensure no orphaned references
          const { currentForm: currentFormCheck } = get();
          if (currentFormCheck?.id === formId) {
            console.error('Orphaned currentForm reference found after deletion:', formId);
            // Force clear any orphaned references
            set({ currentForm: null });
          }
        }, 100);
      },

      isFormBlank: (form) => {
        // Check if form has any meaningful data
        const hasEntryData = form.entries.some(entry => 
          entry.type || 
          entry.ccp1.temp || entry.ccp1.time || entry.ccp1.initial ||
          entry.ccp2.temp || entry.ccp2.time || entry.ccp2.initial ||
          entry.coolingTo80.temp || entry.coolingTo80.time || entry.coolingTo80.initial ||
          entry.coolingTo54.temp || entry.coolingTo54.time || entry.coolingTo54.initial ||
          entry.finalChill.temp || entry.finalChill.time || entry.finalChill.initial
        );
        
        const hasFormData = 
          form.thermometerNumber ||
          form.ingredients.beef || form.ingredients.chicken || form.ingredients.liquidEggs ||
          form.lotNumbers.beef || form.lotNumbers.chicken || form.lotNumbers.liquidEggs ||
          form.correctiveActionsComments;
        
        return !hasEntryData && !hasFormData;
      },

      saveForm: () => {
        const { currentForm, savedForms, isFormBlank } = get();
        if (!currentForm) return;

        // Don't save blank forms
        if (isFormBlank(currentForm)) {
          return;
        }

        const existingIndex = savedForms.findIndex(form => form.id === currentForm.id);
        const updatedForms = existingIndex >= 0 
          ? savedForms.map((form, index) => index === existingIndex ? currentForm : form)
          : [...savedForms, currentForm];

        set({ savedForms: updatedForms });
      },

      loadForm: (id) => {
        const { savedForms } = get();
        const form = savedForms.find(form => form.id === id);
        if (form) {
          // Ensure the form has all required fields (migration for existing forms)
          const migratedForm = {
            ...form,
            adminComments: form.adminComments || [],
            resolvedErrors: form.resolvedErrors || [],
          };
          set({ currentForm: migratedForm });
        }
      },

      setSelectedInitial: (initial) => {
        set({ selectedInitial: initial });
      },

      getFormsByInitial: (initial) => {
        const { savedForms } = get();
        return savedForms.filter(form => form.formInitial === initial);
      },

      getFormsForCurrentInitial: () => {
        const { savedForms, selectedInitial } = get();
        return savedForms.filter(form => form.formInitial === selectedInitial);
      },

      getFormByDateAndInitial: (date, initial) => {
        const { savedForms } = get();
        // Convert date to string for comparison (YYYY-MM-DD format)
        const targetDateStr = date.toISOString().split('T')[0];
        
        return savedForms.find(form => {
          const formDateStr = form.date.toISOString().split('T')[0];
          return formDateStr === targetDateStr && form.formInitial === initial;
        }) || null;
      },

      // Admin comment actions
      addAdminComment: (formId, adminInitial, comment) => {
        const { savedForms, currentForm } = get();
        
        const newComment = {
          id: Date.now().toString(),
          adminInitial,
          comment,
          timestamp: new Date(),
        };
        
        // Update saved forms
        const updatedForms = savedForms.map(form => 
          form.id === formId 
            ? { 
                ...form, 
                adminComments: [...(form.adminComments || []), newComment],
                resolvedErrors: form.resolvedErrors || []
              }
            : form
        );
        
        // Update current form if it matches
        const updatedCurrentForm = currentForm?.id === formId 
          ? { 
              ...currentForm, 
              adminComments: [...(currentForm.adminComments || []), newComment],
              resolvedErrors: currentForm.resolvedErrors || []
            }
          : currentForm;
        
        set({ savedForms: updatedForms, currentForm: updatedCurrentForm });
      },
      
      resolveError: (formId, errorId) => {
        const { savedForms, currentForm } = get();
        
        // Update saved forms
        const updatedForms = savedForms.map(form => {
          if (form.id === formId) {
            const newResolvedErrors = [...(form.resolvedErrors || []), errorId];
            
            // Check if all validation errors are now resolved
            const validation = validateForm(form);
            const allErrorIds = validation.errors.map(error => generateErrorId(error));
            const allErrorsResolved = allErrorIds.every(id => newResolvedErrors.includes(id));
            
            return {
              ...form,
              resolvedErrors: newResolvedErrors,
              adminComments: form.adminComments || [],
              // If all errors are resolved and this was an error form, change status to 'In Progress'
              status: (form.status === 'Error' && allErrorsResolved) ? 'In Progress' : form.status
            };
          }
          return form;
        });
        
        // Update current form if it matches
        const updatedCurrentForm = currentForm?.id === formId 
          ? {
              ...currentForm,
              resolvedErrors: [...(currentForm.resolvedErrors || []), errorId],
              adminComments: currentForm.adminComments || [],
              // Check if all errors are resolved
              status: (() => {
                const validation = validateForm(currentForm);
                const allErrorIds = validation.errors.map(error => generateErrorId(error));
                const allErrorsResolved = allErrorIds.every(id => [...(currentForm.resolvedErrors || []), errorId].includes(id));
                return (currentForm.status === 'Error' && allErrorsResolved) ? 'In Progress' : currentForm.status;
              })()
            }
          : currentForm;
        
        set({ savedForms: updatedForms, currentForm: updatedCurrentForm });
      },
      
      unresolveError: (formId, errorId) => {
        const { savedForms, currentForm } = get();
        
        // Update saved forms
        const updatedForms = savedForms.map(form => 
          form.id === formId 
            ? { 
                ...form, 
                resolvedErrors: (form.resolvedErrors || []).filter(id => id !== errorId),
                adminComments: form.adminComments || []
              }
            : form
        );
        
        // Update current form if it matches
        const updatedCurrentForm = currentForm?.id === formId 
          ? { 
              ...currentForm, 
              resolvedErrors: (currentForm.resolvedErrors || []).filter(id => id !== errorId),
              adminComments: currentForm.adminComments || []
            }
          : currentForm;
        
        set({ savedForms: updatedForms, currentForm: updatedCurrentForm });
      },
      
      updateAdminForm: (formId, updates) => {
        const { savedForms, currentForm } = get();
        
        console.log('updateAdminForm called with formId:', formId, 'updates:', updates);
        console.log('Current savedForms count:', savedForms.length);
        
        // Find the form being updated
        const formToUpdate = savedForms.find(form => form.id === formId);
        console.log('Form to update - current status:', formToUpdate?.status, 'new status:', updates.status);
        
        // Update saved forms
        const updatedForms = savedForms.map(form => 
          form.id === formId 
            ? { ...form, ...updates }
            : form
        );
        
        // Update current form if it matches
        const updatedCurrentForm = currentForm?.id === formId 
          ? { ...currentForm, ...updates }
          : currentForm;
        
        console.log('Setting new state with updated forms, form status will be:', updates.status);
        set({ savedForms: updatedForms, currentForm: updatedCurrentForm });
        
        // Verify the update was applied
        setTimeout(() => {
          const { savedForms: newSavedForms } = get();
          const updatedForm = newSavedForms.find(form => form.id === formId);
          console.log('Verification - form status after update:', updatedForm?.status);
        }, 50);
      },
      
      // Debug function to export current state
      exportState: () => {
        const state = get();
        return {
          savedFormsCount: state.savedForms.length,
          savedFormIds: state.savedForms.map(form => form.id),
          currentFormId: state.currentForm?.id || null,
          currentFormStatus: state.currentForm?.status || null,
          selectedInitial: state.selectedInitial
        };
      },
    }),
    {
      name: 'paper-form-storage',
      partialize: (state) => ({ savedForms: state.savedForms, selectedInitial: state.selectedInitial }),
      onRehydrateStorage: () => (state) => {
        if (state?.savedForms) {
          // Convert date strings back to Date objects and ensure all required fields exist
          state.savedForms = state.savedForms.map(form => ({
            ...form,
            date: new Date(form.date),
            adminComments: form.adminComments || [],
            resolvedErrors: form.resolvedErrors || [],
          }));
        }
      },
    }
  )
);
