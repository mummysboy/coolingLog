'use client';

import { useState } from 'react';

interface ApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApprove: (initials: string) => void;
  formTitle?: string;
  formId?: string;
}

export function ApprovalModal({ isOpen, onClose, onApprove, formTitle, formId }: ApprovalModalProps) {
  const [initials, setInitials] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!initials.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onApprove(initials.trim().toUpperCase());
      setInitials('');
    } catch (error) {
      console.error('Error approving form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setInitials('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        {/* Modal */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Approve Form
              </h3>
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form Info */}
            {formTitle && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Form:</p>
                <p className="font-medium text-gray-900">{formTitle}</p>
                {formId && (
                  <p className="text-xs text-gray-500 mt-1">ID: {formId.slice(-6)}</p>
                )}
              </div>
            )}

            {/* Approval Message */}
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-green-800 font-medium">
                  Form Approved Successfully!
                </p>
              </div>
                <p className="text-green-700 text-sm mt-1">
                  This form has been approved and will show the approver&apos;s initials on the PDF.
                </p>
            </div>

            {/* Initials Input */}
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <label htmlFor="initials" className="block text-sm font-medium text-gray-700 mb-2">
                  Your Initials *
                </label>
                <input
                  type="text"
                  id="initials"
                  value={initials}
                  onChange={(e) => setInitials(e.target.value.toUpperCase())}
                  placeholder="Enter your initials"
                  maxLength={10}
                  required
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  These initials will appear on the PDF as &quot;Approved by: [INITIALS]&quot;
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={!initials.trim() || isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Approving...
                    </div>
                  ) : (
                    'Confirm Approval'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
