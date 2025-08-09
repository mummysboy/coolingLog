'use client';

import { useState, useEffect, useRef } from 'react';
import { usePinStore } from '@/stores/pinStore';

interface PinAuthModalProps {
  isOpen: boolean;
  initials: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PinAuthModal({ isOpen, initials, onSuccess, onCancel }: PinAuthModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { authenticatePin, getPinForInitials } = usePinStore();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if PIN exists for these initials
  const pinExists = getPinForInitials(initials) !== null;

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setIsLoading(false);
      // Focus first input when modal opens
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleDigitChange = (index: number, value: string) => {
    // Only allow single digits
    if (value.length > 1) return;
    if (value && !/^\d$/.test(value)) return;

    const newPin = pin.split('');
    newPin[index] = value;
    
    // Pad with empty strings to maintain 4 length
    while (newPin.length < 4) {
      newPin.push('');
    }

    setPin(newPin.join(''));
    setError('');

    // Auto-focus next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      const newPin = pin.split('');
      
      if (newPin[index]) {
        // Clear current digit
        newPin[index] = '';
      } else if (index > 0) {
        // Move to previous input and clear it
        newPin[index - 1] = '';
        inputRefs.current[index - 1]?.focus();
      }
      
      setPin(newPin.join(''));
      setError('');
    }
    
    // Handle Enter key
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (pin.length !== 4) {
      setError('Please enter a 4-digit PIN');
      return;
    }

    if (!pinExists) {
      setError('No PIN set for these initials. Please contact an administrator.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate a small delay for better UX
    setTimeout(() => {
      const isValid = authenticatePin(initials, pin);
      
      if (isValid) {
        onSuccess();
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
        inputRefs.current[0]?.focus();
      }
      
      setIsLoading(false);
    }, 300);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    // Only allow 4-digit numbers
    if (/^\d{4}$/.test(pastedData)) {
      setPin(pastedData);
      setError('');
      // Focus last input after paste
      inputRefs.current[3]?.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">PIN Authentication</h3>
            <p className="text-gray-600">
              Enter the 4-digit PIN for <span className="font-medium text-blue-600">{initials}</span>
            </p>
          </div>

          {/* PIN Input */}
          <div className="flex justify-center space-x-3 mb-6">
            {[0, 1, 2, 3].map((index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={pin[index] || ''}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`
                  w-12 h-12 text-center text-xl font-bold border-2 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  transition-all duration-200
                  ${error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'}
                  ${pin[index] ? 'border-blue-400 bg-blue-50' : ''}
                `}
                disabled={isLoading}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center justify-center space-x-2 mb-4 text-red-600 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* No PIN Warning */}
          {!pinExists && (
            <div className="flex items-center space-x-2 mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <svg className="w-5 h-5 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-sm text-yellow-800">
                No PIN has been set for initials &quot;{initials}&quot;. Please contact an administrator to set up a PIN.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || pin.length !== 4 || !pinExists}
              className={`
                flex-1 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${isLoading || pin.length !== 4 || !pinExists
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
                }
              `}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : (
                'Authenticate'
              )}
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-4 text-center text-xs text-gray-500">
            PIN sessions expire after 30 minutes of inactivity
          </div>
        </div>
      </div>
    </div>
  );
}
