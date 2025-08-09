import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PinEntry {
  id: string;
  initials: string;
  pin: string;
  createdAt: Date;
  createdBy: string;
  lastUsed?: Date;
  isActive: boolean;
}

interface PinStore {
  pins: PinEntry[];
  authenticatedSessions: Record<string, number>; // initials -> timestamp
  
  // Actions
  createPin: (initials: string, pin: string, createdBy: string) => boolean;
  updatePin: (initials: string, newPin: string, updatedBy: string) => boolean;
  deletePin: (initials: string) => boolean;
  authenticatePin: (initials: string, pin: string) => boolean;
  isAuthenticated: (initials: string) => boolean;
  clearAuthentication: (initials: string) => void;
  clearAllAuthentications: () => void;
  getPinForInitials: (initials: string) => PinEntry | null;
  getAllPins: () => PinEntry[];
  
  // Session management
  SESSION_TIMEOUT: number; // 30 minutes in milliseconds
}

// Default PINs for existing users
const DEFAULT_PINS: PinEntry[] = [
  {
    id: 'pin-001',
    initials: 'AB',
    pin: '0000',
    createdAt: new Date('2024-01-01'),
    createdBy: 'MJ',
    isActive: true,
  },
  {
    id: 'pin-002',
    initials: 'JS',
    pin: '0000',
    createdAt: new Date('2024-01-01'),
    createdBy: 'MJ',
    isActive: true,
  },
  {
    id: 'pin-003',
    initials: 'MJ',
    pin: '0000',
    createdAt: new Date('2024-01-01'),
    createdBy: 'MJ',
    isActive: true,
  },
];

export const usePinStore = create<PinStore>()(
  persist(
    (set, get) => ({
      pins: DEFAULT_PINS,
      authenticatedSessions: {},
      SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes

      createPin: (initials, pin, createdBy) => {
        const { pins } = get();
        
        // Check if PIN already exists for these initials
        const existingPin = pins.find(p => p.initials === initials);
        if (existingPin) {
          return false; // PIN already exists
        }

        // Validate PIN format (4 digits)
        if (!/^\d{4}$/.test(pin)) {
          return false; // Invalid PIN format
        }

        const newPin: PinEntry = {
          id: `pin-${Date.now()}`,
          initials,
          pin,
          createdAt: new Date(),
          createdBy,
          isActive: true,
        };

        set({ pins: [...pins, newPin] });
        return true;
      },

      updatePin: (initials, newPin, updatedBy) => {
        const { pins } = get();
        
        // Validate PIN format (4 digits)
        if (!/^\d{4}$/.test(newPin)) {
          return false; // Invalid PIN format
        }

        const pinIndex = pins.findIndex(p => p.initials === initials);
        if (pinIndex === -1) {
          return false; // PIN not found
        }

        const updatedPins = [...pins];
        updatedPins[pinIndex] = {
          ...updatedPins[pinIndex],
          pin: newPin,
          createdBy: updatedBy, // Track who last updated it
          createdAt: new Date(), // Update timestamp
        };

        set({ pins: updatedPins });
        return true;
      },

      deletePin: (initials) => {
        const { pins, authenticatedSessions } = get();
        
        const updatedPins = pins.filter(p => p.initials !== initials);
        
        // Clear any active session for this initial
        const updatedSessions = { ...authenticatedSessions };
        delete updatedSessions[initials];
        
        set({ 
          pins: updatedPins,
          authenticatedSessions: updatedSessions 
        });
        return true;
      },

      authenticatePin: (initials, pin) => {
        const { pins, authenticatedSessions } = get();
        
        const pinEntry = pins.find(p => p.initials === initials && p.isActive);
        if (!pinEntry || pinEntry.pin !== pin) {
          return false; // Invalid PIN or initials not found
        }

        // Update last used timestamp
        const updatedPins = pins.map(p => 
          p.initials === initials 
            ? { ...p, lastUsed: new Date() }
            : p
        );

        // Set authenticated session
        const updatedSessions = {
          ...authenticatedSessions,
          [initials]: Date.now(),
        };

        set({ 
          pins: updatedPins,
          authenticatedSessions: updatedSessions 
        });
        return true;
      },

      isAuthenticated: (initials) => {
        const { authenticatedSessions, SESSION_TIMEOUT } = get();
        
        const sessionTime = authenticatedSessions[initials];
        if (!sessionTime) {
          return false;
        }

        // Check if session has expired
        if (Date.now() - sessionTime > SESSION_TIMEOUT) {
          // Clear expired session
          const updatedSessions = { ...authenticatedSessions };
          delete updatedSessions[initials];
          set({ authenticatedSessions: updatedSessions });
          return false;
        }

        return true;
      },

      clearAuthentication: (initials) => {
        const { authenticatedSessions } = get();
        const updatedSessions = { ...authenticatedSessions };
        delete updatedSessions[initials];
        set({ authenticatedSessions: updatedSessions });
      },

      clearAllAuthentications: () => {
        set({ authenticatedSessions: {} });
      },

      getPinForInitials: (initials) => {
        const { pins } = get();
        return pins.find(p => p.initials === initials && p.isActive) || null;
      },

      getAllPins: () => {
        const { pins } = get();
        return pins.filter(p => p.isActive);
      },
    }),
    {
      name: 'pin-storage',
      partialize: (state) => ({ 
        pins: state.pins,
        // Don't persist authenticated sessions for security
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.pins) {
          // Convert date strings back to Date objects
          state.pins = state.pins.map(pin => ({
            ...pin,
            createdAt: new Date(pin.createdAt),
            lastUsed: pin.lastUsed ? new Date(pin.lastUsed) : undefined,
          }));
        }
        // Clear all sessions on reload for security
        state.authenticatedSessions = {};
      },
    }
  )
);
