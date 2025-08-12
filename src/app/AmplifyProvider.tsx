'use client';

import { Amplify } from 'aws-amplify';
import awsExports from '../aws-exports.js';

// Configure Amplify
Amplify.configure(awsExports);

export function AmplifyProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
