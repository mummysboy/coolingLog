// Types that exactly match the paper form structure

export enum FormType {
  COOKING_AND_COOLING = 'COOKING_AND_COOLING',
  PIROSHKI_CALZONE_EMPANADA = 'PIROSHKI_CALZONE_EMPANADA',
  BAGEL_DOG_COOKING_COOLING = 'BAGEL_DOG_COOKING_COOLING'
}

// Example of how to add a new form type:
// 1. Add the new type to the FormType enum above
// 2. Update the helper functions below to handle the new type
// 3. Add the new form type to the dropdown in src/app/form/page.tsx
// 4. Create the corresponding form component and logic

// Helper function to get display names for form types
export const getFormTypeDisplayName = (formType: FormType): string => {
  switch (formType) {
    case FormType.COOKING_AND_COOLING:
      return 'Cooking and Cooling for Meat & Non Meat Ingredients';
    case FormType.PIROSHKI_CALZONE_EMPANADA:
      return 'Piroshki, Calzone, Empanada Heat Treating & Cooling CCP 2';
    case FormType.BAGEL_DOG_COOKING_COOLING:
      return 'Bagel Dog Cooking & Cooling';
    default:
      return 'Unknown Form Type';
  }
};

// Helper function to get description for form types
export const getFormTypeDescription = (formType: FormType): string => {
  switch (formType) {
    case FormType.COOKING_AND_COOLING:
      return 'Standard cooking and cooling log for meat and non-meat ingredients';
    case FormType.PIROSHKI_CALZONE_EMPANADA:
      return 'Heat treating and cooling log for piroshki, calzone, and empanada products';
    case FormType.BAGEL_DOG_COOKING_COOLING:
      return 'Cooking and cooling log for bagel dog products with CCP monitoring';
    default:
      return 'Unknown form type';
  }
};

// Helper function to get icon for form types (returns SVG path data)
export const getFormTypeIcon = (formType: FormType): string => {
  switch (formType) {
    case FormType.COOKING_AND_COOLING:
      return '🥩';
    case FormType.PIROSHKI_CALZONE_EMPANADA:
      return '📖';
    case FormType.BAGEL_DOG_COOKING_COOLING:
      return '🌭';
    default:
      return '📄';
  }
};

// Helper function to get color scheme for form types
export const getFormTypeColors = (formType: FormType): { bg: string; text: string; border: string } => {
  switch (formType) {
    case FormType.COOKING_AND_COOLING:
      return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
    case FormType.PIROSHKI_CALZONE_EMPANADA:
      return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
    case FormType.BAGEL_DOG_COOKING_COOLING:
      return { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' };
    default:
      return { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' };
  }
};

export interface AdminComment {
  id: string;
  adminInitial: string;
  timestamp: Date;
  comment: string;
}

export interface PaperFormEntry {
  id: string;
  date: Date;
  dateCreated: Date; // When the form was first created
  lastTextEntry: Date; // When text was last entered on the form
  formType: FormType; // The type of form
  formInitial: string; // The initial this form is associated with
  status: 'Complete' | 'In Progress' | 'Error'; // Automatically determined status
  title: string; // Custom title for the form
  
  // Row entries (1-9)
  entries: PaperFormRow[];
  
  // Bottom section
  thermometerNumber: string;
  ingredients: {
    beef: string;
    chicken: string;
    liquidEggs: string;
  };
  lotNumbers: {
    beef: string;
    chicken: string;
    liquidEggs: string;
  };
  correctiveActionsComments: string;
  
  // For Piroshki form - Quantity and Flavor
  quantityAndFlavor?: {
    [key: number]: {
      quantity: string;
      flavor: string;
    };
  };
  
  // For Piroshki form - Pre Shipment Review
  preShipmentReview?: {
    date: string;
    initials: string;
    results: string; // 'P' for Pass, 'F' for Fail
  };
  
  // For Bagel Dog form - Frank Flavor/Size Table
  frankFlavorSizeTable?: {
    beef81: { flavor: string; lotNumbers: string; packagesUsed: string };
    polish81: { flavor: string; lotNumbers: string; packagesUsed: string };
    jalapeno81: { flavor: string; lotNumbers: string; packagesUsed: string };
    jumboBeef41: { flavor: string; lotNumbers: string; packagesUsed: string };
    jumboPolish41: { flavor: string; lotNumbers: string; packagesUsed: string };
  };
  
  // For Bagel Dog form - Pre Shipment Review
  bagelDogPreShipmentReview?: {
    date: string;
    results: string;
    signature: string;
  };
  
  // Admin comments and resolution
  adminComments: AdminComment[];
  resolvedErrors: string[]; // Array of error IDs that have been resolved
}

export interface PaperFormRow {
  rack: '1st Rack' | 'Last Rack'; // Track whether this is 1st or Last rack
  type: string; // Product type
  
  // For Piroshki form - Heat Treating Step
  heatTreating?: {
    type: string;
    temp: string;
    time: string;
    initial: string;
  };
  
  // For Piroshki form - CCP 2 126°F
  ccp2_126?: {
    temp: string;
    time: string;
    initial: string;
  };
  
  // For Piroshki form - CCP 2 80°F
  ccp2_80?: {
    temp: string;
    time: string;
    initial: string;
  };
  
  // For Piroshki form - CCP 2 55°F
  ccp2_55?: {
    temp: string;
    time: string;
    initial: string;
  };
  
  // CCP 1 - Temperature Must reach 166°F or greater
  ccp1: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
  
  // CCP 2 - 127°F or greater (Record Temperature of 1st and LAST rack/batch of the day)
  ccp2: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
  
  // 80°F or below within 105 minutes (Record Temperature of 1st rack/batch of the day)
  coolingTo80: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
  
  // 54°F or below within 4.75 hr
  coolingTo54: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
  
  // Chill Continuously to 39°F or below
  finalChill: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
}

export const EMPTY_ROW: PaperFormRow = {
  rack: '1st Rack', // Default to 1st Rack for empty rows
  type: '',
  // For Piroshki form - Heat Treating Step
  heatTreating: { temp: '', time: '', initial: '', type: '' },
  // For Piroshki form - CCP 2 126°F
  ccp2_126: { temp: '', time: '', initial: '' },
  // For Piroshki form - CCP 2 80°F
  ccp2_80: { temp: '', time: '', initial: '' },
  // For Piroshki form - CCP 2 55°F
  ccp2_55: { temp: '', time: '', initial: '' },
  // CCP 1 - Temperature Must reach 166°F or greater
  ccp1: { temp: '', time: '', initial: '', dataLog: false },
  // CCP 2 - 127°F or greater (Record Temperature of 1st and LAST rack/batch of the day)
  ccp2: { temp: '', time: '', initial: '', dataLog: false },
  // 80°F or below within 105 minutes (Record Temperature of 1st rack/batch of the day)
  coolingTo80: { temp: '', time: '', initial: '', dataLog: false },
  // 54°F or below within 4.75 hr
  coolingTo54: { temp: '', time: '', initial: '', dataLog: false },
  // Chill Continuously to 39°F or below
  finalChill: { temp: '', time: '', initial: '', dataLog: false },
};

export const createEmptyForm = (formType: FormType = FormType.COOKING_AND_COOLING, formInitial: string = ''): PaperFormEntry => {
  const baseForm: Omit<PaperFormEntry, 'quantityAndFlavor' | 'preShipmentReview' | 'frankFlavorSizeTable' | 'bagelDogPreShipmentReview'> = {
    id: `form-${Date.now()}`,
    date: new Date(),
    dateCreated: new Date(), // Set dateCreated to current date
    lastTextEntry: new Date(), // Set lastTextEntry to current date
    formType,
    formInitial,
    status: 'In Progress' as const, // Default status for new forms
    title: '', // Default empty title for new forms
    entries: Array.from({ length: 9 }, () => ({ ...EMPTY_ROW })),
    thermometerNumber: '',
    ingredients: {
      beef: '',
      chicken: '',
      liquidEggs: '',
    },
    lotNumbers: {
      beef: '',
      chicken: '',
      liquidEggs: '',
    },
    correctiveActionsComments: '',
    adminComments: [],
    resolvedErrors: [],
  };

  // Add form-specific fields based on type
  if (formType === FormType.PIROSHKI_CALZONE_EMPANADA) {
    return {
      ...baseForm,
      // For Piroshki form - Quantity and Flavor
      quantityAndFlavor: {
        1: { quantity: '', flavor: '' },
        2: { quantity: '', flavor: '' },
        3: { quantity: '', flavor: '' }
      },
      // For Piroshki form - Pre Shipment Review
      preShipmentReview: {
        date: '',
        initials: '',
        results: ''
      },
    };
  }

  if (formType === FormType.BAGEL_DOG_COOKING_COOLING) {
    return {
      ...baseForm,
      // For Bagel Dog form - Frank Flavor/Size Table
      frankFlavorSizeTable: {
        beef81: { flavor: 'Beef 8-1', lotNumbers: '', packagesUsed: '' },
        polish81: { flavor: 'Polish 8-1', lotNumbers: '', packagesUsed: '' },
        jalapeno81: { flavor: 'Jalapeno 8-1', lotNumbers: '', packagesUsed: '' },
        jumboBeef41: { flavor: 'Jumbo Beef 4-1', lotNumbers: '', packagesUsed: '' },
        jumboPolish41: { flavor: 'Jumbo Polish 4-1', lotNumbers: '', packagesUsed: '' },
      },
      // For Bagel Dog form - Pre Shipment Review
      bagelDogPreShipmentReview: {
        date: '',
        results: '',
        signature: ''
      },
    };
  }

  return baseForm;
};

// Utility function to safely convert dates
export const ensureDate = (date: Date | string | any): Date => {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string') {
    return new Date(date);
  }
  // Fallback for any other type
  return new Date();
};
