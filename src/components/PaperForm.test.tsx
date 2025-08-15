import React from 'react';
import { render, screen } from '@testing-library/react';
import PaperForm from './PaperForm';

// Mock the store
jest.mock('@/stores/paperFormStore', () => ({
  usePaperFormStore: () => ({
    currentForm: null,
    savedForms: [],
    updateEntry: jest.fn(),
    updateFormField: jest.fn(),
    updateFormStatus: jest.fn(),
    saveForm: jest.fn(),
    updateAdminForm: jest.fn(),
    setState: jest.fn(),
  }),
}));

// Mock the TextCell component
jest.mock('./TextCell', () => ({
  TextCell: ({ valueFromStore, placeholder }: any) => (
    <input value={valueFromStore} placeholder={placeholder} readOnly />
  ),
}));

// Mock other components
jest.mock('./TimePicker', () => ({
  TimePicker: () => <div data-testid="time-picker">TimePicker</div>,
}));

jest.mock('./KeypadInput', () => ({
  KeypadInput: () => <div data-testid="keypad-input">KeypadInput</div>,
}));

jest.mock('./TimerBadge', () => ({
  TimerBadge: () => <div data-testid="timer-badge">TimerBadge</div>,
}));

jest.mock('./HACCPCompliance', () => ({
  HACCPCompliance: () => <div data-testid="haccp-compliance">HACCPCompliance</div>,
}));

jest.mock('./CorrectiveActionSheet', () => ({
  CorrectiveActionSheet: () => <div data-testid="corrective-action-sheet">CorrectiveActionSheet</div>,
}));

describe('PaperForm', () => {
  const mockFormData = {
    id: 'test-form-1',
    formType: 'COOKING_AND_COOLING',
    date: new Date(),
    formInitial: 'TEST',
    status: 'In Progress',
    entries: [
      {
        rack: '',
        type: 'Beef',
        ccp1: { temp: '', time: '', initial: '', dataLog: false },
        ccp2: { temp: '', time: '', initial: '', dataLog: false },
        coolingTo80: { temp: '', time: '', initial: '', dataLog: false },
        coolingTo54: { temp: '', time: '', initial: '', dataLog: false },
        finalChill: { temp: '', time: '', initial: '', dataLog: false },
      },
    ],
    thermometerNumber: '',
    lotNumbers: { beef: '', chicken: '', liquidEggs: '' },
    correctiveActionsComments: '',
    resolvedErrors: [],
  };

  it('renders without crashing when form data is provided', () => {
  // load mock form into store
  (require('@/stores/paperFormStore').usePaperFormStore as any).setState({ currentForm: mockFormData });
  render(<PaperForm formId={mockFormData.id} />);
    
    // Should render the form table
    expect(screen.getByText('Rack')).toBeInTheDocument();
    expect(screen.getByText('Type')).toBeInTheDocument();
    expect(screen.getByText('CCP 1')).toBeInTheDocument();
  });

  it('renders form entries correctly', () => {
  (require('@/stores/paperFormStore').usePaperFormStore as any).setState({ currentForm: mockFormData });
  render(<PaperForm formId={mockFormData.id} />);
    
  // Should render the first entry with blank rack shown as the placeholder option
  expect(screen.getByDisplayValue('--')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Beef')).toBeInTheDocument();
  });

  it('handles read-only mode', () => {
  (require('@/stores/paperFormStore').usePaperFormStore as any).setState({ currentForm: mockFormData });
  render(<PaperForm formId={mockFormData.id} readOnly={true} />);
    
  // Should render in read-only mode (blank/default option should be disabled)
  expect(screen.getByDisplayValue('--')).toHaveAttribute('disabled');
  });

  it('returns null when no form data is provided', () => {
  const { container } = render(<PaperForm />);
    
    // Should return null (empty container)
    expect(container.firstChild).toBeNull();
  });
});
