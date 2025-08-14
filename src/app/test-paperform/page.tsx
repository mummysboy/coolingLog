'use client';

import React from 'react';
import { PaperFormDebug } from '@/components/PaperFormDebug';

export default function TestPaperFormPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-center mb-8">PaperForm Debug Test</h1>
        <PaperFormDebug />
      </div>
    </div>
  );
}
