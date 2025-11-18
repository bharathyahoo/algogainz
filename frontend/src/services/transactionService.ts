import { apiService } from './api';

export interface TransactionCharges {
  brokerage?: number;
  exchangeCharges?: number;
  gst?: number;
  sebiCharges?: number;
  stampDuty?: number;
}

export interface ManualTransactionRequest {
  transactionType: 'BUY' | 'SELL';
  stockSymbol: string;
  companyName: string;
  quantity: number;
  pricePerShare: number;
  timestamp: string; // ISO date string
  charges?: TransactionCharges;
  orderIdRef?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  stockSymbol: string;
  companyName: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  pricePerShare: number;
  grossAmount: number;
  brokerage: number;
  exchangeCharges: number;
  gst: number;
  sebiCharges: number;
  stampDuty: number;
  totalCharges: number;
  netAmount: number;
  source: 'APP_EXECUTED' | 'MANUALLY_RECORDED';
  orderIdRef?: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionFilters {
  startDate?: string;
  endDate?: string;
  type?: 'BUY' | 'SELL' | 'ALL';
  symbol?: string;
  source?: 'APP_EXECUTED' | 'MANUALLY_RECORDED' | 'ALL';
}

class TransactionService {
  /**
   * Record a manual transaction
   */
  async recordManualTransaction(request: ManualTransactionRequest): Promise<Transaction> {
    try {
      const response = await apiService.post('/transactions/manual', request);
      return response.data as Transaction;
    } catch (error: any) {
      console.error('Failed to record manual transaction:', error);
      throw new Error(error.message || 'Failed to record manual transaction');
    }
  }

  /**
   * Get transactions with filters
   */
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    try {
      const params: any = {};
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.type) params.type = filters.type;
      if (filters?.symbol) params.symbol = filters.symbol;
      if (filters?.source) params.source = filters.source;

      const response = await apiService.get('/transactions', params);
      return response.data as Transaction[];
    } catch (error: any) {
      console.error('Failed to get transactions:', error);
      throw new Error(error.message || 'Failed to get transactions');
    }
  }

  /**
   * Delete a manual transaction
   */
  async deleteTransaction(transactionId: string): Promise<void> {
    try {
      await apiService.delete(`/transactions/${transactionId}`);
    } catch (error: any) {
      console.error('Failed to delete transaction:', error);
      throw new Error(error.message || 'Failed to delete transaction');
    }
  }

  /**
   * Calculate total charges
   */
  calculateTotalCharges(charges?: TransactionCharges): number {
    if (!charges) return 0;
    return (
      (charges.brokerage || 0) +
      (charges.exchangeCharges || 0) +
      (charges.gst || 0) +
      (charges.sebiCharges || 0) +
      (charges.stampDuty || 0)
    );
  }

  /**
   * Calculate net amount
   */
  calculateNetAmount(
    transactionType: 'BUY' | 'SELL',
    quantity: number,
    pricePerShare: number,
    charges?: TransactionCharges
  ): number {
    const grossAmount = quantity * pricePerShare;
    const totalCharges = this.calculateTotalCharges(charges);

    return transactionType === 'BUY'
      ? grossAmount + totalCharges
      : grossAmount - totalCharges;
  }
}

export const transactionService = new TransactionService();
