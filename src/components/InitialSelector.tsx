'use client';

import { useState } from 'react';
import { useInitialsStore } from '@/stores/initialsStore';
import { usePaperFormStore } from '@/stores/paperFormStore';

interface InitialSelectorProps {
  className?: string;
  onInitialChange?: (initial: string) => void;
}

export function InitialSelector({ className = '', onInitialChange }: InitialSelectorProps) {
  const { getActiveInitials } = useInitialsStore();
  const { selectedInitial, setSelectedInitial } = usePaperFormStore();
  const [isOpen, setIsOpen] = useState(false);

  const activeInitials = getActiveInitials();

  const handleInitialSelect = (initial: string) => {
    if (onInitialChange) {
      onInitialChange(initial);
    } else {
      setSelectedInitial(initial);
    }
    setIsOpen(false);
  };

  const selectedInitialData = activeInitials.find(i => i.initials === selectedInitial);

  return (
    <div className={`relative ${className}`}>
      {/* Initial Dropdown */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-48 px-4 py-2 text-left bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 focus:outline-none focus:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              {selectedInitial ? (
                <div>
                  <div className="font-medium text-gray-900">{selectedInitial}</div>
                  <div className="text-sm text-gray-500">{selectedInitialData?.name}</div>
                </div>
              ) : (
                <span className="text-gray-500">Select Initial</span>
              )}
            </div>
            <svg
              className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg z-50">
            <div className="py-1">
              {activeInitials.map((initial) => (
                <button
                  key={initial.id}
                  onClick={() => handleInitialSelect(initial.initials)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                >
                  <div className="font-medium text-gray-900">{initial.initials}</div>
                  <div className="text-sm text-gray-500">{initial.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
