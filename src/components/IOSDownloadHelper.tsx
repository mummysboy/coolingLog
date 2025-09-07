'use client';

import { useState, useEffect } from 'react';
import { isIOS, isIOSSafari } from '@/lib/iosDownloadHelper';

interface IOSDownloadHelperProps {
  fileType: 'PDF' | 'JPEG';
  onDownload: () => void;
  className?: string;
}

export function IOSDownloadHelper({ fileType, onDownload, className = '' }: IOSDownloadHelperProps) {
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  useEffect(() => {
    setIsIOSDevice(isIOS());
  }, []);

  const handleDownload = () => {
    onDownload();
    
    // Show iOS-specific instructions after download attempt
    if (isIOSDevice) {
      setTimeout(() => {
        setShowIOSInstructions(true);
      }, 1000);
    }
  };

  const closeInstructions = () => {
    setShowIOSInstructions(false);
  };

  if (!isIOSDevice) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleDownload}
        className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors ${className}`}
      >
        Download {fileType}
      </button>

      {showIOSInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                iOS Download Instructions
              </h3>
              <button
                onClick={closeInstructions}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>
            
            <div className="text-sm text-gray-700 space-y-3">
              <p className="font-medium">To save this {fileType} on iOS:</p>
              
              <ol className="list-decimal list-inside space-y-2 ml-2">
                <li>Tap and hold the download link that appeared</li>
                <li>Select "Download Linked File" or "Save to Files"</li>
                <li>Choose your preferred location (Files app, Photos, etc.)</li>
              </ol>
              
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-blue-800 text-xs">
                  <strong>Alternative:</strong> If the download didn't work, tap the share button 
                  in Safari and select "Save to Files" or "Add to Photos" (for {fileType === 'JPEG' ? 'images' : 'documents'}).
                </p>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={closeInstructions}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
