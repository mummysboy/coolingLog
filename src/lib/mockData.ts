import { LogEntry, MOCK_USERS } from './types';

export const createMockLog = (overrides?: Partial<LogEntry>): LogEntry => ({
  id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  date: new Date(),
  shift: 'morning',
  
  // Product Information
  product: 'Chicken Breast',
  productCode: 'CHK-001',
  supplier: 'Sysco Foods',
  receivedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
  expirationDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
  thermometerNumber: 'TH-042',
  lotNumber: 'LOT-2024-0156',
  batchSize: 25,
  packagingType: 'Vacuum Sealed',
  
  // Employee Information
  employeeId: MOCK_USERS[0].id,
  employeeName: MOCK_USERS[0].name,
  employeeInitials: MOCK_USERS[0].initials,
  supervisorInitials: MOCK_USERS[1].initials,
  
  // Cooking & Cooling Stages
  stages: {
    cook: {
      temperature: 168,
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      isValid: true,
      employeeInitials: MOCK_USERS[0].initials,
      notes: 'Cooked to proper internal temperature',
    },
    startCooling: {
      temperature: 125,
      time: new Date(Date.now() - 1.5 * 60 * 60 * 1000), // 1.5 hours ago
      isValid: true,
      employeeInitials: MOCK_USERS[0].initials,
      notes: 'Moved to cooling station',
    },
    to80: {
      temperature: 78,
      time: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      isValid: true,
      employeeInitials: MOCK_USERS[0].initials,
      notes: 'Reached 80°F within time limit',
    },
    to54: {
      temperature: 52,
      time: new Date(Date.now() - 0.5 * 60 * 60 * 1000), // 30 minutes ago
      isValid: true,
      employeeInitials: MOCK_USERS[0].initials,
      notes: 'Cooled to 54°F successfully',
    },
    finalChill: {
      temperature: 38,
      time: new Date(Date.now() - 0.25 * 60 * 60 * 1000), // 15 minutes ago
      isValid: true,
      employeeInitials: MOCK_USERS[0].initials,
      notes: 'Final storage temperature achieved',
    },
  },
  
  // HACCP Documentation
  haccp: {
    ccp1Verified: true,
    ccp2Verified: true,
    monitoringCompleted: true,
    correctiveActionsDocumented: false,
  },
  
  // Quality Control
  visualInspection: {
    color: 'normal',
    texture: 'normal',
    odor: 'normal',
    notes: 'No abnormalities detected during visual inspection',
  },
  
  // Storage Information
  storageLocation: 'Walk-in Cooler #1',
  storageTemperature: 38,
  storageTime: new Date(),
  
  // Workflow Status
  currentStage: 'finalChill',
  isComplete: true,
  requiresReview: true,
  isApproved: undefined,
  adminComments: '',
  reviewedBy: '',
  
  // Compliance
  complianceIssues: [],
  riskLevel: 'low',
  
  // Signatures & Timestamps
  employeeSignature: `${MOCK_USERS[0].name} - ${new Date().toISOString()}`,
  supervisorSignature: '',
  adminSignature: '',
  completedAt: new Date(),
  submittedAt: new Date(),
  
  // Additional Documentation
  photos: [],
  attachments: [],
  notes: 'Standard cooking and cooling procedure followed. No issues encountered.',
  
  ...overrides,
});

export const createFailedMockLog = (): LogEntry => createMockLog({
  id: `failed-log-${Date.now()}`,
  product: 'Ground Beef',
  productCode: 'BF-002',
  stages: {
    cook: {
      temperature: 162, // Below 165°F requirement
      time: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isValid: false,
      correctiveAction: 'Continued cooking until proper temperature reached',
      employeeInitials: MOCK_USERS[0].initials,
      notes: 'Initial temperature insufficient, corrective action taken',
    },
    startCooling: {
      temperature: 135,
      time: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      isValid: true,
      employeeInitials: MOCK_USERS[0].initials,
    },
    to80: {
      temperature: 85, // Above 80°F limit
      time: new Date(Date.now() - 0.5 * 60 * 60 * 1000),
      isValid: false,
      correctiveAction: 'Moved to blast chiller to accelerate cooling',
      employeeInitials: MOCK_USERS[0].initials,
      notes: 'Cooling time exceeded, blast chiller used',
    },
    to54: {},
    finalChill: {},
  },
  currentStage: 'to54',
  isComplete: false,
  complianceIssues: [
    'Temperature not maintained',
    'Time limits exceeded',
  ],
  riskLevel: 'medium',
  haccp: {
    ccp1Verified: false,
    ccp2Verified: false,
    monitoringCompleted: true,
    correctiveActionsDocumented: true,
  },
  notes: 'Multiple temperature deviations required corrective actions. Monitoring continues.',
});

export const createPendingReviewLog = (): LogEntry => createMockLog({
  id: `pending-${Date.now()}`,
  product: 'Fish Fillets',
  productCode: 'FSH-003',
  requiresReview: true,
  isApproved: undefined,
  complianceIssues: ['Visual abnormalities detected'],
  riskLevel: 'medium',
  visualInspection: {
    color: 'abnormal',
    texture: 'normal',
    odor: 'normal',
    notes: 'Slight discoloration noticed on edges, but within acceptable parameters',
  },
  notes: 'Product showed minor visual irregularities but passed all temperature checks. Submitted for supervisor review.',
});

export const SAMPLE_LOGS: LogEntry[] = [
  createMockLog(),
  createFailedMockLog(),
  createPendingReviewLog(),
];
