/**
 * Frontend Unit Tests - Auth Redux Slice
 * Tests authentication state management
 */

import { describe, it, expect, beforeEach } from 'vitest';
import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  setUser,
} from '../../store/authSlice';
import type { AuthState, User } from '../../types';

describe('Auth Slice', () => {
  let initialState: AuthState;

  beforeEach(() => {
    // Reset state before each test
    initialState = {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    };
    // Clear localStorage
    localStorage.clear();
  });

  describe('loginStart', () => {
    it('should set loading state to true', () => {
      const state = authReducer(initialState, loginStart());

      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should clear previous errors', () => {
      const stateWithError: AuthState = {
        ...initialState,
        error: 'Previous error',
      };

      const state = authReducer(stateWithError, loginStart());

      expect(state.error).toBeNull();
    });
  });

  describe('loginSuccess', () => {
    it('should set authenticated state with user and token', () => {
      const mockUser: User = {
        userId: 'user-123',
        email: 'test@example.com',
        kiteUserId: 'KITE123',
        name: 'Test User',
      };
      const mockToken = 'jwt-token-abc123';

      const state = authReducer(
        initialState,
        loginSuccess({ user: mockUser, token: mockToken })
      );

      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe(mockToken);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should store token in localStorage', () => {
      const mockUser: User = {
        userId: 'user-123',
        email: 'test@example.com',
        kiteUserId: 'KITE123',
        name: 'Test User',
      };
      const mockToken = 'jwt-token-abc123';

      authReducer(
        initialState,
        loginSuccess({ user: mockUser, token: mockToken })
      );

      expect(localStorage.getItem('token')).toBe(mockToken);
    });
  });

  describe('loginFailure', () => {
    it('should set error and clear authentication', () => {
      const errorMessage = 'Invalid credentials';
      const state = authReducer(initialState, loginFailure(errorMessage));

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBe(errorMessage);
      expect(state.isLoading).toBe(false);
    });

    it('should remove token from localStorage', () => {
      localStorage.setItem('token', 'old-token');

      authReducer(initialState, loginFailure('Error'));

      expect(localStorage.getItem('token')).toBeNull();
    });

    it('should clear previous user data on failure', () => {
      const authenticatedState: AuthState = {
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          kiteUserId: 'KITE123',
          name: 'Test User',
        },
        token: 'old-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      const state = authReducer(authenticatedState, loginFailure('Login failed'));

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear all authentication state', () => {
      const authenticatedState: AuthState = {
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          kiteUserId: 'KITE123',
          name: 'Test User',
        },
        token: 'jwt-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      const state = authReducer(authenticatedState, logout());

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should remove token from localStorage', () => {
      localStorage.setItem('token', 'jwt-token');

      authReducer(initialState, logout());

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should update user information', () => {
      const updatedUser: User = {
        userId: 'user-456',
        email: 'updated@example.com',
        kiteUserId: 'KITE456',
        name: 'Updated User',
      };

      const state = authReducer(initialState, setUser(updatedUser));

      expect(state.user).toEqual(updatedUser);
    });

    it('should update user while maintaining authentication state', () => {
      const authenticatedState: AuthState = {
        user: {
          userId: 'user-123',
          email: 'test@example.com',
          kiteUserId: 'KITE123',
          name: 'Test User',
        },
        token: 'jwt-token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      const updatedUser: User = {
        ...authenticatedState.user!,
        name: 'New Name',
      };

      const state = authReducer(authenticatedState, setUser(updatedUser));

      expect(state.user?.name).toBe('New Name');
      expect(state.isAuthenticated).toBe(true);
      expect(state.token).toBe('jwt-token');
    });
  });

  describe('State Transitions', () => {
    it('should handle complete login flow', () => {
      // Start login
      let state = authReducer(initialState, loginStart());
      expect(state.isLoading).toBe(true);

      // Login success
      const mockUser: User = {
        userId: 'user-123',
        email: 'test@example.com',
        kiteUserId: 'KITE123',
        name: 'Test User',
      };
      state = authReducer(
        state,
        loginSuccess({ user: mockUser, token: 'jwt-token' })
      );

      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user).toEqual(mockUser);
      expect(state.token).toBe('jwt-token');
    });

    it('should handle failed login flow', () => {
      // Start login
      let state = authReducer(initialState, loginStart());
      expect(state.isLoading).toBe(true);

      // Login failure
      state = authReducer(state, loginFailure('Invalid credentials'));

      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');
    });

    it('should handle logout from authenticated state', () => {
      // First login
      let state = authReducer(
        initialState,
        loginSuccess({
          user: {
            userId: 'user-123',
            email: 'test@example.com',
            kiteUserId: 'KITE123',
            name: 'Test User',
          },
          token: 'jwt-token',
        })
      );

      expect(state.isAuthenticated).toBe(true);

      // Then logout
      state = authReducer(state, logout());

      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
    });
  });
});
