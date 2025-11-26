'use client';

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports.js';
import { useEffect } from 'react';

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  // Only configure Amplify in the browser (client-side only)
  // This prevents errors during static generation at build time
  useEffect(() => {
    if (typeof window !== 'undefined') {
      Amplify.configure(awsExports);
    }
  }, []);

  return <>{children}</>;
}
