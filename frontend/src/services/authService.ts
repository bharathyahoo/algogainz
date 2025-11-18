import { apiService } from './api';
import type { User } from '../types';

/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

export const authService = {
  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiService.get<User>('/auth/me');
    if (!response.success || !response.data) {
      throw new Error('Failed to get user profile');
    }
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await apiService.post('/auth/logout');
    localStorage.removeItem('token');
  },

  /**
   * Initiate Kite login
   * This redirects to backend which then redirects to Kite
   */
  initiateLogin(): void {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
    window.location.href = `${backendUrl}/auth/login`;
  },

  /**
   * Extract user info from JWT token (without verifying signature)
   * This is just for UI purposes - real verification happens on backend
   */
  decodeToken(token: string): User | null {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const payload = JSON.parse(jsonPayload);

      return {
        userId: payload.userId,
        userName: payload.userName,
        email: payload.email,
      };
    } catch (error) {
      console.error('Failed to decode token:', error);
      return null;
    }
  },
};
