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
  
  // AWS sync functions
  syncFormsToAWS: () => Promise<{ success: boolean; synced: number; errors: number; error?: any }>;
  
  // Initial management
  setSelectedInitial: (initial: string | null) => void;
  
  // Debug functions
  debugLastTextEntry: () => void;
  testUpdateLastTextEntry: () => void;
  logCurrentState: () => void;
  forceUpdateLastTextEntry: () => void;
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
          
          // TEMPORARILY DISABLE AWS SAVING TO FOCUS ON LOCAL FUNCTIONALITY
          console.log('Form updated locally (AWS saving temporarily disabled):', currentForm.id, 'with lastTextEntry:', currentForm.lastTextEntry);
          
          // TODO: Re-enable AWS saving once GraphQL mutations are fixed
          // await awsStorageManager.savePaperForm(currentForm);
          // console.log('Form saved successfully to AWS DynamoDB');
        } catch (error) {
          console.error('Error updating form locally:', error);
          console.error('Form data that failed to update:', currentForm);
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
          // Get current local forms before loading from AWS
          const currentState = get();
          const currentLocalForms = currentState.savedForms;
          
          console.log(`Current local forms count: ${currentLocalForms.length}`);
          
          // Load forms from AWS DynamoDB
          const awsForms = await awsStorageManager.getPaperForms();
          console.log(`AWS forms count: ${awsForms.length}`);
          
          // Migrate existing forms to include rack field and dataLog field if missing
          const migratedForms = awsForms.map(form => {
            if (!form.entries) return form;
            
            const migratedEntries = form.entries.map(entry => {
              let updatedEntry = { ...entry };
              
              // Add rack field if missing
              if (!entry.rack) {
                updatedEntry = { ...updatedEntry, rack: '1st Rack' as const };
              }
              
              // Add dataLog field to each stage if missing
              if (entry.ccp1 && !entry.ccp1.dataLog) {
                updatedEntry.ccp1 = { ...entry.ccp1, dataLog: false };
              }
              if (entry.ccp2 && !entry.ccp2.dataLog) {
                updatedEntry.ccp2 = { ...entry.ccp2, dataLog: false };
              }
              if (entry.coolingTo80 && !entry.coolingTo80.dataLog) {
                updatedEntry.coolingTo80 = { ...entry.coolingTo80, dataLog: false };
              }
              if (entry.coolingTo54 && !entry.coolingTo54.dataLog) {
                updatedEntry.coolingTo54 = { ...entry.coolingTo54, dataLog: false };
              }
              if (entry.finalChill && !entry.finalChill.dataLog) {
                updatedEntry.finalChill = { ...entry.finalChill, dataLog: false };
              }
              
              return updatedEntry;
            });
            
            return { ...form, entries: migratedEntries };
          });
          
          // Create a map of AWS forms by ID for easy lookup
          const awsFormMap = new Map(migratedForms.map(f => [f.id, f]));
          
          // Merge AWS forms with locally created forms
          const mergedForms: PaperFormEntry[] = [];
          
          // First, add all AWS forms
          mergedForms.push(...migratedForms);
          
          // Then, add local forms that don't exist in AWS (or update existing ones with local data)
          currentLocalForms.forEach(localForm => {
            const existingAwsForm = awsFormMap.get(localForm.id);
            
            if (!existingAwsForm) {
              // This is a new local form that hasn't been saved to AWS yet
              console.log(`Adding local-only form: ${localForm.id}`);
              mergedForms.push(localForm);
            } else {
              // This form exists in both places - use the local version if it's more recent
              const localLastModified = localForm.lastTextEntry || localForm.date;
              const awsLastModified = existingAwsForm.lastTextEntry || existingAwsForm.date;
              
              if (localLastModified > awsLastModified) {
                console.log(`Using local version of form ${localForm.id} (more recent)`);
                // Replace AWS version with local version
                const index = mergedForms.findIndex(f => f.id === localForm.id);
                if (index !== -1) {
                  mergedForms[index] = localForm;
                }
              } else {
                console.log(`Using AWS version of form ${localForm.id} (more recent)`);
              }
            }
          });
          
          console.log(`Final merged forms count: ${mergedForms.length} (${migratedForms.length} from AWS, ${mergedForms.length - migratedForms.length} from local)`);
          
          set({ savedForms: mergedForms });
        } catch (error) {
          console.error('Error loading forms from AWS:', error);
          console.error('Error details:', {
            name: error instanceof Error ? error.name : 'Unknown',
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : 'No stack trace',
            error: error
          });
          
          // Fallback to local storage if AWS fails
          console.log('Falling back to local storage only');
          const currentState = get();
          if (currentState.savedForms.length > 0) {
            console.log(`Using ${currentState.savedForms.length} forms from local storage`);
            // Even if AWS fails, we should still show the local forms
            set({ savedForms: currentState.savedForms });
          }
        }
      },

      // NEW: Function to sync local forms to AWS
      syncFormsToAWS: async () => {
        try {
          const { savedForms } = get();
          const localForms = savedForms.filter(form => !get().isFormBlank(form));
          
          if (localForms.length === 0) {
            console.log('No forms to sync to AWS');
            return { success: true, synced: 0, errors: 0 };
          }
          
          console.log(`Attempting to sync ${localForms.length} forms to AWS...`);
          
          let synced = 0;
          let errors = 0;
          
          for (const form of localForms) {
            try {
              await awsStorageManager.savePaperForm(form);
              synced++;
              console.log(`Successfully synced form ${form.id} to AWS`);
            } catch (error) {
              errors++;
              console.error(`Failed to sync form ${form.id} to AWS:`, error);
            }
          }
          
          console.log(`Sync completed: ${synced} successful, ${errors} failed`);
          return { success: true, synced, errors };
        } catch (error) {
          console.error('Error during AWS sync:', error);
          return { success: false, synced: 0, errors: 0, error };
        }
      },
      

      
      updateFormField: (formId: string, field: string, value: any) => {
        set((state) => {
          // Check if ANY keystroke was detected (for bottom section fields)
          const hasTextEntry = value !== null && value !== undefined;
          
          console.log(`updateFormField called for field: ${field}, value: ${value}, hasTextEntry: ${hasTextEntry}`);
          
          if (hasTextEntry) {
            console.log(`Updating lastTextEntry for form field ${field} with value:`, value);
          }
          
          return {
            savedForms: state.savedForms.map(form => 
              form.id === formId ? { 
                ...form, 
                [field]: value,
                lastTextEntry: hasTextEntry ? new Date() : form.lastTextEntry
              } : form
            ),
            currentForm: state.currentForm?.id === formId 
              ? { 
                  ...state.currentForm, 
                  [field]: value,
                  lastTextEntry: hasTextEntry ? new Date() : state.currentForm.lastTextEntry
                }
              : state.currentForm
          };
        });
      },
      
      updateFormRow: (formId: string, rowIndex: number, rowData: any) => {
        set((state) => {
          console.log(`updateFormRow called for formId: ${formId}, row: ${rowIndex}, data:`, rowData);
          
          // Check if any keystroke was detected
          const hasTextEntry = Object.entries(rowData).some(([key, value]) => 
            key !== 'dataLog' && value !== null && value !== undefined
          );
          
          console.log(`hasTextEntry: ${hasTextEntry} for row: ${rowIndex}`);
          
          return {
            savedForms: state.savedForms.map(form => {
              if (form.id === formId) {
                const updatedEntries = [...form.entries];
                updatedEntries[rowIndex] = { ...updatedEntries[rowIndex], ...rowData };
                return { 
                  ...form, 
                  entries: updatedEntries,
                  lastTextEntry: hasTextEntry ? new Date() : form.lastTextEntry
                };
              }
              return form;
            }),
            currentForm: state.currentForm?.id === formId 
              ? {
                  ...state.currentForm,
                  entries: state.currentForm.entries.map((entry, index) => 
                    index === rowIndex ? { ...entry, ...rowData } : entry
                  ),
                  lastTextEntry: hasTextEntry ? new Date() : state.currentForm.lastTextEntry
                }
              : state.currentForm
          };
        });
      },
      
      updateFormRowStage: (formId: string, rowIndex: number, stage: string, stageData: any) => {
        set((state) => {
          console.log(`updateFormRowStage called for formId: ${formId}, row: ${rowIndex}, stage: ${stage}, data:`, stageData);
          
          // Check if any keystroke was detected (excluding dataLog checkbox)
          const hasTextEntry = Object.entries(stageData).some(([key, value]) => 
            key !== 'dataLog' && value !== null && value !== undefined
          );
          
          console.log(`hasTextEntry: ${hasTextEntry} for stage: ${stage}`);
          
          return {
            savedForms: state.savedForms.map(form => {
              if (form.id === formId) {
                const updatedEntries = [...form.entries];
                const currentEntry = updatedEntries[rowIndex];
                const currentStage = currentEntry[stage as keyof typeof currentEntry] as any;
                updatedEntries[rowIndex] = {
                  ...currentEntry,
                  [stage]: { ...currentStage, ...stageData }
                };
                return { 
                  ...form, 
                  entries: updatedEntries,
                  lastTextEntry: hasTextEntry ? new Date() : form.lastTextEntry
                };
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
                  ),
                  lastTextEntry: hasTextEntry ? new Date() : state.currentForm.lastTextEntry
                }
              : state.currentForm
          };
        });
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
        
        // A form with a title is never blank
        const hasTitle = form.title && form.title.trim() !== '';
        
        // A form with a status other than the default is never blank
        const hasStatus = form.status && form.status !== 'In Progress';
        
        // A form with a formInitial is never blank
        const hasInitial = form.formInitial && form.formInitial.trim() !== '';
        
        // A form with admin comments is never blank
        const hasAdminComments = form.adminComments && form.adminComments.length > 0;
        
        // A form with corrective actions is never blank
        const hasCorrectiveActions = form.correctiveActionsComments && form.correctiveActionsComments.trim() !== '';
        
        // Debug logging
        console.log(`isFormBlank check for form ${form.id}:`, {
          hasEntries,
          hasBottomSection,
          hasTitle: hasTitle ? `"${form.title}"` : false,
          hasStatus,
          hasInitial: hasInitial ? `"${form.formInitial}"` : false,
          hasAdminComments,
          hasCorrectiveActions: hasCorrectiveActions ? `"${form.correctiveActionsComments?.substring(0, 50)}..."` : false,
          isBlank: !(hasEntries || hasBottomSection || hasTitle || hasStatus || hasInitial || hasAdminComments || hasCorrectiveActions)
        });
        
        return !(hasEntries || hasBottomSection || hasTitle || hasStatus || hasInitial || hasAdminComments || hasCorrectiveActions);
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
        
        console.log(`updateEntry called for row: ${rowIndex}, field: ${field}, value: ${value}, type: ${typeof value}, isNull: ${value === null}, isUndefined: ${value === undefined}, isEmpty: ${value === ''}`);
        
        // Parse the field path (e.g., "ccp1.initial" -> stage: "ccp1", field: "initial")
        const [stage, fieldName] = field.split('.');
        
        if (stage && fieldName && currentForm.entries[rowIndex]) {
          // Handle nested fields (e.g., ccp1.initial, ccp1.temp, etc.)
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
          
          // Update lastTextEntry when ANY keystroke is detected (but not for dataLog checkbox)
          const shouldUpdateLastTextEntry = fieldName !== 'dataLog' && 
            (value !== null && value !== undefined);
          
          if (shouldUpdateLastTextEntry) {
            console.log(`✅ UPDATING lastTextEntry for field ${field} with value:`, value);
            console.log(`Old lastTextEntry:`, currentForm.lastTextEntry);
            console.log(`New lastTextEntry:`, new Date());
          } else {
            console.log(`❌ NOT updating lastTextEntry for field ${field} with value:`, value);
            console.log(`Reason: fieldName=${fieldName}, isDataLog=${fieldName === 'dataLog'}, isNull=${value === null}, isUndefined=${value === undefined}`);
          }
          
          const newLastTextEntry = shouldUpdateLastTextEntry ? new Date() : currentForm.lastTextEntry;
          
          set((state) => ({
            currentForm: { 
              ...currentForm, 
              entries: updatedEntries,
              lastTextEntry: newLastTextEntry
            },
            savedForms: state.savedForms.map(form => 
              form.id === currentForm.id 
                ? { ...form, entries: updatedEntries, lastTextEntry: newLastTextEntry }
                : form
            )
          }));
        } else if (currentForm.entries[rowIndex]) {
          // Handle direct fields (e.g., type, rack)
          const updatedEntries = [...currentForm.entries];
          
          updatedEntries[rowIndex] = {
            ...updatedEntries[rowIndex],
            [field]: value
          };
          
          // Update lastTextEntry for direct fields
          const shouldUpdateLastTextEntry = value !== null && value !== undefined;
          const newLastTextEntry = shouldUpdateLastTextEntry ? new Date() : currentForm.lastTextEntry;
          
          set((state) => ({
            currentForm: { 
              ...currentForm, 
              entries: updatedEntries,
              lastTextEntry: newLastTextEntry
            },
            savedForms: state.savedForms.map(form => 
              form.id === currentForm.id 
                ? { ...form, entries: updatedEntries, lastTextEntry: newLastTextEntry }
                : form
            )
          }));
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
      },
      
      // Debug function to test lastTextEntry updates
      debugLastTextEntry: () => {
        const { currentForm } = get();
        if (currentForm) {
          console.log('Current form lastTextEntry:', currentForm.lastTextEntry);
          console.log('Current form data:', currentForm);
        } else {
          console.log('No current form');
        }
      },
      
      // Test function to manually update lastTextEntry
      testUpdateLastTextEntry: () => {
        const { currentForm } = get();
        if (currentForm) {
          console.log('Testing lastTextEntry update...');
          const newDate = new Date();
          console.log('Setting lastTextEntry to:', newDate);
          
          set((state) => ({
            currentForm: { ...currentForm, lastTextEntry: newDate },
            savedForms: state.savedForms.map(form => 
              form.id === currentForm.id ? { ...form, lastTextEntry: newDate } : form
            )
          }));
          
          console.log('lastTextEntry updated in store');
        } else {
          console.log('No current form to update');
        }
      },
      
      // Function to log current state for debugging
      logCurrentState: () => {
        const { currentForm, savedForms } = get();
        console.log('=== CURRENT STORE STATE ===');
        console.log('Current Form:', currentForm);
        if (currentForm) {
          console.log('Current Form lastTextEntry:', currentForm.lastTextEntry);
          console.log('Current Form entries count:', currentForm.entries?.length);
        }
        console.log('Saved Forms count:', savedForms.length);
        if (savedForms.length > 0) {
          console.log('First saved form lastTextEntry:', savedForms[0].lastTextEntry);
          console.log('First saved form ID:', savedForms[0].id);
        }
        console.log('=== END STORE STATE ===');
      },
      
      // Function to force update lastTextEntry for testing
      forceUpdateLastTextEntry: () => {
        const { currentForm } = get();
        if (currentForm) {
          console.log('Force updating lastTextEntry...');
          const newDate = new Date();
          
          set((state) => ({
            currentForm: { ...currentForm, lastTextEntry: newDate },
            savedForms: state.savedForms.map(form => 
              form.id === currentForm.id ? { ...form, lastTextEntry: newDate } : form
            )
          }));
          
          console.log('Force updated lastTextEntry to:', newDate);
        } else {
          console.log('No current form to force update');
        }
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
