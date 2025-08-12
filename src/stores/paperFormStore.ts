import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaperFormEntry, FormType, createEmptyForm, ensureDate } from '@/lib/paperFormTypes';
import { awsStorageManager } from '@/lib/awsService';

interface PaperFormStore {
  currentForm: PaperFormEntry | null;
  savedForms: PaperFormEntry[];
  selectedInitial: string | null;
  
  // Actions
  createNewForm: (formType: FormType, formInitial?: string) => void;
  updateFormStatus: (formId: string, status: 'Complete' | 'In Progress' | 'Error') => void;
  saveForm: () => Promise<void>;
  loadForm: (formId: string) => void;
  deleteForm: (formId: string) => Promise<void>;
  loadFormsFromStorage: () => Promise<void>;
  clearAllForms: () => Promise<void>; // Add this function
  clearAllFormsLocally: () => void; // Add local fallback method
  
  // Form management
  updateFormField: (formId: string, field: string, value: any) => void;
  updateFormRow: (formId: string, rowIndex: number, rowData: any) => void;
  updateFormRowStage: (formId: string, rowIndex: number, stage: string, stageData: any) => void;
  updateEntry: (rowIndex: number, field: string, value: any) => void;
  updateAdminForm: (formId: string, updates: Partial<PaperFormEntry>) => void;
  getFormByDateAndInitial: (date: Date, initial: string) => PaperFormEntry | undefined;
  
  // Admin functions
  addAdminComment: (formId: string, adminInitial: string, comment: string) => void;
  resolveError: (formId: string, errorId: string) => void;
  unresolveError: (formId: string, errorId: string) => void;
  
  // Utility functions
  isFormBlank: (form: PaperFormEntry) => boolean;
  exportState: () => any;
  
  // Initial management
  setSelectedInitial: (initial: string | null) => void;
}

export const usePaperFormStore = create<PaperFormStore>()(
  persist(
    (set, get) => ({
      currentForm: null,
      savedForms: [],
      selectedInitial: null,
      
      createNewForm: (formType: FormType, formInitial: string = '') => {
        const newForm = createEmptyForm(formType, formInitial);
        set((state) => ({
          currentForm: newForm,
          savedForms: [newForm, ...state.savedForms]
        }));
      },
      
      updateFormStatus: (formId: string, status: 'Complete' | 'In Progress' | 'Error') => {
        set((state) => ({
          savedForms: state.savedForms.map(form => 
            form.id === formId ? { ...form, status } : form
          ),
          currentForm: state.currentForm?.id === formId 
            ? { ...state.currentForm, status }
            : state.currentForm
        }));
      },
      
      saveForm: async () => {
        const { currentForm, savedForms } = get();
        if (!currentForm) return;
        
        try {
          // Update the form in the savedForms array
          const updatedSavedForms = savedForms.map(form => 
            form.id === currentForm.id ? currentForm : form
          );
          
          set({ savedForms: updatedSavedForms });
          
          // Save to AWS DynamoDB
          await awsStorageManager.savePaperForm(currentForm);
          
          console.log('Form saved successfully to AWS DynamoDB');
        } catch (error) {
          console.error('Error saving form to AWS:', error);
          throw error;
        }
      },
      
      loadForm: (formId: string) => {
        const { savedForms } = get();
        const form = savedForms.find(f => f.id === formId);
        if (form) {
          set({ currentForm: form });
        }
      },
      
      deleteForm: async (formId: string) => {
        try {
          // Delete from AWS DynamoDB
          await awsStorageManager.deletePaperForm(formId);
          
          // Remove from local state
          set((state) => ({
            savedForms: state.savedForms.filter(form => form.id !== formId),
            currentForm: state.currentForm?.id === formId ? null : state.currentForm
          }));
          
          console.log('Form deleted successfully from AWS DynamoDB');
        } catch (error) {
          console.error('Error deleting form from AWS:', error);
          throw error;
        }
      },
      
      loadFormsFromStorage: async () => {
        try {
          // Load forms from AWS DynamoDB
          const forms = await awsStorageManager.getPaperForms();
          set({ savedForms: forms });
          console.log('Forms loaded successfully from AWS DynamoDB');
        } catch (error) {
          console.error('Error loading forms from AWS:', error);
          // Fallback to local storage if AWS fails
          console.log('Falling back to local storage');
        }
      },
      
      updateFormField: (formId: string, field: string, value: any) => {
        set((state) => ({
          savedForms: state.savedForms.map(form => 
            form.id === formId ? { ...form, [field]: value } : form
          ),
          currentForm: state.currentForm?.id === formId 
            ? { ...state.currentForm, [field]: value }
            : state.currentForm
        }));
      },
      
      updateFormRow: (formId: string, rowIndex: number, rowData: any) => {
        set((state) => ({
          savedForms: state.savedForms.map(form => {
            if (form.id === formId) {
              const updatedEntries = [...form.entries];
              updatedEntries[rowIndex] = { ...updatedEntries[rowIndex], ...rowData };
              return { ...form, entries: updatedEntries };
            }
            return form;
          }),
          currentForm: state.currentForm?.id === formId 
            ? {
                ...state.currentForm,
                entries: state.currentForm.entries.map((entry, index) => 
                  index === rowIndex ? { ...entry, ...rowData } : entry
                )
              }
            : state.currentForm
        }));
      },
      
      updateFormRowStage: (formId: string, rowIndex: number, stage: string, stageData: any) => {
        set((state) => ({
          savedForms: state.savedForms.map(form => {
            if (form.id === formId) {
              const updatedEntries = [...form.entries];
              const currentEntry = updatedEntries[rowIndex];
              const currentStage = currentEntry[stage as keyof typeof currentEntry] as any;
              updatedEntries[rowIndex] = {
                ...currentEntry,
                [stage]: { ...currentStage, ...stageData }
              };
              return { ...form, entries: updatedEntries };
            }
            return form;
          }),
          currentForm: state.currentForm?.id === formId 
            ? {
                ...state.currentForm,
                entries: state.currentForm.entries.map((entry, index) => 
                  index === rowIndex 
                    ? {
                        ...entry,
                        [stage]: { ...(entry[stage as keyof typeof entry] as any), ...stageData }
                      }
                    : entry
                )
              }
            : state.currentForm
        }));
      },
      
      addAdminComment: (formId: string, adminInitial: string, comment: string) => {
        const newComment = {
          id: `comment-${Date.now()}`,
          adminInitial,
          timestamp: new Date(),
          comment
        };
        
        set((state) => ({
          savedForms: state.savedForms.map(form => {
            if (form.id === formId) {
              return {
                ...form,
                adminComments: [...(form.adminComments || []), newComment]
              };
            }
            return form;
          }),
          currentForm: state.currentForm?.id === formId 
            ? {
                ...state.currentForm,
                adminComments: [...(state.currentForm.adminComments || []), newComment]
              }
            : state.currentForm
        }));
      },
      
      resolveError: (formId: string, errorId: string) => {
        set((state) => ({
          savedForms: state.savedForms.map(form => {
            if (form.id === formId) {
              const resolvedErrors = [...(form.resolvedErrors || [])];
              if (!resolvedErrors.includes(errorId)) {
                resolvedErrors.push(errorId);
              }
              return { ...form, resolvedErrors };
            }
            return form;
          }),
          currentForm: state.currentForm?.id === formId 
            ? {
                ...state.currentForm,
                resolvedErrors: [...(state.currentForm.resolvedErrors || []), errorId]
              }
            : state.currentForm
        }));
      },
      
      unresolveError: (formId: string, errorId: string) => {
        set((state) => ({
          savedForms: state.savedForms.map(form => {
            if (form.id === formId) {
              const resolvedErrors = (form.resolvedErrors || []).filter(id => id !== errorId);
              return { ...form, resolvedErrors };
            }
            return form;
          }),
          currentForm: state.currentForm?.id === formId 
            ? {
                ...state.currentForm,
                resolvedErrors: (state.currentForm.resolvedErrors || []).filter(id => id !== errorId)
              }
            : state.currentForm
        }));
      },
      
      isFormBlank: (form: PaperFormEntry) => {
        // Check if form has any meaningful data
        const hasEntries = form.entries.some(entry => 
          entry.type || 
          entry.ccp1.temp || 
          entry.ccp2.temp || 
          entry.coolingTo80.temp || 
          entry.coolingTo54.temp || 
          entry.finalChill.temp
        );
        
        const hasBottomSection = form.thermometerNumber || 
          form.ingredients.beef || 
          form.ingredients.chicken || 
          form.ingredients.liquidEggs ||
          form.lotNumbers.beef ||
          form.lotNumbers.chicken ||
          form.lotNumbers.liquidEggs ||
          form.correctiveActionsComments;
        
        return !hasEntries && !hasBottomSection;
      },
      
      exportState: () => {
        const state = get();
        return {
          currentForm: state.currentForm,
          savedForms: state.savedForms,
          timestamp: new Date().toISOString()
        };
      },
      
      setSelectedInitial: (initial: string | null) => {
        set({ selectedInitial: initial });
      },
      
      updateEntry: (rowIndex: number, field: string, value: any) => {
        const { currentForm } = get();
        if (!currentForm) return;
        
        // Parse the field path (e.g., "ccp1.initial" -> stage: "ccp1", field: "initial")
        const [stage, fieldName] = field.split('.');
        if (stage && fieldName && currentForm.entries[rowIndex]) {
          const updatedEntries = [...currentForm.entries];
          const currentEntry = updatedEntries[rowIndex];
          const currentStage = currentEntry[stage as keyof typeof currentEntry] as any;
          
          updatedEntries[rowIndex] = {
            ...currentEntry,
            [stage]: {
              ...currentStage,
              [fieldName]: value
            }
          };
          
          set({ currentForm: { ...currentForm, entries: updatedEntries } });
        }
      },
      
      updateAdminForm: (formId: string, updates: Partial<PaperFormEntry>) => {
        set((state) => ({
          savedForms: state.savedForms.map(form => 
            form.id === formId ? { ...form, ...updates } : form
          ),
          currentForm: state.currentForm?.id === formId 
            ? { ...state.currentForm, ...updates }
            : state.currentForm
        }));
      },
      
      getFormByDateAndInitial: (date: Date, initial: string) => {
        const { savedForms } = get();
        const dateString = date.toISOString().split('T')[0];
        
        return savedForms.find(form => {
          const formDateString = ensureDate(form.date).toISOString().split('T')[0];
          return formDateString === dateString && form.formInitial === initial;
        });
      },

      clearAllForms: async () => {
        try {
          // Clear all forms from AWS DynamoDB
          await awsStorageManager.clearAllPaperForms();
          
          // Clear local state regardless of AWS success
          set({ savedForms: [], currentForm: null });
          console.log('All forms cleared successfully from AWS DynamoDB and local state');
        } catch (error) {
          console.error('Error clearing all forms from AWS:', error);
          
          // Even if AWS fails, clear local state to prevent confusion
          set({ savedForms: [], currentForm: null });
          console.log('Cleared local state despite AWS error');
          
          // Re-throw the error so the UI can handle it appropriately
          throw error;
        }
      },

      clearAllFormsLocally: () => {
        set({ savedForms: [], currentForm: null });
        console.log('All forms cleared locally.');
      }
    }),
    {
      name: 'paper-form-store',
      partialize: (state) => ({
        savedForms: state.savedForms,
        currentForm: state.currentForm
      })
    }
  )
);
