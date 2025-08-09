'use client';

import { useEffect, useState } from 'react';
import { useLogStore } from '@/stores/logStore';
import { MOCK_USER } from '@/lib/types';
import { ProductPicker } from '@/components/ProductPicker';
import { StageStepper } from '@/components/StageStepper';
import { HACCPCompliance } from '@/components/HACCPCompliance';
import { AdminReview } from '@/components/AdminReview';
import { StickyToolbar } from '@/components/StickyToolbar';
import { createMockLog, createFailedMockLog, createPendingReviewLog } from '@/lib/mockData';

export default function LogPage() {
  const { currentLog, createNewLog } = useLogStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Simple initialization without IndexedDB for now
    if (!currentLog) {
      createNewLog();
    }
    setIsInitialized(true);
  }, [currentLog, createNewLog]);

  const loadSampleData = (type: 'complete' | 'failed' | 'pending') => {
    const { logs, currentLog } = useLogStore.getState();
    let sampleLog;
    
    switch (type) {
      case 'complete':
        sampleLog = createMockLog();
        break;
      case 'failed':
        sampleLog = createFailedMockLog();
        break;
      case 'pending':
        sampleLog = createPendingReviewLog();
        break;
    }
    
    // Replace current log with sample data
    useLogStore.setState({ currentLog: sampleLog });
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-2xl text-gray-600">Loading...</div>
      </div>
    );
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-lg font-medium text-gray-700">
            {today}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Cooking & Cooling Log
          </h1>
          <div className="flex items-center space-x-4">
            <a
              href="/admin"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              Admin Dashboard
            </a>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">
                  {MOCK_USER.initials}
                </span>
              </div>
              <span className="text-sm text-gray-600 hidden sm:block">
                {MOCK_USER.name}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-6 pb-32">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Demo Controls */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-purple-900">🧪 Demo Controls (Load Sample Data)</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => loadSampleData('complete')}
                className="touch-target py-3 px-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                ✅ Complete Log
              </button>
              <button
                onClick={() => loadSampleData('failed')}
                className="touch-target py-3 px-4 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-colors"
              >
                ❌ Failed Log
              </button>
              <button
                onClick={() => loadSampleData('pending')}
                className="touch-target py-3 px-4 bg-yellow-600 text-white rounded-xl font-medium hover:bg-yellow-700 transition-colors"
              >
                ⏳ Pending Review
              </button>
            </div>
            <p className="text-sm text-purple-700 mt-3">
              Click these buttons to load sample data showing different log states and workflow scenarios.
            </p>
          </div>
          {/* Product Information */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Product Information</h2>
            <ProductPicker />
          </div>

          {/* Cooking & Cooling Stages */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Cooking & Cooling Process</h2>
            <StageStepper />
          </div>

          {/* HACCP Compliance */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">HACCP Compliance & Quality Control</h2>
            <HACCPCompliance />
          </div>

          {/* Admin Review */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6 text-gray-900">Administrative Review</h2>
            <AdminReview />
          </div>

          {/* Documentation Notes */}
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-900">Additional Notes</h2>
            <textarea
              value={currentLog?.notes || ''}
              onChange={(e) => {
                const { updateLogField } = useLogStore.getState();
                updateLogField('notes', e.target.value);
              }}
              placeholder="Any additional observations, special procedures, or notes..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:outline-none resize-none"
            />
          </div>
        </div>
      </main>

      {/* Sticky Bottom Toolbar */}
      <StickyToolbar />
    </div>
  );
}
