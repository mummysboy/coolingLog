import { create } from "zustand";
import {
  PaperFormEntry,
  FormType,
  createEmptyForm,
  ensureDate,
} from "@/lib/paperFormTypes";
import { storageManager } from "@/lib/storageManager";

interface PaperFormStore {
  currentForm: PaperFormEntry | null;
  currentFormDirty: boolean;
  savedForms: PaperFormEntry[];
  selectedInitial: string | null;

  // Actions
  createNewForm: (formType: FormType, formInitial?: string) => void;
  updateFormStatus: (
    formId: string,
    status: "Complete" | "In Progress" | "Error"
  ) => void;
  saveForm: () => Promise<void>;
  commitCurrentForm: () => void;
  loadForm: (formId: string) => void;
  deleteForm: (formId: string) => Promise<void>;
  loadFormsFromStorage: () => Promise<void>;
  clearAllForms: () => Promise<void>; // cloud + local
  clearAllFormsLocally: () => void; // local fallback

  // Form management
  updateFormField: (formId: string, field: string, value: any) => void;
  updateFormRow: (formId: string, rowIndex: number, rowData: any) => void; // kept in interface; see TODO impl comment
  updateFormRowStage: (
    formId: string,
    rowIndex: number,
    stage: string,
    stageData: any
  ) => void;
  updateEntry: (rowIndex: number, field: string, value: any) => void;
  updateAdminForm: (formId: string, updates: Partial<PaperFormEntry>) => void;
  getFormByDateAndInitial: (
    date: Date,
    initial: string
  ) => PaperFormEntry | undefined;

  // Admin functions
  addAdminComment: (
    formId: string,
    adminInitial: string,
    comment: string
  ) => void;
  resolveError: (formId: string, errorId: string) => void;
  unresolveError: (formId: string, errorId: string) => void;

  // Utility functions
  isFormBlank: (form: PaperFormEntry) => boolean;
  exportState: () => any;

  // AWS sync functions
  syncFormsToAWS: () => Promise<{
    success: boolean;
    synced: number;
    errors: number;
    error?: any;
  }>;

  // Initial management
  setSelectedInitial: (initial: string | null) => void;

  // Debug functions
  debugLastTextEntry: () => void;
  testUpdateLastTextEntry: () => void;
  logCurrentState: () => void;
  forceUpdateLastTextEntry: () => void;
}

// Throttled lastTextEntry helper (reduces allocations on every keypress)
let _lastTextEntryAt = 0;
function maybeBumpLastTextEntry(prev?: Date, throttleMs = 1000) {
  const now = Date.now();
  if (now - _lastTextEntryAt >= throttleMs) {
    _lastTextEntryAt = now;
    return new Date();
  }
  return prev ?? null;
}

export const usePaperFormStore = create<PaperFormStore>()((set, get) => ({
  currentForm: null,
  currentFormDirty: false,
  savedForms: [],
  selectedInitial: null,

  createNewForm: (formType: FormType, formInitial: string = "") => {
    const initialToUse = formInitial || get().selectedInitial || "";
    const newForm = createEmptyForm(formType, initialToUse);

    if (process.env.NODE_ENV === "development") {
      console.log("🔍 createNewForm - Created form:", {
        id: newForm.id,
        type: newForm.formType,
        entriesCount: newForm.entries?.length || 0,
        hasEntries: !!(newForm.entries && newForm.entries.length > 0),
        entriesType: typeof newForm.entries,
        entriesIsArray: Array.isArray(newForm.entries),
      });
    }

    // Set as current, and add to savedForms once (initially)
    set((state) => ({
      currentForm: newForm,
      currentFormDirty: false,
      savedForms: [newForm, ...state.savedForms],
    }));
  },

  updateFormStatus: (
    formId: string,
    status: "Complete" | "In Progress" | "Error"
  ) => {
    // This is not on every keypress; we can safely update savedForms too.
    set((state) => ({
      savedForms: state.savedForms.map((form) =>
        form.id === formId ? { ...form, status } : form
      ),
      currentForm:
        state.currentForm?.id === formId
          ? { ...state.currentForm, status }
          : state.currentForm,
    }));
  },

  // Commit currentForm into savedForms (O(1) map) without hitting AWS
  commitCurrentForm: () => {
    set((state) => {
      const cf = state.currentForm;
      if (!cf) return {};

      const exists = state.savedForms.some((f) => f.id === cf.id);
      return {
        savedForms: exists
          ? state.savedForms.map((f) => (f.id === cf.id ? cf : f))
          : [cf, ...state.savedForms],
        currentFormDirty: false,
      };
    });
  },

  saveForm: async () => {
    const { currentForm, commitCurrentForm } = get();
    if (!currentForm) return;

    // Write to savedForms once per save
    commitCurrentForm();

    if (process.env.NODE_ENV === "development") {
      console.log("💾 saveForm called with currentForm:", {
        id: currentForm.id,
        title: currentForm.title,
        entriesCount: currentForm.entries?.length || 0,
        firstEntryData: currentForm.entries?.[0]
          ? {
              type: currentForm.entries[0].type,
              rack: (currentForm.entries[0] as any).rack,
              ccp1: currentForm.entries[0].ccp1,
              ccp2: currentForm.entries[0].ccp2,
              coolingTo80: currentForm.entries[0].coolingTo80,
              coolingTo54: currentForm.entries[0].coolingTo54,
              finalChill: currentForm.entries[0].finalChill,
            }
          : "No entries",
      });

      console.log("🔍 Form data being sent to storage manager:", {
        id: currentForm.id,
        title: currentForm.title,
        formType: currentForm.formType,
        status: currentForm.status,
        formInitial: currentForm.formInitial,
        date: currentForm.date,
        dateCreated: currentForm.dateCreated,
        lastTextEntry: currentForm.lastTextEntry,
        entriesCount: currentForm.entries?.length || 0,
        entriesType: typeof currentForm.entries,
        entriesIsArray: Array.isArray(currentForm.entries),
        hasTitle: !!currentForm.title,
        hasFormInitial: !!currentForm.formInitial,
        hasDate: !!currentForm.date,
      });
    }

    try {
      await storageManager.savePaperForm(currentForm);
      console.log("✅ Form saved successfully to AWS DynamoDB");
    } catch (error) {
      console.error("❌ Error saving form to AWS DynamoDB:", error);
      throw error;
    }
  },

  loadForm: (formId: string) => {
    const { savedForms } = get();
    const form = savedForms.find((f) => f.id === formId);
    if (form) {
      set({ currentForm: form, currentFormDirty: false });
    }
  },

  deleteForm: async (formId: string) => {
    try {
      const { savedForms } = get();
      const formToDelete = savedForms.find(
        (form: PaperFormEntry) => form.id === formId
      );

      if (!formToDelete) {
        console.error(`Form with ID ${formId} not found in saved forms`);
        throw new Error(`Form with ID ${formId} not found`);
      }

      console.log(`Attempting to delete form:`, {
        id: formToDelete.id,
        formType: formToDelete.formType,
        title: formToDelete.title,
      });

      await storageManager.deletePaperForm(formId, formToDelete.formType);

      set((state) => ({
        savedForms: state.savedForms.filter((form) => form.id !== formId),
        currentForm:
          state.currentForm?.id === formId ? null : state.currentForm,
        currentFormDirty:
          state.currentForm?.id === formId ? false : state.currentFormDirty,
      }));

      console.log("Form deleted successfully from AWS DynamoDB");
    } catch (error) {
      console.error("Error deleting form from AWS:", error);
      if (error instanceof Error) {
        console.error("Error details:", {
          message: error.message,
          stack: error.stack,
          name: error.name,
        });
      }
      throw error;
    }
  },

  loadFormsFromStorage: async () => {
    try {
      console.log("Loading forms from AWS DynamoDB...");

      const awsForms = await storageManager.getPaperForms();
      console.log(`AWS forms count: ${awsForms.length}`);

      if (awsForms.length > 0 && process.env.NODE_ENV === "development") {
        console.log("=== FIRST FORM DEBUG ===");
        console.log("Form ID:", awsForms[0].id);
        console.log("Form type:", awsForms[0].formType);
        console.log("Form entries count:", awsForms[0].entries?.length);
        console.log("Form entries from AWS:", awsForms[0].entries);
        console.log("=== END FIRST FORM DEBUG ===");
      }

      const validatedForms = awsForms.map((form) => {
        if (!form.entries) {
          console.warn(
            `Form ${form.id} has no entries, creating empty entries array`
          );
          return { ...form, entries: [] as PaperFormEntry["entries"] };
        }

        const validatedEntries = form.entries
          .map((entry) => {
            if (!entry) {
              console.warn(
                `Form ${form.id} has null/undefined entry, skipping`
              );
              return null;
            }

            let updatedEntry: any = { ...entry };

            if (!entry.rack) {
              updatedEntry = { ...updatedEntry, rack: "1st Rack" as const };
            }

            const stages = [
              "ccp1",
              "ccp2",
              "coolingTo80",
              "coolingTo54",
              "finalChill",
            ] as const;
            stages.forEach((stage) => {
              const stageData = (entry as any)[stage];
              if (
                stageData &&
                typeof stageData === "object" &&
                "temp" in stageData
              ) {
                if (!stageData.dataLog) {
                  updatedEntry = {
                    ...updatedEntry,
                    [stage]: { ...stageData, dataLog: false },
                  };
                }
              }
            });

            return updatedEntry as NonNullable<typeof entry>;
          })
          .filter((e): e is NonNullable<typeof e> => e !== null);

        return { ...form, entries: validatedEntries };
      });

      const sortedForms = validatedForms.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) return dateB - dateA;

        const createdA = new Date(a.dateCreated || a.date).getTime();
        const createdB = new Date(b.dateCreated || b.date).getTime();
        if (createdA !== createdB) return createdB - createdA;

        return a.id.localeCompare(b.id);
      });

      console.log(
        `Successfully loaded and sorted ${sortedForms.length} forms from AWS DynamoDB`
      );

      set({ savedForms: sortedForms as PaperFormEntry[] });
    } catch (error) {
      console.error("Error loading forms from AWS:", error);
      console.error("Error details:", {
        name: error instanceof Error ? error.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : "No stack trace",
        error,
      });

      console.log("AWS is required - no local fallback available");
      throw error;
    }
  },

  // Syncs whatever is in savedForms (non-blank) to AWS
  syncFormsToAWS: async () => {
    try {
      const { savedForms, isFormBlank } = get();
      const localForms = savedForms.filter((form) => !isFormBlank(form));

      if (localForms.length === 0) {
        console.log("No forms to sync to AWS");
        return { success: true, synced: 0, errors: 0 };
      }

      console.log(`Attempting to sync ${localForms.length} forms to AWS...`);

      let synced = 0;
      let errors = 0;

      for (const form of localForms) {
        try {
          await storageManager.savePaperForm(form);
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
      console.error("Error during AWS sync:", error);
      return { success: false, synced: 0, errors: 0, error };
    }
  },

  updateFormField: (formId: string, field: string, value: any) => {
    set((state) => {
      const cf = state.currentForm;
      if (!cf || cf.id !== formId) return {};

      if (process.env.NODE_ENV === "development") {
        const hasTextEntry = value !== null && value !== undefined;
        console.log(
          `updateFormField called for field: ${field}, value: ${value}, hasTextEntry: ${hasTextEntry}`
        );
      }

      const hasTextEntry = value !== null && value !== undefined;
      const nextLast = hasTextEntry
        ? maybeBumpLastTextEntry(cf.lastTextEntry)
        : cf.lastTextEntry;

      const nextCurrent: PaperFormEntry = {
        ...cf,
        [field]: value,
        lastTextEntry: nextLast ?? cf.lastTextEntry,
      };

      // Do not touch savedForms here; keep keystrokes lightweight.
      return { currentForm: nextCurrent, currentFormDirty: true };
    });
  },

  // TODO: Temporarily disabled due to type safety issues; keep the signature for compatibility.
  updateFormRow: (formId: string, rowIndex: number, rowData: any) => {
    // If you need this, mirror the pattern used in updateEntry/updateFormRowStage
    // so it only edits currentForm and sets currentFormDirty: true.
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "updateFormRow is currently a no-op (kept for type compatibility). Use updateEntry/updateFormRowStage instead."
      );
    }
  },

  updateFormRowStage: (
    formId: string,
    rowIndex: number,
    stage: string,
    stageData: any
  ) => {
    set((state) => {
      const cf = state.currentForm;
      if (!cf || cf.id !== formId || !cf.entries?.[rowIndex]) return {};

      if (process.env.NODE_ENV === "development") {
        console.log(
          `updateFormRowStage called for formId: ${formId}, row: ${rowIndex}, stage: ${stage}, data:`,
          stageData
        );
      }

      const hasTextEntry = Object.entries(stageData).some(
        ([key, value]) =>
          key !== "dataLog" && value !== null && value !== undefined
      );
      const nextLast = hasTextEntry
        ? maybeBumpLastTextEntry(cf.lastTextEntry)
        : cf.lastTextEntry;

      const entries = [...cf.entries];
      const currentEntry: any = entries[rowIndex];
      const currentStage = currentEntry[stage];

      entries[rowIndex] = {
        ...currentEntry,
        [stage]: { ...currentStage, ...stageData },
      };

      return ({
        currentForm: {
          ...cf,
          entries,
          lastTextEntry: nextLast ?? cf.lastTextEntry,
        },
        currentFormDirty: true,
      } as Partial<PaperFormStore>);
    });
  },

  addAdminComment: (formId: string, adminInitial: string, comment: string) => {
    const newComment = {
      id: `comment-${Date.now()}`,
      adminInitial,
      timestamp: new Date(),
      comment,
    };

    set((state) => ({
      savedForms: state.savedForms.map((form) => {
        if (form.id === formId) {
          return {
            ...form,
            adminComments: [...(form.adminComments || []), newComment],
          };
        }
        return form;
      }),
      currentForm:
        state.currentForm?.id === formId
          ? {
              ...state.currentForm,
              adminComments: [
                ...(state.currentForm.adminComments || []),
                newComment,
              ],
            }
          : state.currentForm,
    }));
  },

  resolveError: (formId: string, errorId: string) => {
    set((state) => ({
      savedForms: state.savedForms.map((form) => {
        if (form.id === formId) {
          const resolvedErrors = [...(form.resolvedErrors || [])];
          if (!resolvedErrors.includes(errorId)) {
            resolvedErrors.push(errorId);
          }
          return { ...form, resolvedErrors };
        }
        return form;
      }),
      currentForm:
        state.currentForm?.id === formId
          ? {
              ...state.currentForm,
              resolvedErrors: [
                ...(state.currentForm.resolvedErrors || []),
                errorId,
              ],
            }
          : state.currentForm,
    }));
  },

  unresolveError: (formId: string, errorId: string) => {
    set((state) => ({
      savedForms: state.savedForms.map((form) => {
        if (form.id === formId) {
          const resolvedErrors = (form.resolvedErrors || []).filter(
            (id) => id !== errorId
          );
          return { ...form, resolvedErrors };
        }
        return form;
      }),
      currentForm:
        state.currentForm?.id === formId
          ? {
              ...state.currentForm,
              resolvedErrors: (state.currentForm.resolvedErrors || []).filter(
                (id) => id !== errorId
              ),
            }
          : state.currentForm,
    }));
  },

  isFormBlank: (form: PaperFormEntry) => {
    const hasEntries = form.entries.some((entry: any) =>
      Boolean(
        entry?.type ||
          entry?.ccp1?.temp ||
          entry?.ccp2?.temp ||
          entry?.coolingTo80?.temp ||
          entry?.coolingTo54?.temp ||
          entry?.finalChill?.temp
      )
    );

    const hasBottomSection =
      (form as any).thermometerNumber ||
      (form as any).ingredients?.beef ||
      (form as any).ingredients?.chicken ||
      (form as any).ingredients?.liquidEggs ||
      (form as any).lotNumbers?.beef ||
      (form as any).lotNumbers?.chicken ||
      (form as any).lotNumbers?.liquidEggs ||
      form.correctiveActionsComments;

    const hasTitle = form.title && form.title.trim() !== "";
    const hasStatus = form.status && form.status !== "In Progress";
    const hasInitial = form.formInitial && form.formInitial.trim() !== "";
    const hasAdminComments =
      form.adminComments && form.adminComments.length > 0;
    const hasCorrectiveActions =
      form.correctiveActionsComments &&
      form.correctiveActionsComments.trim() !== "";

    return !(
      hasEntries ||
      hasBottomSection ||
      hasTitle ||
      hasStatus ||
      hasInitial ||
      hasAdminComments ||
      hasCorrectiveActions
    );
  },

  exportState: () => {
    const state = get();
    return {
      currentForm: state.currentForm,
      savedForms: state.savedForms,
      timestamp: new Date().toISOString(),
    };
  },

  setSelectedInitial: (initial: string | null) => {
    set({ selectedInitial: initial });
  },

  updateEntry: (rowIndex: number, field: string, value: any) => {
    set((state) => {
      const cf = state.currentForm;
      if (!cf || !cf.entries?.[rowIndex]) return {};

      if (process.env.NODE_ENV === "development") {
        console.log(
          `updateEntry called for row: ${rowIndex}, field: ${field}, value:`,
          value
        );
      }

      const [stage, fieldName] = field.split(".");
      const hasText =
        fieldName !== "dataLog" && value !== null && value !== undefined;
      const nextLast = hasText
        ? maybeBumpLastTextEntry(cf.lastTextEntry)
        : cf.lastTextEntry;

      const entries = [...cf.entries];

      if (stage && fieldName) {
        const curEntry: any = entries[rowIndex];
        const curStage = curEntry[stage];
        entries[rowIndex] = {
          ...curEntry,
          [stage]: { ...curStage, [fieldName]: value },
        };
      } else {
        entries[rowIndex] = {
          ...(entries[rowIndex] as any),
          [field]: value,
        } as any;
      }

      return ({
        currentForm: {
          ...cf,
          entries,
          lastTextEntry: nextLast ?? cf.lastTextEntry,
        },
        currentFormDirty: true,
      } as Partial<PaperFormStore>);
    });
  },

  updateAdminForm: (formId: string, updates: Partial<PaperFormEntry>) => {
    // Admin actions are not per-keystroke for the grid; safe to touch both
    set((state) => ({
      savedForms: state.savedForms.map((form) =>
        form.id === formId ? { ...form, ...updates } : form
      ),
      currentForm:
        state.currentForm?.id === formId
          ? { ...state.currentForm, ...updates }
          : state.currentForm,
    } as Partial<PaperFormStore>));
  },

  getFormByDateAndInitial: (date: Date, initial: string) => {
    const { savedForms } = get();
    const dateString = date.toISOString().split("T")[0];

    return savedForms.find((form) => {
      const formDateString = ensureDate(form.date).toISOString().split("T")[0];
      return formDateString === dateString && form.formInitial === initial;
    });
  },

  clearAllForms: async () => {
    try {
      await storageManager.clearAllPaperForms();
      set({ savedForms: [], currentForm: null, currentFormDirty: false });
      console.log(
        "All forms cleared successfully from AWS DynamoDB and local state"
      );
    } catch (error) {
      console.error("Error clearing all forms from AWS:", error);
      set({ savedForms: [], currentForm: null, currentFormDirty: false });
      console.log("Cleared local state despite AWS error");
      throw error;
    }
  },

  clearAllFormsLocally: () => {
    set({ savedForms: [], currentForm: null, currentFormDirty: false });
    console.log("All forms cleared locally.");
  },

  // Debug helpers
  debugLastTextEntry: () => {
    const { currentForm } = get();
    if (currentForm) {
      console.log("Current form lastTextEntry:", currentForm.lastTextEntry);
      console.log("Current form data:", currentForm);
    } else {
      console.log("No current form");
    }
  },

  testUpdateLastTextEntry: () => {
    const { currentForm } = get();
    if (currentForm) {
      console.log("Testing lastTextEntry update...");
      const newDate = new Date();
      console.log("Setting lastTextEntry to:", newDate);

      set((state) => ({
        currentForm: { ...currentForm, lastTextEntry: newDate },
        savedForms: state.savedForms.map((form) =>
          form.id === currentForm.id
            ? { ...form, lastTextEntry: newDate }
            : form
        ),
      }));

      console.log("lastTextEntry updated in store");
    } else {
      console.log("No current form to update");
    }
  },

  logCurrentState: () => {
    const { currentForm, savedForms, currentFormDirty } = get();
    console.log("=== CURRENT STORE STATE ===");
    console.log("Current Form:", currentForm);
    if (currentForm) {
      console.log("Current Form lastTextEntry:", currentForm.lastTextEntry);
      console.log("Current Form entries count:", currentForm.entries?.length);
    }
    console.log("Saved Forms count:", savedForms.length);
    if (savedForms.length > 0) {
      console.log(
        "First saved form lastTextEntry:",
        savedForms[0].lastTextEntry
      );
      console.log("First saved form ID:", savedForms[0].id);
    }
    console.log("currentFormDirty:", currentFormDirty);
    console.log("=== END STORE STATE ===");
  },

  forceUpdateLastTextEntry: () => {
    const { currentForm } = get();
    if (currentForm) {
      console.log("Force updating lastTextEntry...");
      const newDate = new Date();

      set((state) => ({
        currentForm: { ...currentForm, lastTextEntry: newDate },
        savedForms: state.savedForms.map((form) =>
          form.id === currentForm.id
            ? { ...form, lastTextEntry: newDate }
            : form
        ),
      }));

      console.log("Force updated lastTextEntry to:", newDate);
    } else {
      console.log("No current form to force update");
    }
  },
}));
