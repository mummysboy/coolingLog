'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface DatePickerProps {
  value: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  compact?: boolean;
}

export function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Select date", 
  className = "", 
  disabled = false,
  compact = false
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(value || '');
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('left');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Update selectedDate when value prop changes
  useEffect(() => {
    if (value) {
      // Parse the date string properly to avoid timezone issues
      const [year, month, day] = value.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      setSelectedDate(formatDateForInput(localDate));
    } else {
      setSelectedDate('');
    }
  }, [value]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate optimal dropdown position to prevent overflow
  const calculateDropdownPosition = () => {
    if (!dropdownRef.current) return 'left';
    
    const rect = dropdownRef.current.getBoundingClientRect();
    const dropdownWidth = 320; // Approximate width of date picker
    const viewportWidth = window.innerWidth;
    
    // Add some padding to ensure dropdown stays in view
    const padding = 20;
    
    // Check if dropdown would overflow to the right
    if (rect.left + dropdownWidth + padding > viewportWidth) {
      return 'left';
    }
    
    // Check if dropdown would overflow to the left
    if (rect.right - dropdownWidth - padding < 0) {
      return 'right';
    }
    
    // For smaller screens, prefer left positioning
    if (viewportWidth <= 1024) {
      return 'left';
    }
    
    // For larger screens, use right positioning if there's enough space
    return 'right';
  };

  const handleOpen = () => {
    console.log('DatePicker handleOpen called:', { disabled, isOpen });
    if (!disabled) {
      if (!isOpen) {
        // Calculate optimal position before opening
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
        setIsOpen(true);
        console.log('DatePicker opened');
      } else {
        setIsOpen(false);
        console.log('DatePicker closed');
      }
    } else {
      console.log('DatePicker is disabled, not opening');
    }
  };

  const handleDateConfirm = useCallback(() => {
    console.log('DatePicker handleDateConfirm called with:', selectedDate);
    onChange(selectedDate);
    setIsOpen(false);
  }, [selectedDate, onChange]);

  const formatDisplayDate = (date: string) => {
    if (!date) return '';
    try {
      // Parse the date string and create a local date to avoid timezone issues
      const [year, month, day] = date.split('-').map(Number);
      const localDate = new Date(year, month - 1, day);
      return localDate.toLocaleDateString();
    } catch {
      return date;
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'Enter':
          handleDateConfirm();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleDateConfirm]);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Native-looking Date Input */}
      <input
        type="text"
        value={value ? formatDisplayDate(value) : ''}
        placeholder={placeholder}
        onClick={(e) => {
          console.log('DatePicker input clicked:', { disabled, isOpen, value });
          handleOpen();
        }}
        readOnly
        disabled={disabled}
        className={`
          w-full cursor-pointer touch-manipulation
          ${compact ? 'px-3 py-2 text-sm' : 'px-3 py-3 mobile:px-4 mobile:py-3 ipad:px-5 ipad:py-4 text-sm mobile:text-base ipad:text-lg'}
          ${compact ? 'border border-gray-200 rounded-md' : 'border border-gray-300 rounded-lg mobile:rounded-xl ipad:rounded-2xl'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-500 active:bg-blue-50'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
          transition-all duration-150 ease-in-out
          ${value ? 'text-gray-900' : 'text-gray-500'}
        `}
        style={{ minHeight: compact ? '44px' : '48px' }}
      />

      {/* Custom Date Picker Dropdown */}
      {isOpen && !disabled && (
        <div 
          className={`absolute z-50 w-80 mobile:w-96 ipad:w-80 mt-2 bg-white border border-gray-300 rounded-lg mobile:rounded-xl ipad:rounded-2xl shadow-2xl ${
            dropdownPosition === 'left' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="p-3 mobile:p-4 ipad:p-5 border-b border-gray-200 bg-gray-50">
            <div className="text-center">
              <div className="text-lg mobile:text-xl ipad:text-2xl font-bold text-gray-900 mb-1">
                Select Date
              </div>
              <div className="text-sm mobile:text-base ipad:text-lg text-gray-600">
                {selectedDate ? formatDisplayDate(selectedDate) : 'No date selected'}
              </div>
            </div>
          </div>

          {/* Date Selection Interface */}
          <div className="p-3 mobile:p-4 ipad:p-5">
            <div className="mb-4">
              <label className="block text-sm mobile:text-base ipad:text-lg font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Month */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Month</label>
                  <select
                    value={selectedDate ? (() => {
                      const [year, month, day] = selectedDate.split('-').map(Number);
                      return month;
                    })() : new Date().getMonth() + 1}
                    onChange={(e) => {
                      const month = parseInt(e.target.value);
                      const currentDate = selectedDate ? new Date(selectedDate) : new Date();
                      // Create date in local timezone to avoid day shift
                      const [year, , day] = selectedDate ? selectedDate.split('-').map(Number) : [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];
                      const newDate = new Date(year, month - 1, day);
                      setSelectedDate(formatDateForInput(newDate));
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Day */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Day</label>
                  <select
                    value={selectedDate ? (() => {
                      const [year, month, day] = selectedDate.split('-').map(Number);
                      return day;
                    })() : new Date().getDate()}
                    onChange={(e) => {
                      const day = parseInt(e.target.value);
                      const currentDate = selectedDate ? new Date(selectedDate) : new Date();
                      // Create date in local timezone to avoid day shift
                      const [year, month] = selectedDate ? selectedDate.split('-').map(Number) : [currentDate.getFullYear(), currentDate.getMonth() + 1];
                      const newDate = new Date(year, month - 1, day);
                      setSelectedDate(formatDateForInput(newDate));
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  >
                    {Array.from({ length: 31 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {i + 1}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Year */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Year</label>
                  <select
                    value={selectedDate ? (() => {
                      const [year, month, day] = selectedDate.split('-').map(Number);
                      return year;
                    })() : new Date().getFullYear()}
                    onChange={(e) => {
                      const year = parseInt(e.target.value);
                      const currentDate = selectedDate ? new Date(selectedDate) : new Date();
                      // Create date in local timezone to avoid day shift
                      const [, month, day] = selectedDate ? selectedDate.split('-').map(Number) : [currentDate.getFullYear(), currentDate.getMonth() + 1, currentDate.getDate()];
                      const newDate = new Date(year, month - 1, day);
                      setSelectedDate(formatDateForInput(newDate));
                    }}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                  >
                    {Array.from({ length: 10 }, (_, i) => {
                      const year = new Date().getFullYear() - 5 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 mobile:p-4 ipad:p-5 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-2 mobile:space-x-3 ipad:space-x-4">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-2 mobile:py-3 ipad:py-4 px-3 mobile:px-4 ipad:px-5 bg-gray-300 text-gray-700 text-sm mobile:text-base ipad:text-lg font-medium rounded-lg mobile:rounded-xl ipad:rounded-2xl hover:bg-gray-400 active:bg-gray-500 transition-colors touch-manipulation"
                style={{ minHeight: '40px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleDateConfirm}
                className="flex-1 py-2 mobile:py-3 ipad:py-4 px-3 mobile:px-4 ipad:px-5 bg-blue-500 text-white text-sm mobile:text-base ipad:text-lg font-medium rounded-lg mobile:rounded-xl ipad:rounded-2xl hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                style={{ minHeight: '40px' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
