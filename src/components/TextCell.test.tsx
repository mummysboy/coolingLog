import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TextCell } from './TextCell';

// Mock the debounced hook
jest.mock('@/hooks/useDebouncedStoreSync', () => ({
  useDebouncedStoreSync: () => ({
    local: 'test value',
    setLocal: jest.fn(),
    schedule: jest.fn(),
    flush: jest.fn(),
  }),
}));

describe('TextCell', () => {
  const mockCommitField = jest.fn();
  const mockOnBlurValidate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with correct value', () => {
    render(
      <TextCell
        formId="test-form"
        field="test-field"
        valueFromStore="initial value"
        commitField={mockCommitField}
      />
    );

    expect(screen.getByDisplayValue('test value')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <TextCell
        formId="test-form"
        field="test-field"
        valueFromStore="test"
        commitField={mockCommitField}
        className="custom-class"
      />
    );

    expect(screen.getByDisplayValue('test value')).toHaveClass('custom-class');
  });

  it('handles readOnly prop', () => {
    render(
      <TextCell
        formId="test-form"
        field="test-field"
        valueFromStore="test"
        commitField={mockCommitField}
        readOnly={true}
      />
    );

    expect(screen.getByDisplayValue('test value')).toHaveAttribute('readonly');
  });

  it('renders with correct input type', () => {
    render(
      <TextCell
        formId="test-form"
        field="test-field"
        valueFromStore="test"
        commitField={mockCommitField}
        type="number"
      />
    );

    expect(screen.getByDisplayValue('test value')).toHaveAttribute('type', 'number');
  });
});
