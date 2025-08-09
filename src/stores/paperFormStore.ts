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
  saveForm: () => void;
  loadForm: (id: string) => void;
  setSelectedInitial: (initial: string) => void;
  getFormsByInitial: (initial: string) => PaperFormEntry[];
  getFormsForCurrentInitial: () => PaperFormEntry[];
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

      saveForm: () => {
        const { currentForm, savedForms } = get();
        if (!currentForm) return;

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
