import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { TimePicker } from './TimePicker';

describe('TimePicker', () => {
  const mockOnChange = jest.fn();
  const mockOnDataLogChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders data log checkbox when onDataLogChange is provided', () => {
    render(
      <TimePicker
        value="12:00"
        onChange={mockOnChange}
        onDataLogChange={mockOnDataLogChange}
        dataLog={false}
      />
    );

    expect(screen.getByText('Data Log')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('does not render data log checkbox when onDataLogChange is not provided', () => {
    render(
      <TimePicker
        value="12:00"
        onChange={mockOnChange}
        dataLog={false}
      />
    );

    expect(screen.queryByText('Data Log')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('calls onDataLogChange when checkbox is clicked', () => {
    render(
      <TimePicker
        value="12:00"
        onChange={mockOnChange}
        onDataLogChange={mockOnDataLogChange}
        dataLog={false}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockOnDataLogChange).toHaveBeenCalledWith(true);
  });

  it('displays correct data log state', () => {
    render(
      <TimePicker
        value="12:00"
        onChange={mockOnChange}
        onDataLogChange={mockOnDataLogChange}
        dataLog={true}
      />
    );

    const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('handles data log state changes correctly', () => {
    const { rerender } = render(
      <TimePicker
        value="12:00"
        onChange={mockOnChange}
        onDataLogChange={mockOnDataLogChange}
        dataLog={false}
      />
    );

    // Initially unchecked
    let checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    // Rerender with checked state
    rerender(
      <TimePicker
        value="12:00"
        onChange={mockOnChange}
        onDataLogChange={mockOnDataLogChange}
        dataLog={true}
      />
    );

    checkbox = screen.getByRole('checkbox') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });
});
