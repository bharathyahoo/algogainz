import { apiService } from './api';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  type?: 'BUY' | 'SELL' | 'ALL';
  symbol?: string;
  source?: 'APP_EXECUTED' | 'MANUALLY_RECORDED' | 'ALL';
}

class ReportsService {
  /**
   * Generate and download transaction report in Excel format
   */
  async generateTransactionReport(filters?: ReportFilters): Promise<void> {
    try {
      const params: any = {};
      if (filters?.startDate) params.startDate = filters.startDate;
      if (filters?.endDate) params.endDate = filters.endDate;
      if (filters?.type) params.type = filters.type;
      if (filters?.symbol) params.symbol = filters.symbol;
      if (filters?.source) params.source = filters.source;

      // Build query string
      const queryString = new URLSearchParams(params).toString();
      const url = `/reports/transactions${queryString ? `?${queryString}` : ''}`;

      // Get the token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Fetch the file as blob
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${url}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate report');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'AlgoGainz_Transactions.xlsx';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      console.error('Failed to generate report:', error);
      throw new Error(error.message || 'Failed to generate report');
    }
  }
}

export const reportsService = new ReportsService();
