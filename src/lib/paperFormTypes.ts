// Types that exactly match the paper form structure

export enum FormType {
  FOOD_CHILLING_LOG = 'FOOD_CHILLING_LOG',
  // Add more form types here as they are created
  // TEMPERATURE_LOG = 'TEMPERATURE_LOG',
  // INVENTORY_LOG = 'INVENTORY_LOG',
  // CLEANING_LOG = 'CLEANING_LOG',
}

// Example of how to add a new form type:
// 1. Add the new type to the FormType enum above
// 2. Update the helper functions below to handle the new type
// 3. Add the new form type to the dropdown in src/app/form/page.tsx
// 4. Create the corresponding form component and logic

// Helper function to get display names for form types
export const getFormTypeDisplayName = (formType: FormType): string => {
  switch (formType) {
    case FormType.FOOD_CHILLING_LOG:
      return 'Food Chilling Log';
    default:
      return 'Unknown Form Type';
  }
};

// Helper function to get description for form types
export const getFormTypeDescription = (formType: FormType): string => {
  switch (formType) {
    case FormType.FOOD_CHILLING_LOG:
      return 'Temperature monitoring for food safety';
    default:
      return 'No description available';
  }
};

// Helper function to get icon for form types (returns SVG path data)
export const getFormTypeIcon = (formType: FormType): string => {
  switch (formType) {
    case FormType.FOOD_CHILLING_LOG:
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'; // Checkmark in circle
    default:
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'; // Document icon
  }
};

// Helper function to get color scheme for form types
export const getFormTypeColors = (formType: FormType): { bg: string; text: string; hover: string } => {
  switch (formType) {
    case FormType.FOOD_CHILLING_LOG:
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        hover: 'hover:bg-blue-200'
      };
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        hover: 'hover:bg-gray-200'
      };
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
  
  // Admin comments and resolution
  adminComments: AdminComment[];
  resolvedErrors: string[]; // Array of error IDs that have been resolved
}

export interface PaperFormRow {
  type: string; // Product type
  
  // CCP 1 - Temperature Must reach 166°F or greater
  ccp1: {
    temp: string;
    time: string;
    initial: string;
  };
  
  // CCP 2 - 127°F or greater (Record Temperature of 1st and LAST rack/batch of the day)
  ccp2: {
    temp: string;
    time: string;
    initial: string;
  };
  
  // 80°F or below within 105 minutes (Record Temperature of 1st rack/batch of the day)
  coolingTo80: {
    temp: string;
    time: string;
    initial: string;
  };
  
  // 54°F or below within 4.75 hr
  coolingTo54: {
    temp: string;
    time: string;
    initial: string;
  };
  
  // Chill Continuously to 39°F or below
  finalChill: {
    temp: string;
    time: string;
    initial: string;
  };
}

export const EMPTY_ROW: PaperFormRow = {
  type: '',
  ccp1: { temp: '', time: '', initial: '' },
  ccp2: { temp: '', time: '', initial: '' },
  coolingTo80: { temp: '', time: '', initial: '' },
  coolingTo54: { temp: '', time: '', initial: '' },
  finalChill: { temp: '', time: '', initial: '' },
};

export const createEmptyForm = (formType: FormType = FormType.FOOD_CHILLING_LOG, formInitial: string = ''): PaperFormEntry => ({
  id: `form-${Date.now()}`,
  date: new Date(),
  formType,
  formInitial,
  status: 'In Progress', // Default status for new forms
  title: '', // Default empty title for new forms
  entries: Array(9).fill(null).map(() => ({ ...EMPTY_ROW })),
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
});
