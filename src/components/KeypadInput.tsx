'use client';

import { useState } from 'react';

interface KeypadInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

export function KeypadInput({ value, onChange, placeholder = "0", maxLength = 5 }: KeypadInputProps) {
  const [isKeypadOpen, setIsKeypadOpen] = useState(false);

  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      onChange(value.slice(0, -1));
    } else if (key === 'clear') {
      onChange('');
    } else if (key === '.' && value.includes('.')) {
      // Don't allow multiple decimal points
      return;
    } else if (value.length < maxLength) {
      onChange(value + key);
    }
  };

  const keypadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'delete'],
  ];

  return (
    <div className="relative">
      {/* Temperature Display */}
      <div
        onClick={() => setIsKeypadOpen(true)}
        className="flex items-center justify-center bg-white border-2 border-gray-300 rounded-xl p-6 cursor-pointer hover:border-blue-500 transition-colors"
      >
        <span className="text-4xl font-bold text-gray-900 min-w-[120px] text-center">
          {value || placeholder}
        </span>
        <span className="text-2xl font-medium text-gray-600 ml-2">°F</span>
      </div>

      {/* Keypad Modal */}
      {isKeypadOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 m-4 max-w-sm w-full">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Enter Temperature</h3>
              <button
                onClick={() => setIsKeypadOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            {/* Current Value Display */}
            <div className="bg-gray-100 rounded-xl p-4 mb-6 text-center">
              <span className="text-3xl font-bold text-gray-900">
                {value || '0'}
              </span>
              <span className="text-xl font-medium text-gray-600 ml-2">°F</span>
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {keypadKeys.flat().map((key, index) => (
                <button
                  key={index}
                  onClick={() => handleKeyPress(key)}
                  className={`touch-target aspect-square rounded-xl font-bold text-xl transition-all ${
                    key === 'delete'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {key === 'delete' ? '⌫' : key}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleKeyPress('clear')}
                className="touch-target py-3 bg-gray-200 text-gray-700 rounded-xl font-medium hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setIsKeypadOpen(false)}
                className="touch-target py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
