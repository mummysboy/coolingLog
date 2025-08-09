'use client';

import { useState, useEffect } from 'react';
import { useInitialsStore } from '@/stores/initialsStore';
import { usePaperFormStore } from '@/stores/paperFormStore';
import { PaperFormEntry } from '@/lib/paperFormTypes';

interface InitialSelectorProps {
  className?: string;
}

export function InitialSelector({ className = '' }: InitialSelectorProps) {
  const { getActiveInitials } = useInitialsStore();
  const { selectedInitial, setSelectedInitial, getFormsForCurrentInitial, createNewForm, loadForm } = usePaperFormStore();
  const [isOpen, setIsOpen] = useState(false);
  const [showFormsDropdown, setShowFormsDropdown] = useState(false);
  const [availableForms, setAvailableForms] = useState<PaperFormEntry[]>([]);

  const activeInitials = getActiveInitials();

  useEffect(() => {
    if (selectedInitial) {
      const forms = getFormsForCurrentInitial();
      // Sort forms by date, newest first
      const sortedForms = forms.sort((a, b) => b.date.getTime() - a.date.getTime());
      setAvailableForms(sortedForms);
    } else {
      setAvailableForms([]);
    }
  }, [selectedInitial, getFormsForCurrentInitial]);

  const handleInitialSelect = (initial: string) => {
    setSelectedInitial(initial);
    setIsOpen(false);
    setShowFormsDropdown(false);
  };

  const handleNewForm = () => {
    if (selectedInitial) {
      createNewForm(selectedInitial);
      setShowFormsDropdown(false);
    }
  };

  const handleFormSelect = (form: PaperFormEntry) => {
    loadForm(form.id);
    setShowFormsDropdown(false);
  };

  const getFormStatus = (form: PaperFormEntry) => {
    const hasData = form.entries.some(entry => 
      entry.type || 
      entry.ccp1.temp || 
      entry.ccp2.temp || 
      entry.coolingTo80.temp || 
      entry.coolingTo54.temp || 
      entry.finalChill.temp
    );
    
    if (!hasData) {
      return { label: 'Empty', color: 'bg-gray-100 text-gray-800' };
    }
    
    const completeEntries = form.entries.filter(entry => 
      entry.type && 
      entry.ccp1.temp && 
      entry.ccp2.temp && 
      entry.coolingTo80.temp && 
      entry.coolingTo54.temp && 
      entry.finalChill.temp
    ).length;
    
    if (completeEntries === 0) {
      return { label: 'In Progress', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    return { label: 'Complete', color: 'bg-green-100 text-green-800' };
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

      {/* Form Management */}
      {selectedInitial && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Forms for {selectedInitial}: {availableForms.length}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={handleNewForm}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                New Form
              </button>
              {availableForms.length > 0 && (
                <button
                  onClick={() => setShowFormsDropdown(!showFormsDropdown)}
                  className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  View Forms
                </button>
              )}
            </div>
          </div>
          
          {showFormsDropdown && availableForms.length > 0 && (
            <div className="border rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
              {availableForms.map((form) => {
                const status = getFormStatus(form);
                return (
                  <div
                    key={form.id}
                    onClick={() => handleFormSelect(form)}
                    className="px-4 py-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {form.date.toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          Form #{form.id.slice(-6)}
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
