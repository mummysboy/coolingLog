import { storageManager } from './storageManager';
import { MOCK_USERS, MOCK_INITIALS } from './types';

export async function seedInitialData() {
  try {
    console.log('Seeding initial data...');
    
    // Check if we're using AWS and can seed users
    if (storageManager.isUsingAWS()) {
      // Seed users
      for (const user of MOCK_USERS) {
        try {
          await storageManager.createUser({
            initials: user.initials,
            name: user.name,
            role: user.role,
            certificationNumber: user.certificationNumber,
            email: user.email
          });
          console.log(`Created user: ${user.name}`);
        } catch (error) {
          console.log(`User ${user.name} already exists or failed to create`);
        }
      }

      // Seed initial entries
      for (const initial of MOCK_INITIALS) {
        try {
          await storageManager.createInitialEntry({
            initials: initial.initials,
            name: initial.name,
            isActive: initial.isActive,
            createdBy: initial.createdBy
          });
          console.log(`Created initial entry: ${initial.name}`);
        } catch (error) {
          console.log(`Initial entry ${initial.name} already exists or failed to create`);
        }
      }
    } else {
      console.log('Using local storage - seed data is already available via mock data');
    }
    
    console.log('Seed data completed');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}

// Helper function to check storage status
export function getStorageStatus() {
  const isAWS = storageManager.isUsingAWS();
  return {
    provider: isAWS ? 'AWS DynamoDB' : 'Local IndexedDB',
    isConnected: isAWS
  };
}
