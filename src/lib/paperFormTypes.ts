// Types that exactly match the paper form structure

export interface PaperFormEntry {
  id: string;
  date: Date;
  
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

export const createEmptyForm = (): PaperFormEntry => ({
  id: `form-${Date.now()}`,
  date: new Date(),
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
});
