import { useState, useEffect } from 'react';

/**
 * Custom hook to detect online/offline status
 * @returns boolean indicating if the user is online
 */
export const useOnlineStatus = (): boolean => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic connectivity check
    const intervalId = setInterval(() => {
      setIsOnline(navigator.onLine);
    }, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, []);

  return isOnline;
};
