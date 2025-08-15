import React, { useEffect } from 'react';
import PaperForm from './PaperForm';
import { usePaperFormStore } from '../stores/paperFormStore';
import { CookingCoolingFormEntry, FormType } from '../lib/paperFormTypes';

// Simple test form data
const testFormData: CookingCoolingFormEntry = {
  id: 'test-form-1',
  formType: FormType.COOKING_AND_COOLING,
  date: new Date(),
  formInitial: 'TEST',
  title: 'Test Form',
  status: 'In Progress' as const,
  entries: [
    {
      rack: '',
      type: 'Beef',
      ccp1: { temp: '170', time: '10:00', initial: 'AB', dataLog: false },
      ccp2: { temp: '130', time: '10:15', initial: 'CD', dataLog: true },
      coolingTo80: { temp: '75', time: '10:30', initial: 'EF', dataLog: false },
      coolingTo54: { temp: '50', time: '11:00', initial: 'GH', dataLog: false },
      finalChill: { temp: '35', time: '12:00', initial: 'IJ', dataLog: false },
    },
    {
      rack: 'Last Rack',
      type: 'Chicken',
      ccp1: { temp: '168', time: '10:05', initial: 'KL', dataLog: false },
      ccp2: { temp: '128', time: '10:20', initial: 'MN', dataLog: false },
      coolingTo80: { temp: '78', time: '10:35', initial: 'OP', dataLog: false },
      coolingTo54: { temp: '52', time: '11:05', initial: 'QR', dataLog: false },
      finalChill: { temp: '38', time: '12:05', initial: 'ST', dataLog: false },
    }
  ],
  thermometerNumber: 'T001',
  ingredients: { beef: 'Beef', chicken: 'Chicken', liquidEggs: 'Liquid Eggs' },
  lotNumbers: { beef: 'LOT001', chicken: 'LOT002', liquidEggs: 'LOT003' },
  correctiveActionsComments: '',
  adminComments: [],
  resolvedErrors: [],
  dateCreated: new Date(),
  lastTextEntry: new Date(),
};

export function PaperFormDebug() {
  useEffect(() => {
    // Load test data into the store so PaperForm can read it
    (usePaperFormStore as any).setState({ currentForm: testFormData });
    // cleanup: clear form on unmount
    return () => (usePaperFormStore as any).setState({ currentForm: null });
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">PaperForm Debug Component</h1>
      <div className="mb-4 p-4 bg-gray-100 rounded">
        <h2 className="text-lg font-semibold mb-2">Test Form Data:</h2>
        <pre className="text-xs overflow-auto">
          {JSON.stringify(testFormData, null, 2)}
        </pre>
      </div>
      
      <PaperForm 
        formId={testFormData.id}
        readOnly={false}
        onFormUpdate={(formId, updates) => {
          console.log('Form updated:', { formId, updates });
        }}
      />
    </div>
  );
}
