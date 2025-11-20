/**
 * useWebSocket Hook
 * React hook for WebSocket connectivity and real-time data
 */

import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { websocketService } from '../services/websocketService';
import type { RootState } from '../store';

/**
 * Hook to initialize and manage WebSocket connection
 */
export function useWebSocketConnection() {
  const { user, token, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const connectionInitialized = useRef(false);

  useEffect(() => {
    if (isAuthenticated && user && token && !connectionInitialized.current) {
      // Connect to WebSocket
      websocketService.connect(user.userId, token);
      connectionInitialized.current = true;

      console.log('[useWebSocket] Connected');
    }

    return () => {
      // Disconnect when component unmounts or user logs out
      if (!isAuthenticated && connectionInitialized.current) {
        websocketService.disconnect();
        connectionInitialized.current = false;
      }
    };
  }, [isAuthenticated, user, token]);

  return {
    isConnected: websocketService.isConnected(),
    connectionStatus: websocketService.getConnectionStatus(),
  };
}

/**
 * Hook to subscribe to stock price updates
 */
export function usePriceUpdates(symbols: string[], enabled = true) {
  const prevSymbolsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    const isConnected = websocketService.isConnected();
    if (!isConnected) {
      console.warn('[usePriceUpdates] Not connected to WebSocket');
      return;
    }

    // Find new symbols to subscribe
    const newSymbols = symbols.filter((s) => !prevSymbolsRef.current.includes(s));
    if (newSymbols.length > 0) {
      websocketService.subscribeToSymbols(newSymbols);
    }

    // Find old symbols to unsubscribe
    const removedSymbols = prevSymbolsRef.current.filter((s) => !symbols.includes(s));
    if (removedSymbols.length > 0) {
      websocketService.unsubscribeFromSymbols(removedSymbols);
    }

    prevSymbolsRef.current = symbols;

    return () => {
      // Cleanup: unsubscribe from all symbols
      if (prevSymbolsRef.current.length > 0) {
        websocketService.unsubscribeFromSymbols(prevSymbolsRef.current);
        prevSymbolsRef.current = [];
      }
    };
  }, [symbols, enabled]);
}

/**
 * Hook to listen for price updates
 */
export function useOnPriceUpdate(callback: (data: any) => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = websocketService.onPriceUpdate((data) => {
      callbackRef.current(data);
    });

    return unsubscribe;
  }, []);
}

/**
 * Hook to listen for market status updates
 */
export function useOnMarketStatus(callback: (data: any) => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = websocketService.onMarketStatus((data) => {
      callbackRef.current(data);
    });

    return unsubscribe;
  }, []);
}

/**
 * Hook to listen for alerts
 */
export function useOnAlert(callback: (data: any) => void) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const unsubscribe = websocketService.onAlert((data) => {
      callbackRef.current(data);
    });

    return unsubscribe;
  }, []);
}

/**
 * Hook to get connection status
 */
export function useConnectionStatus() {
  const [status, setStatus] = useState(websocketService.getConnectionStatus());

  useEffect(() => {
    const unsubscribe = websocketService.onConnectionStatus(setStatus);
    return unsubscribe;
  }, []);

  return status;
}
