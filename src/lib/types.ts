export interface User {
  id: string;
  initials: string;
  name: string;
  role: 'employee' | 'supervisor' | 'admin';
  certificationNumber?: string;
  email?: string;
}

export interface StageThresholds {
  cookMin: number;
  to80Max: number;
  to80TimeMin: number; // minutes
  to54Max: number;
  to54TimeHr: number; // hours
  finalMax: number;
}

export interface StageData {
  temperature?: number;
  time?: Date;
  isValid?: boolean;
  correctiveAction?: string;
  employeeInitials?: string;
  notes?: string;
}

export interface HACCPRecord {
  criticalControlPoint: string;
  criticalLimit: string;
  monitoringProcedure: string;
  frequency: string;
  responsiblePerson: string;
}

export interface LogEntry {
  id: string;
  date: Date;
  shift: 'morning' | 'afternoon' | 'evening' | 'overnight';
  
  // Product Information
  product: string;
  productCode?: string;
  supplier?: string;
  receivedDate?: Date;
  expirationDate?: Date;
  thermometerNumber: string;
  lotNumber: string;
  batchSize?: number;
  packagingType?: string;
  
  // Employee Information
  employeeId: string;
  employeeName: string;
  employeeInitials: string;
  supervisorInitials?: string;
  
  // Cooking & Cooling Stages
  stages: {
    cook: StageData;
    startCooling: StageData;
    to80: StageData;
    to54: StageData;
    finalChill: StageData;
  };
  
  // HACCP Documentation
  haccp: {
    ccp1Verified: boolean;
    ccp2Verified: boolean;
    monitoringCompleted: boolean;
    correctiveActionsDocumented: boolean;
  };
  
  // Quality Control
  visualInspection: {
    color: 'normal' | 'abnormal';
    texture: 'normal' | 'abnormal';
    odor: 'normal' | 'abnormal';
    notes?: string;
  };
  
  // Storage Information
  storageLocation: string;
  storageTemperature?: number;
  storageTime?: Date;
  
  // Workflow Status
  currentStage: StageType;
  isComplete: boolean;
  requiresReview: boolean;
  isApproved?: boolean;
  adminComments?: string;
  reviewedBy?: string;
  reviewDate?: Date;
  
  // Compliance
  complianceIssues: string[];
  riskLevel: 'low' | 'medium' | 'high';
  
  // Signatures & Timestamps
  employeeSignature?: string;
  supervisorSignature?: string;
  adminSignature?: string;
  completedAt?: Date;
  submittedAt?: Date;
  
  // Additional Documentation
  photos?: string[];
  attachments?: string[];
  notes?: string;
}

export type StageType = 'cook' | 'startCooling' | 'to80' | 'to54' | 'finalChill';

export interface StageConfig {
  id: StageType;
  name: string;
  requirement: string;
  isCCP?: boolean;
  hasDeadline?: boolean;
  deadlineHours?: number;
}

export const STAGE_CONFIGS: StageConfig[] = [
  {
    id: 'cook',
    name: 'Cook',
    requirement: 'Temp must reach 166°F or greater (CCP1)',
    isCCP: true,
  },
  {
    id: 'startCooling',
    name: 'Start Cooling',
    requirement: '127°F or greater',
  },
  {
    id: 'to80',
    name: 'Cool to ≤80°F',
    requirement: 'within 105 min',
    hasDeadline: true,
    deadlineHours: 1.75, // 105 minutes
  },
  {
    id: 'to54',
    name: 'Cool to ≤54°F',
    requirement: 'within 4.75 hrs',
    hasDeadline: true,
    deadlineHours: 4.75,
  },
  {
    id: 'finalChill',
    name: 'Final Chill',
    requirement: '≤39°F',
  },
];

export const MOCK_THRESHOLDS: StageThresholds = {
  cookMin: 166,
  to80Max: 80,
  to80TimeMin: 105,
  to54Max: 54,
  to54TimeHr: 4.75,
  finalMax: 39,
};

export const MOCK_USERS: User[] = [
  {
    id: 'emp001',
    initials: 'AB',
    name: 'Alice Baker',
    role: 'employee',
    certificationNumber: 'FS-2024-001',
    email: 'alice.baker@restaurant.com',
  },
  {
    id: 'sup001',
    initials: 'JS',
    name: 'John Smith',
    role: 'supervisor',
    certificationNumber: 'FS-2024-SUP-001',
    email: 'john.smith@restaurant.com',
  },
  {
    id: 'adm001',
    initials: 'MJ',
    name: 'Maria Johnson',
    role: 'admin',
    certificationNumber: 'FS-2024-ADM-001',
    email: 'maria.johnson@restaurant.com',
  },
];

export const MOCK_USER = MOCK_USERS[0]; // Default employee user

export const PRODUCTS = [
  'Chicken Breast',
  'Ground Beef',
  'Pork Chops',
  'Fish Fillets',
  'Turkey',
  'Eggs',
  'Liquid Eggs',
  'Potato Salad',
  'Soup Base',
  'Pasta Dishes',
  'Rice Dishes',
  'Casseroles',
  'Sauces',
  'Other',
];

export const SUPPLIERS = [
  'Sysco Foods',
  'US Foods',
  'Performance Food Group',
  'Local Farm Co-op',
  'Premium Meats Inc',
  'Fresh Dairy Supply',
  'Ocean Fresh Seafood',
  'Organic Harvest',
];

export const STORAGE_LOCATIONS = [
  'Walk-in Cooler #1',
  'Walk-in Cooler #2',
  'Freezer Unit A',
  'Freezer Unit B',
  'Dry Storage',
  'Prep Cooler',
  'Service Line Cooler',
  'Blast Chiller',
];

export const PACKAGING_TYPES = [
  'Vacuum Sealed',
  'Food Grade Container',
  'Wrapped',
  'Boxed',
  'Bagged',
  'Canned',
  'Individual Portions',
  'Bulk Container',
];

export const HACCP_RECORDS: HACCPRecord[] = [
  {
    criticalControlPoint: 'CCP1 - Cooking Temperature',
    criticalLimit: 'Internal temperature reaches 165°F (74°C) for poultry, 145°F (63°C) for fish',
    monitoringProcedure: 'Use calibrated thermometer to check internal temperature',
    frequency: 'Every batch',
    responsiblePerson: 'Designated Cook/Food Handler',
  },
  {
    criticalControlPoint: 'CCP2 - Cooling Process',
    criticalLimit: 'Cool from 135°F to 70°F within 2 hours, then to 41°F within 4 additional hours',
    monitoringProcedure: 'Temperature monitoring with calibrated thermometer and time tracking',
    frequency: 'Continuous during cooling process',
    responsiblePerson: 'Food Safety Coordinator',
  },
  {
    criticalControlPoint: 'CCP3 - Cold Storage',
    criticalLimit: 'Maintain temperature at 41°F (5°C) or below',
    monitoringProcedure: 'Check and record refrigerator temperature',
    frequency: 'Every 4 hours',
    responsiblePerson: 'Kitchen Staff/Manager',
  },
];
