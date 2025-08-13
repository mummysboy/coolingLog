import { create } from 'zustand';
import { InitialEntry } from '@/lib/types';
import { storageManager } from '@/lib/storage';

interface InitialsStore {
  initials: InitialEntry[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadInitials: () => Promise<void>;
  addInitial: (initials: string, name: string, createdBy: string) => Promise<void>;
  removeInitial: (id: string) => Promise<void>;
  toggleInitialStatus: (id: string) => Promise<void>;
  getActiveInitials: () => InitialEntry[];
}

export const useInitialsStore = create<InitialsStore>()(
  (set, get) => ({
      initials: [],
      isLoading: false,
      error: null,

      loadInitials: async () => {
        try {
          set({ isLoading: true, error: null });
          const initials = await storageManager.getInitialEntries();
          set({ initials, isLoading: false });
        } catch (error) {
          console.error('Failed to load initials from AWS:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to load initials', 
            isLoading: false 
          });
        }
      },

      addInitial: async (initials, name, createdBy) => {
        try {
          const { initials: currentInitials } = get();
          
          // Check if initials already exist
          const existingInitial = currentInitials.find(i => i.initials === initials);
          if (existingInitial) {
            return; // Don't add duplicate initials
          }

          const newInitial = await storageManager.createInitialEntry({
            initials,
            name,
            isActive: true,
            createdBy,
          });

          set({ initials: [...currentInitials, newInitial] });
        } catch (error) {
          console.error('Failed to add initial to AWS:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add initial' 
          });
        }
      },

      removeInitial: async (id) => {
        try {
          const { initials } = get();
          const initialToRemove = initials.find(i => i.id === id);
          if (!initialToRemove) return;

          // Note: This would need a deleteInitialEntry method in AWS service
          // For now, we'll just remove from local state
          // TODO: Implement deleteInitialEntry in AWS service
          set({ initials: initials.filter(i => i.id !== id) });
        } catch (error) {
          console.error('Failed to remove initial:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to remove initial' 
          });
        }
      },

      toggleInitialStatus: async (id) => {
        try {
          const { initials } = get();
          const updatedInitials = initials.map(i =>
            i.id === id ? { ...i, isActive: !i.isActive } : i
          );
          
          // Note: This would need an updateInitialEntry method in AWS service
          // For now, we'll just update local state
          // TODO: Implement updateInitialEntry in AWS service
          set({ initials: updatedInitials });
        } catch (error) {
          console.error('Failed to toggle initial status:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to toggle initial status' 
          });
        }
      },

      getActiveInitials: () => {
        const { initials } = get();
        return initials.filter(i => i.isActive);
      },
    })
  );
