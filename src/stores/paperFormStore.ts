import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { PaperFormEntry, createEmptyForm } from '@/lib/paperFormTypes';

interface PaperFormStore {
  currentForm: PaperFormEntry | null;
  savedForms: PaperFormEntry[];
  selectedInitial: string;
  
  // Actions
  createNewForm: (initial?: string) => void;
  updateEntry: (rowIndex: number, field: string, value: string) => void;
  updateFormField: (field: string, value: any) => void;
  updateFormStatus: (formId: string, status: 'Complete' | 'In Progress' | 'Non-compliant') => void;
  deleteForm: (formId: string) => void;
  saveForm: () => void;
  loadForm: (id: string) => void;
  isFormBlank: (form: PaperFormEntry) => boolean;
  setSelectedInitial: (initial: string) => void;
  getFormsByInitial: (initial: string) => PaperFormEntry[];
  getFormsForCurrentInitial: () => PaperFormEntry[];
  getFormByDateAndInitial: (date: Date, initial: string) => PaperFormEntry | null;
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
        const { savedForms, currentForm } = get();
        const updatedForms = savedForms.map(form => 
          form.id === formId ? { ...form, status } : form
        );
        
        // Also update current form if it matches
        const updatedCurrentForm = currentForm?.id === formId 
          ? { ...currentForm, status }
          : currentForm;
        
        set({ savedForms: updatedForms, currentForm: updatedCurrentForm });
      },

      deleteForm: (formId) => {
        const { savedForms, currentForm } = get();
        const updatedForms = savedForms.filter(form => form.id !== formId);
        
        // Clear current form if it's the one being deleted
        const updatedCurrentForm = currentForm?.id === formId ? null : currentForm;
        
        set({ savedForms: updatedForms, currentForm: updatedCurrentForm });
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
          set({ currentForm: form });
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
    }),
    {
      name: 'paper-form-storage',
      partialize: (state) => ({ savedForms: state.savedForms, selectedInitial: state.selectedInitial }),
      onRehydrateStorage: () => (state) => {
        if (state?.savedForms) {
          // Convert date strings back to Date objects
          state.savedForms = state.savedForms.map(form => ({
            ...form,
            date: new Date(form.date),
          }));
        }
      },
    }
  )
);
