import { multiDatabaseStorageManager } from './multiDatabaseStorageManager';
import { type PaperFormEntry, FormType } from './paperFormTypes';

// AWS-only storage manager - no local fallback
class AWSOnlyStorageManager {
  private useAWS = true;

  // Test AWS connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('Testing AWS connection...');
      const isConnected = await multiDatabaseStorageManager.testConnection();
      this.useAWS = isConnected;
      return isConnected;
    } catch (error) {
      console.error('AWS connection test failed:', error);
      this.useAWS = false;
      return false;
    }
  }

  // Ensure AWS is available before any operation
  private async ensureAWS(): Promise<void> {
    if (!this.useAWS) {
      const isConnected = await this.testConnection();
      if (!isConnected) {
        throw new Error('AWS DynamoDB is not available. Please check your connection and try again.');
      }
    }
  }

  // Paper Form Methods - Now using multi-table approach
  async savePaperForm(form: PaperFormEntry): Promise<void> {
    await this.ensureAWS();
    return multiDatabaseStorageManager.savePaperForm(form);
  }

  async savePaperForms(forms: PaperFormEntry[]): Promise<void> {
    await this.ensureAWS();
    return multiDatabaseStorageManager.savePaperForms(forms);
  }

  async getPaperForm(id: string, formType: FormType): Promise<PaperFormEntry | undefined> {
    await this.ensureAWS();
    return multiDatabaseStorageManager.getPaperForm(id, formType);
  }

  async getPaperForms(): Promise<PaperFormEntry[]> {
    await this.ensureAWS();
    return multiDatabaseStorageManager.getPaperForms();
  }

  async deletePaperForm(id: string, formType: FormType): Promise<void> {
    await this.ensureAWS();
    return multiDatabaseStorageManager.deletePaperForm(id, formType);
  }

  async clearAllPaperForms(): Promise<void> {
    await this.ensureAWS();
    return multiDatabaseStorageManager.clearAllPaperForms();
  }

  // Date-based queries for paper forms
  async getPaperFormsByDateRange(startDate: Date, endDate: Date): Promise<PaperFormEntry[]> {
    await this.ensureAWS();
    // For now, get all forms and filter by date range
    // This could be optimized with database-specific queries later
    const allForms = await this.getPaperForms();
    return allForms.filter(form => {
      const formDate = new Date(form.date);
      return formDate >= startDate && formDate <= endDate;
    });
  }

  async getTodaysPaperForms(): Promise<PaperFormEntry[]> {
    await this.ensureAWS();
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    return this.getPaperFormsByDateRange(startOfDay, endOfDay);
  }

  async getPaperFormsByStatus(status: string): Promise<PaperFormEntry[]> {
    await this.ensureAWS();
    const allForms = await this.getPaperForms();
    return allForms.filter(form => form.status.toLowerCase() === status.toLowerCase());
  }

  async getPaperFormsByInitial(initial: string): Promise<PaperFormEntry[]> {
    await this.ensureAWS();
    const allForms = await this.getPaperForms();
    return allForms.filter(form => form.formInitial.toLowerCase() === initial.toLowerCase());
  }



  // Custom mutations for paper forms
  async updatePaperFormStatus(formId: string, status: string): Promise<PaperFormEntry> {
    await this.ensureAWS();
    // This would need to be implemented in the multi-table manager
    throw new Error('updatePaperFormStatus not yet implemented in multi-table manager');
  }

  async addAdminComment(formId: string, comment: any): Promise<PaperFormEntry> {
    await this.ensureAWS();
    // This would need to be implemented in the multi-table manager
    throw new Error('addAdminComment not yet implemented in multi-table manager');
  }

  async resolveError(formId: string, errorId: string): Promise<PaperFormEntry> {
    await this.ensureAWS();
    // This would need to be implemented in the multi-table manager
    throw new Error('resolveError not yet implemented in multi-table manager');
  }

  // Check if we're using AWS
  isUsingAWS(): boolean {
    return this.useAWS;
  }

  // Force re-enable AWS (for testing purposes)
  async enableAWS(): Promise<void> {
    this.useAWS = true;
    await this.testConnection();
  }
}

export const storageManager = new AWSOnlyStorageManager();
