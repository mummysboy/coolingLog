// Types that exactly match the paper form structure
// Deployment trigger: $(date)

export enum FormType {
  COOKING_AND_COOLING = 'COOKING_AND_COOLING',
  PIROSHKI_CALZONE_EMPANADA = 'PIROSHKI_CALZONE_EMPANADA',
  BAGEL_DOG_COOKING_COOLING = 'BAGEL_DOG_COOKING_COOLING'
}

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

// Base form interface with common fields
export interface BaseFormEntry {
  id: string;
  date: Date;
  dateCreated: Date;
  lastTextEntry: Date;
  formType: FormType;
  formInitial: string;
  status: 'Complete' | 'In Progress' | 'Error';
  title: string;
  entries: BaseFormRow[];
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
  adminComments: AdminComment[];
  resolvedErrors: string[];
}

// Base form row interface with common fields
export interface BaseFormRow {
  rack: '1st Rack' | 'Last Rack';
  type: string;
  ccp1: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
  ccp2: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
  coolingTo80: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
  coolingTo54: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
  finalChill: {
    temp: string;
    time: string;
    initial: string;
    dataLog: boolean;
  };
}

// Cooking and Cooling Form (Standard)
export interface CookingCoolingFormEntry extends BaseFormEntry {
  formType: FormType.COOKING_AND_COOLING;
  entries: CookingCoolingFormRow[];
}

export interface CookingCoolingFormRow extends BaseFormRow {
  // No additional fields beyond base
}

// Piroshki Form
export interface PiroshkiFormEntry extends BaseFormEntry {
  formType: FormType.PIROSHKI_CALZONE_EMPANADA;
  entries: PiroshkiFormRow[];
  quantityAndFlavor: {
    [key: number]: {
      quantity: string;
      flavor: string;
    };
  };
  preShipmentReview: {
    date: string;
    initials: string;
    results: string; // 'P' for Pass, 'F' for Fail
  };
}

export interface PiroshkiFormRow extends BaseFormRow {
  heatTreating: {
    type: string;
    temp: string;
    time: string;
    initial: string;
  };
  ccp2_126: {
    temp: string;
    time: string;
    initial: string;
  };
  ccp2_80: {
    temp: string;
    time: string;
    initial: string;
  };
  ccp2_55: {
    temp: string;
    time: string;
    initial: string;
  };
}

// Bagel Dog Form
export interface BagelDogFormEntry extends BaseFormEntry {
  formType: FormType.BAGEL_DOG_COOKING_COOLING;
  entries: BagelDogFormRow[];
  frankFlavorSizeTable: {
    beef81: { flavor: string; lotNumbers: string; packagesUsed: string };
    polish81: { flavor: string; lotNumbers: string; packagesUsed: string };
    jalapeno81: { flavor: string; lotNumbers: string; packagesUsed: string };
    jumboBeef41: { flavor: string; lotNumbers: string; packagesUsed: string };
    jumboPolish41: { flavor: string; lotNumbers: string; packagesUsed: string };
  };
  bagelDogPreShipmentReview: {
    date: string;
    results: string;
    signature: string;
  };
}

export interface BagelDogFormRow extends BaseFormRow {
  // No additional fields beyond base
}

// Union type for all form types
export type PaperFormEntry = CookingCoolingFormEntry | PiroshkiFormEntry | BagelDogFormEntry;

export const EMPTY_BASE_ROW: BaseFormRow = {
  rack: '1st Rack',
  type: '',
  ccp1: { temp: '', time: '', initial: '', dataLog: false },
  ccp2: { temp: '', time: '', initial: '', dataLog: false },
  coolingTo80: { temp: '', time: '', initial: '', dataLog: false },
  coolingTo54: { temp: '', time: '', initial: '', dataLog: false },
  finalChill: { temp: '', time: '', initial: '', dataLog: false },
};

export const EMPTY_PIROSHKI_ROW: PiroshkiFormRow = {
  ...EMPTY_BASE_ROW,
  heatTreating: { temp: '', time: '', initial: '', type: '' },
  ccp2_126: { temp: '', time: '', initial: '' },
  ccp2_80: { temp: '', time: '', initial: '' },
  ccp2_55: { temp: '', time: '', initial: '' },
};

export const createEmptyForm = (formType: FormType = FormType.COOKING_AND_COOLING, formInitial: string = ''): PaperFormEntry => {
  const now = new Date();
  const timeString = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  const dateString = now.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric' 
  });
  
  // Generate default title based on form type and time
  let defaultTitle = '';
  if (formType === FormType.COOKING_AND_COOLING) {
    defaultTitle = `Cooking & Cooling - ${dateString} ${timeString}`;
  } else if (formType === FormType.PIROSHKI_CALZONE_EMPANADA) {
    defaultTitle = `Piroshki - ${dateString} ${timeString}`;
  } else if (formType === FormType.BAGEL_DOG_COOKING_COOLING) {
    defaultTitle = `Bagel Dog - ${dateString} ${timeString}`;
  }
  
  const baseForm: Omit<BaseFormEntry, 'formType' | 'entries'> = {
    id: `form-${Date.now()}`,
    date: now,
    dateCreated: now,
    lastTextEntry: now,
    formInitial,
    status: 'In Progress' as const,
    title: defaultTitle,
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

  if (formType === FormType.COOKING_AND_COOLING) {
    return {
      ...baseForm,
      formType: FormType.COOKING_AND_COOLING,
      entries: Array.from({ length: 9 }, () => ({ ...EMPTY_BASE_ROW })),
    } as CookingCoolingFormEntry;
  }

  if (formType === FormType.PIROSHKI_CALZONE_EMPANADA) {
    return {
      ...baseForm,
      formType: FormType.PIROSHKI_CALZONE_EMPANADA,
      entries: Array.from({ length: 9 }, () => ({ ...EMPTY_PIROSHKI_ROW })),
      quantityAndFlavor: {
        1: { quantity: '', flavor: '' },
        2: { quantity: '', flavor: '' },
        3: { quantity: '', flavor: '' }
      },
      preShipmentReview: {
        date: '',
        initials: '',
        results: ''
      },
    } as PiroshkiFormEntry;
  }

  if (formType === FormType.BAGEL_DOG_COOKING_COOLING) {
    return {
      ...baseForm,
      formType: FormType.BAGEL_DOG_COOKING_COOLING,
      entries: Array.from({ length: 9 }, () => ({ ...EMPTY_BASE_ROW })),
      frankFlavorSizeTable: {
        beef81: { flavor: 'Beef 8-1', lotNumbers: '', packagesUsed: '' },
        polish81: { flavor: 'Polish 8-1', lotNumbers: '', packagesUsed: '' },
        jalapeno81: { flavor: 'Jalapeno 8-1', lotNumbers: '', packagesUsed: '' },
        jumboBeef41: { flavor: 'Jumbo Beef 4-1', lotNumbers: '', packagesUsed: '' },
        jumboPolish41: { flavor: 'Jumbo Polish 4-1', lotNumbers: '', packagesUsed: '' },
      },
      bagelDogPreShipmentReview: {
        date: '',
        results: '',
        signature: ''
      },
    } as BagelDogFormEntry;
  }

  // Default to cooking and cooling
  return {
    ...baseForm,
    formType: FormType.COOKING_AND_COOLING,
    entries: Array.from({ length: 9 }, () => ({ ...EMPTY_BASE_ROW })),
  } as CookingCoolingFormEntry;
};

// Utility function to safely convert dates
export const ensureDate = (date: Date | string | any): Date => {
  if (date instanceof Date) {
    if (isNaN(date.getTime())) {
      console.warn('Invalid Date object, using current date');
      return new Date();
    }
    return date;
  }
  
  if (typeof date === 'string') {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.warn('Invalid date string, using current date:', date);
      return new Date();
    }
    return parsedDate;
  }
  
  // Fallback for any other type
  console.warn('Invalid date type, using current date:', typeof date, date);
  return new Date();
};

// Type guards for form types
export const isCookingCoolingForm = (form: PaperFormEntry): form is CookingCoolingFormEntry => {
  return form.formType === FormType.COOKING_AND_COOLING;
};

export const isPiroshkiForm = (form: PaperFormEntry): form is PiroshkiFormEntry => {
  return form.formType === FormType.PIROSHKI_CALZONE_EMPANADA;
};

export const isBagelDogForm = (form: PaperFormEntry): form is BagelDogFormEntry => {
  return form.formType === FormType.BAGEL_DOG_COOKING_COOLING;
};
