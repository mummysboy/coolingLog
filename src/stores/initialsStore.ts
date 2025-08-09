import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { InitialEntry, MOCK_INITIALS } from '@/lib/types';

interface InitialsStore {
  initials: InitialEntry[];
  
  // Actions
  addInitial: (initials: string, name: string, createdBy: string) => void;
  removeInitial: (id: string) => void;
  toggleInitialStatus: (id: string) => void;
  getActiveInitials: () => InitialEntry[];
}

export const useInitialsStore = create<InitialsStore>()(
  persist(
    (set, get) => ({
      initials: MOCK_INITIALS,

      addInitial: (initials, name, createdBy) => {
        const { initials: currentInitials } = get();
        
        // Check if initials already exist
        const existingInitial = currentInitials.find(i => i.initials === initials);
        if (existingInitial) {
          return; // Don't add duplicate initials
        }

        const newInitial: InitialEntry = {
          id: `init-${Date.now()}`,
          initials,
          name,
          isActive: true,
          createdAt: new Date(),
          createdBy,
        };

        set({ initials: [...currentInitials, newInitial] });
      },

      removeInitial: (id) => {
        const { initials } = get();
        set({ initials: initials.filter(i => i.id !== id) });
      },

      toggleInitialStatus: (id) => {
        const { initials } = get();
        set({
          initials: initials.map(i =>
            i.id === id ? { ...i, isActive: !i.isActive } : i
          ),
        });
      },

      getActiveInitials: () => {
        const { initials } = get();
        return initials.filter(i => i.isActive);
      },
    }),
    {
      name: 'initials-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.initials) {
          // Convert date strings back to Date objects
          state.initials = state.initials.map(initial => ({
            ...initial,
            createdAt: new Date(initial.createdAt),
          }));
        }
      },
    }
  )
);
