import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LogEntry, StageType, MOCK_USER, MOCK_THRESHOLDS } from '@/lib/types';
import { storageManager } from '@/lib/storage';

interface LogStore {
  currentLog: LogEntry | null;
  logs: LogEntry[];
  
  // Actions
  createNewLog: () => void;
  updateLogField: (field: keyof LogEntry, value: any) => void;
  updateStageData: (stage: StageType, data: { temperature?: number; time?: Date; isValid?: boolean; correctiveAction?: string; notes?: string }) => void;
  updateHACCPField: (field: keyof LogEntry['haccp'], value: boolean) => void;
  updateVisualInspection: (field: keyof LogEntry['visualInspection'], value: string) => void;
  addComplianceIssue: (issue: string) => void;
  removeComplianceIssue: (issue: string) => void;
  updateRiskLevel: (level: 'low' | 'medium' | 'high') => void;
  submitForReview: () => void;
  approveLog: (adminInitials: string, comments?: string) => void;
  rejectLog: (adminInitials: string, comments: string) => void;
  advanceToNextStage: () => void;
  validateStage: (stage: StageType, temperature: number, time: Date) => { isValid: boolean; reason?: string };
  saveLog: () => Promise<void>;
  loadLog: (id: string) => void;
  loadLogsFromStorage: () => Promise<void>;
}

const createEmptyLog = (): LogEntry => ({
  id: `log-${Date.now()}`,
  date: new Date(),
  shift: 'morning',
  
  // Product Information
  product: '',
  productCode: '',
  supplier: '',
  receivedDate: new Date(),
  expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  thermometerNumber: '',
  lotNumber: '',
  batchSize: 0,
  packagingType: '',
  
  // Employee Information
  employeeId: MOCK_USER.id,
  employeeName: MOCK_USER.name,
  employeeInitials: MOCK_USER.initials,
  supervisorInitials: '',
  
  // Cooking & Cooling Stages
  stages: {
    cook: {},
    startCooling: {},
    to80: {},
    to54: {},
    finalChill: {},
  },
  
  // HACCP Documentation
  haccp: {
    ccp1Verified: false,
    ccp2Verified: false,
    monitoringCompleted: false,
    correctiveActionsDocumented: false,
  },
  
  // Quality Control
  visualInspection: {
    color: 'normal',
    texture: 'normal',
    odor: 'normal',
    notes: '',
  },
  
  // Storage Information
  storageLocation: '',
  storageTemperature: 38,
  storageTime: new Date(),
  
  // Workflow Status
  currentStage: 'cook',
  isComplete: false,
  requiresReview: false,
  isApproved: false,
  adminComments: '',
  reviewedBy: '',
  
  // Compliance
  complianceIssues: [],
  riskLevel: 'low',
  
  // Signatures & Timestamps
  employeeSignature: '',
  supervisorSignature: '',
  adminSignature: '',
  
  // Additional Documentation
  photos: [],
  attachments: [],
  notes: '',
});

const getNextStage = (currentStage: StageType): StageType | null => {
  const stages: StageType[] = ['cook', 'startCooling', 'to80', 'to54', 'finalChill'];
  const currentIndex = stages.indexOf(currentStage);
  return currentIndex < stages.length - 1 ? stages[currentIndex + 1] : null;
};

export const useLogStore = create<LogStore>()(
  persist(
    (set, get) => ({
      currentLog: null,
      logs: [],

      createNewLog: () => {
        const newLog = createEmptyLog();
        set({ currentLog: newLog });
      },

      updateLogField: (field, value) => {
        const { currentLog } = get();
        if (!currentLog) return;

        set({
          currentLog: {
            ...currentLog,
            [field]: value,
          },
        });
      },

      updateHACCPField: (field, value) => {
        const { currentLog } = get();
        if (!currentLog) return;

        set({
          currentLog: {
            ...currentLog,
            haccp: {
              ...currentLog.haccp,
              [field]: value,
            },
          },
        });
      },

      updateVisualInspection: (field, value) => {
        const { currentLog } = get();
        if (!currentLog) return;

        set({
          currentLog: {
            ...currentLog,
            visualInspection: {
              ...currentLog.visualInspection,
              [field]: value,
            },
          },
        });
      },

      addComplianceIssue: (issue) => {
        const { currentLog } = get();
        if (!currentLog) return;

        if (!currentLog.complianceIssues.includes(issue)) {
          set({
            currentLog: {
              ...currentLog,
              complianceIssues: [...currentLog.complianceIssues, issue],
            },
          });
        }
      },

      removeComplianceIssue: (issue) => {
        const { currentLog } = get();
        if (!currentLog) return;

        set({
          currentLog: {
            ...currentLog,
            complianceIssues: currentLog.complianceIssues.filter(i => i !== issue),
          },
        });
      },

      updateRiskLevel: (level) => {
        const { currentLog } = get();
        if (!currentLog) return;

        set({
          currentLog: {
            ...currentLog,
            riskLevel: level,
          },
        });
      },

      submitForReview: () => {
        const { currentLog } = get();
        if (!currentLog) return;

        set({
          currentLog: {
            ...currentLog,
            requiresReview: true,
            submittedAt: new Date(),
          },
        });
      },

      approveLog: (adminInitials, comments) => {
        const { currentLog } = get();
        if (!currentLog) return;

        set({
          currentLog: {
            ...currentLog,
            isApproved: true,
            requiresReview: false,
            adminComments: comments || '',
            reviewedBy: adminInitials,
            reviewDate: new Date(),
          },
        });
      },

      rejectLog: (adminInitials, comments) => {
        const { currentLog } = get();
        if (!currentLog) return;

        set({
          currentLog: {
            ...currentLog,
            isApproved: false,
            requiresReview: true,
            adminComments: comments,
            reviewedBy: adminInitials,
            reviewDate: new Date(),
          },
        });
      },

      updateStageData: (stage, data) => {
        const { currentLog } = get();
        if (!currentLog) return;

        set({
          currentLog: {
            ...currentLog,
            stages: {
              ...currentLog.stages,
              [stage]: {
                ...currentLog.stages[stage],
                ...data,
              },
            },
          },
        });
      },

      advanceToNextStage: () => {
        const { currentLog } = get();
        if (!currentLog) return;

        const nextStage = getNextStage(currentLog.currentStage);
        if (!nextStage) {
          // Mark as complete if no next stage
          set({
            currentLog: {
              ...currentLog,
              isComplete: true,
            },
          });
          return;
        }

        set({
          currentLog: {
            ...currentLog,
            currentStage: nextStage,
          },
        });
      },

      validateStage: (stage, temperature, time) => {
        const { currentLog } = get();
        if (!currentLog) return { isValid: false, reason: 'No active log' };

        switch (stage) {
          case 'cook':
            if (temperature < MOCK_THRESHOLDS.cookMin) {
              return { isValid: false, reason: `Temperature must be at least ${MOCK_THRESHOLDS.cookMin}°F` };
            }
            return { isValid: true };

          case 'startCooling':
            if (temperature > MOCK_THRESHOLDS.to80Max + 47) { // 127°F threshold
              return { isValid: false, reason: 'Temperature must be 127°F or less to start cooling' };
            }
            return { isValid: true };

          case 'to80':
            if (temperature > MOCK_THRESHOLDS.to80Max) {
              return { isValid: false, reason: `Temperature must be ${MOCK_THRESHOLDS.to80Max}°F or less` };
            }
            // Check time constraint
            const startCoolingTime = currentLog.stages.startCooling.time;
            if (startCoolingTime) {
              const timeDiffMinutes = (time.getTime() - startCoolingTime.getTime()) / (1000 * 60);
              if (timeDiffMinutes > MOCK_THRESHOLDS.to80TimeMin) {
                return { isValid: false, reason: `Must reach 80°F within ${MOCK_THRESHOLDS.to80TimeMin} minutes` };
              }
            }
            return { isValid: true };

          case 'to54':
            if (temperature > MOCK_THRESHOLDS.to54Max) {
              return { isValid: false, reason: `Temperature must be ${MOCK_THRESHOLDS.to54Max}°F or less` };
            }
            // Check time constraint
            const startCoolingTime54 = currentLog.stages.startCooling.time;
            if (startCoolingTime54) {
              const timeDiffHours = (time.getTime() - startCoolingTime54.getTime()) / (1000 * 60 * 60);
              if (timeDiffHours > MOCK_THRESHOLDS.to54TimeHr) {
                return { isValid: false, reason: `Must reach 54°F within ${MOCK_THRESHOLDS.to54TimeHr} hours` };
              }
            }
            return { isValid: true };

          case 'finalChill':
            if (temperature > MOCK_THRESHOLDS.finalMax) {
              return { isValid: false, reason: `Temperature must be ${MOCK_THRESHOLDS.finalMax}°F or less` };
            }
            return { isValid: true };

          default:
            return { isValid: false, reason: 'Unknown stage' };
        }
      },

      saveLog: async () => {
        const { currentLog, logs } = get();
        if (!currentLog) return;

        const existingIndex = logs.findIndex(log => log.id === currentLog.id);
        const updatedLogs = existingIndex >= 0 
          ? logs.map((log, index) => index === existingIndex ? currentLog : log)
          : [...logs, currentLog];

        set({ logs: updatedLogs });

        // Save to IndexedDB
        try {
          await storageManager.saveLog(currentLog);
        } catch (error) {
          console.error('Failed to save log to IndexedDB:', error);
        }
      },

      loadLog: (id) => {
        const { logs } = get();
        const log = logs.find(log => log.id === id);
        if (log) {
          set({ currentLog: log });
        }
      },

      loadLogsFromStorage: async () => {
        try {
          const logsFromStorage = await storageManager.getLogs();
          set({ logs: logsFromStorage });
        } catch (error) {
          console.error('Failed to load logs from IndexedDB:', error);
          // Fallback to empty array if IndexedDB fails
          set({ logs: [] });
        }
      },
    }),
    {
      name: 'food-chilling-log-storage',
      partialize: (state) => ({ logs: state.logs }),
    }
  )
);
