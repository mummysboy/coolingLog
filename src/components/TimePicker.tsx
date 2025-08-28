'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface TimePickerProps {
  value: string;
  onChange: (time: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showQuickTimes?: boolean;
  compact?: boolean;
  dataLog?: boolean;
  onDataLogChange?: (dataLog: boolean) => void;
}

export function TimePicker({ 
  value, 
  onChange, 
  placeholder = "Select time", 
  className = "", 
  disabled = false,
  showQuickTimes = true,
  compact = false,
  dataLog = false,
  onDataLogChange
}: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [selectedHour, setSelectedHour] = useState('12');
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedAMPM, setSelectedAMPM] = useState<'AM' | 'PM'>('AM');
  const [dropdownPosition, setDropdownPosition] = useState<'left' | 'right'>('right');
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

  const handleTimeConfirm = useCallback(() => {
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
  }, [selectedHour, selectedMinute, selectedAMPM, onChange]);

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
  }, [isOpen, selectedHour, selectedMinute, selectedAMPM, handleTimeConfirm]);

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

  // Calculate optimal dropdown position to prevent overflow
  const calculateDropdownPosition = () => {
    if (!dropdownRef.current) return 'right';
    
    const rect = dropdownRef.current.getBoundingClientRect();
    const dropdownWidth = 320; // w-80 = 20rem = 320px
    const viewportWidth = window.innerWidth;
    
    // Check if dropdown would overflow to the right
    if (rect.left + dropdownWidth > viewportWidth) {
      return 'left';
    }
    
    return 'right';
  };

  const handleOpen = () => {
    if (!disabled) {
      if (!isOpen) {
        // Calculate optimal position before opening
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
        
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
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes}`;
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
          ${compact ? 'px-3 py-2 text-sm' : 'px-3 py-3 mobile:px-4 mobile:py-3 ipad:px-5 ipad:py-4 text-sm mobile:text-base ipad:text-lg'}
          ${compact ? 'border border-gray-200 rounded-md' : 'border border-gray-300 rounded-lg mobile:rounded-xl ipad:rounded-2xl'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-blue-500 active:bg-blue-50'}
          ${isOpen ? 'border-blue-500 ring-2 ring-blue-200' : ''}
          transition-all duration-150 ease-in-out
        `}
        style={{ minHeight: compact ? '44px' : '48px' }}
      >
        <span className={`${compact ? 'text-sm' : 'text-sm mobile:text-base ipad:text-lg'} ${value ? 'text-gray-900' : 'text-gray-500'}`}>
          {value ? formatDisplayTime(value) : placeholder}
        </span>

      </div>

      {/* Scrollable Time Picker Dropdown */}
      {isOpen && !disabled && (
        <div 
          className={`absolute z-50 w-72 mobile:w-80 ipad:w-96 mt-2 bg-white border border-gray-300 rounded-lg mobile:rounded-xl ipad:rounded-2xl shadow-2xl ${
            dropdownPosition === 'left' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header with current selection */}
          <div className="p-3 mobile:p-4 ipad:p-5 border-b border-gray-200 bg-gray-50 relative">
            {/* Data Log Checkbox - Top Right */}
            {onDataLogChange && (
              <div className="absolute top-2 right-2 flex items-center">
                <input
                  type="checkbox"
                  checked={dataLog || false}
                  onChange={(e) => onDataLogChange(e.target.checked)}
                  className="w-4 h-4 mr-2"
                />
                <span className="text-sm text-gray-600">Data Log</span>
              </div>
            )}
            <div className="text-center">
              <div className="text-xl mobile:text-2xl ipad:text-3xl font-bold text-gray-900 mb-1">
                {selectedHour}:{selectedMinute} {selectedAMPM}
              </div>
              <div className="text-sm mobile:text-base ipad:text-lg text-gray-600">
                {selectedHour}:{selectedMinute}
              </div>
            </div>
          </div>

          {/* Scrollable Time Wheels */}
          <div className="flex p-3 mobile:p-4 ipad:p-5">
            {/* Hours Wheel */}
            <div className="flex-1">
              <div className="text-center text-sm mobile:text-base ipad:text-lg font-medium text-gray-700 mb-2">Hours</div>
              <div 
                ref={hourScrollRef}
                className="h-40 mobile:h-44 ipad:h-48 overflow-y-auto scrollbar-hide border border-gray-200 rounded-lg mobile:rounded-xl ipad:rounded-2xl"
                style={{ scrollSnapType: 'y mandatory' }}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    onClick={() => setSelectedHour(hour.toString())}
                    className={`
                      py-2 mobile:py-3 ipad:py-3 text-center cursor-pointer transition-all duration-150 touch-manipulation
                      ${selectedHour === hour.toString() 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'hover:bg-gray-100'
                      }
                      scroll-snap-align: center
                    `}
                    style={{ minHeight: '40px' }}
                  >
                    {hour}
                  </div>
                ))}
              </div>
            </div>

            {/* Minutes Wheel */}
            <div className="flex-1 ml-2 mobile:ml-3 ipad:ml-4">
              <div className="text-center text-sm mobile:text-base ipad:text-lg font-medium text-gray-700 mb-2">Minutes</div>
              <div 
                ref={minuteScrollRef}
                className="h-40 mobile:h-44 ipad:h-48 overflow-y-auto scrollbar-hide border border-gray-200 rounded-lg mobile:rounded-xl ipad:rounded-2xl"
                style={{ scrollSnapType: 'y mandatory' }}
              >
                {minutes.map((minute) => (
                  <div
                    key={minute}
                    onClick={() => setSelectedMinute(minute)}
                    className={`
                      py-2 mobile:py-3 ipad:py-3 text-center cursor-pointer transition-all duration-150 touch-manipulation
                      ${selectedMinute === minute 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'hover:bg-gray-100'
                      }
                      scroll-snap-align: center
                    `}
                    style={{ minHeight: '40px' }}
                  >
                    {minute}
                  </div>
                ))}
              </div>
            </div>

            {/* AM/PM Selector */}
            <div className="flex-1 ml-2 mobile:ml-3 ipad:ml-4">
              <div className="text-center text-sm mobile:text-base ipad:text-lg font-medium text-gray-700 mb-2">AM/PM</div>
              <div className="h-40 mobile:h-44 ipad:h-48 flex flex-col border border-gray-200 rounded-lg mobile:rounded-xl ipad:rounded-2xl overflow-hidden">
                <button
                  onClick={() => setSelectedAMPM('AM')}
                  className={`
                    flex-1 flex items-center justify-center cursor-pointer transition-all duration-150 touch-manipulation
                    ${selectedAMPM === 'AM' 
                      ? 'bg-blue-500 text-white font-semibold' 
                      : 'bg-gray-50 hover:bg-gray-100'
                    }
                  `}
                  style={{ minHeight: '20px' }}
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
                  style={{ minHeight: '20px' }}
                >
                  PM
                </button>
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
                onClick={handleTimeConfirm}
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