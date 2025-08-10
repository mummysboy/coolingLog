'use client';

import React, { useState, useRef, useEffect } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showQuickTimes?: boolean;
  compact?: boolean;
}

export function TimePicker({ 
  value, 
  onChange, 
  placeholder = "Select time", 
  className = "", 
  disabled = false,
  showQuickTimes = true,
  compact = false
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAMPM, setSelectedAMPM] = useState<'AM' | 'PM'>('AM');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const hourScrollRef = useRef<HTMLDivElement>(null);
  const minuteScrollRef = useRef<HTMLDivElement>(null);

  // Get current time as default
  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Generate time options
  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12 instead of 0-23
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  // Parse current value into hours and minutes
  useEffect(() => {
    if (value) {
      const [hours, minutes] = value.split(':');
      const hour24 = parseInt(hours || '0');
      // Convert 24-hour to 12-hour
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
      setSelectedHour(hour12.toString());
      setSelectedMinute(minutes || '00');
      setSelectedAMPM(hour24 >= 12 ? 'PM' : 'AM');
    }
  }, [value]);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value);
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

  // Keyboard navigation for iPad keyboard
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      switch (event.key) {
        case 'Escape':
          setIsOpen(false);
          break;
        case 'Enter':
          handleTimeConfirm();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedHour, selectedMinute, selectedAMPM]);

  const handleTimeConfirm = () => {
    // Convert 12-hour to 24-hour format for storage
    let hour24 = parseInt(selectedHour);
    
    // Handle 12 AM and 12 PM cases
    if (selectedHour === '12') {
      hour24 = selectedAMPM === 'AM' ? 0 : 12;
    } else {
      // For other hours, add 12 if PM
      if (selectedAMPM === 'PM') {
        hour24 += 12;
      }
    }
    
    const newTime = `${hour24.toString().padStart(2, '0')}:${selectedMinute}`;
    onChange(newTime);
    setInputValue(newTime);
    setIsOpen(false);
  };

  const scrollToTime = (hour: string, minute: string) => {
    if (hourScrollRef.current && minuteScrollRef.current) {
      // Convert 24-hour to 12-hour for scrolling
      let hour12 = parseInt(hour);
      if (hour12 === 0) hour12 = 12;
      else if (hour12 > 12) hour12 -= 12;
      
      const hourIndex = hour12 - 1; // Convert to 0-based index
      const minuteIndex = parseInt(minute);
      
      // Scroll to the selected time positions
      const hourElement = hourScrollRef.current.children[hourIndex] as HTMLElement;
      const minuteElement = minuteScrollRef.current.children[minuteIndex] as HTMLElement;
      
      if (hourElement) {
        hourScrollRef.current.scrollTop = hourElement.offsetTop - 80; // Center the selected hour
      }
      if (minuteElement) {
        minuteScrollRef.current.scrollTop = minuteElement.offsetTop - 80; // Center the selected minute
      }
    }
  };

  const handleOpen = () => {
    if (!disabled) {
      if (!isOpen) {
        // Set current time when opening if no value exists
        if (!value) {
          const currentTime = getCurrentTime();
          const [hours, minutes] = currentTime.split(':');
          const hour24 = parseInt(hours);
          // Convert 24-hour to 12-hour
          const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24;
          setSelectedHour(hour12.toString());
          setSelectedMinute(minutes);
          setSelectedAMPM(hour24 >= 12 ? 'PM' : 'AM');
        }
        
        // Open dropdown and scroll to current time
        setIsOpen(true);
        setTimeout(() => {
          scrollToTime(selectedHour, selectedMinute);
        }, 100);
      } else {
        setIsOpen(false);
      }
    }
  };

  const formatDisplayTime = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get current AM/PM for display
  const getCurrentAMPM = () => {
    return selectedAMPM;
  };

  // Toggle AM/PM
  const toggleAMPM = () => {
    // This will be handled by the hour selection since we're using 12-hour format
    // Users can select any hour 1-12 and it will be interpreted correctly
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Time Input Display - iPad optimized */}
      <div
        onClick={handleOpen}
        className={`
          flex items-center justify-between cursor-pointer touch-manipulation
          ${compact ? 'px-3 py-2 text-sm' : 'px-4 py-3 text-base'}
          ${compact ? 'border border-gray-200 rounded-md' : 'border border-gray-300 rounded-lg'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-500 active:bg-blue-50'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
          transition-all duration-150 ease-in-out
        `}
        style={{ minHeight: compact ? '44px' : '48px' }}
      >
        <span className={`${compact ? 'text-sm' : 'text-base'} ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {compact ? (value || placeholder) : formatDisplayTime(value)}
        </span>
        <svg 
          className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Scrollable Time Picker Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute z-50 w-80 mt-2 bg-white border border-gray-300 rounded-xl shadow-2xl">
          {/* Header with current selection */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {selectedHour}:{selectedMinute} {selectedAMPM}
              </div>
              <div className="text-sm text-gray-600">
                {formatDisplayTime(`${selectedHour}:${selectedMinute}`)}
              </div>
            </div>
          </div>

          {/* Scrollable Time Wheels */}
          <div className="flex p-4">
            {/* Hours Wheel */}
            <div className="flex-1">
              <div className="text-center text-sm font-medium text-gray-700 mb-2">Hours</div>
              <div 
                ref={hourScrollRef}
                className="h-48 overflow-y-auto scrollbar-hide border border-gray-200 rounded-lg"
                style={{ scrollSnapType: 'y mandatory' }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => setSelectedHour(hour.toString())}
                    className={`
                      py-3 text-center cursor-pointer transition-all duration-150 touch-manipulation
                      ${selectedHour === hour.toString() 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'hover:bg-gray-100'
                      }
                      scroll-snap-align: center
                    `}
                    style={{ minHeight: '48px' }}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes Wheel */}
            <div className="flex-1 ml-4">
              <div className="text-center text-sm font-medium text-gray-700 mb-2">Minutes</div>
              <div 
                ref={minuteScrollRef}
                className="h-48 overflow-y-auto scrollbar-hide border border-gray-200 rounded-lg"
                style={{ scrollSnapType: 'y mandatory' }}
              >
                {minutes.map((minute) => (
                  <div
                    key={minute}
                    onClick={() => setSelectedMinute(minute)}
                    className={`
                      py-3 text-center cursor-pointer transition-all duration-150 touch-manipulation
                      ${selectedMinute === minute 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'hover:bg-gray-100'
                      }
                      scroll-snap-align: center
                    `}
                    style={{ minHeight: '48px' }}
                  >
                    {minute}
                  </div>
                ))}
              </div>
            </div>

            {/* AM/PM Selector */}
            <div className="flex-1 ml-4">
              <div className="text-center text-sm font-medium text-gray-700 mb-2">AM/PM</div>
              <div className="h-48 flex flex-col border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setSelectedAMPM('AM')}
                  className={`
                    flex-1 flex items-center justify-center cursor-pointer transition-all duration-150 touch-manipulation
                    ${selectedAMPM === 'AM' 
                      ? 'bg-blue-500 text-white font-semibold' 
                      : 'bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                  style={{ minHeight: '24px' }}
                >
                  AM
                </button>
                <button
                  onClick={() => setSelectedAMPM('PM')}
                  className={`
                    flex-1 flex items-center justify-center cursor-pointer transition-all duration-150 touch-manipulation
                    ${selectedAMPM === 'PM' 
                      ? 'bg-blue-500 text-white font-semibold' 
                      : 'bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                  style={{ minHeight: '24px' }}
                >
                  PM
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 px-4 bg-gray-300 text-gray-700 text-base font-medium rounded-lg hover:bg-gray-400 active:bg-gray-500 transition-colors touch-manipulation"
                style={{ minHeight: '48px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleTimeConfirm}
                className="flex-1 py-3 px-4 bg-blue-500 text-white text-base font-medium rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
                style={{ minHeight: '48px' }}
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