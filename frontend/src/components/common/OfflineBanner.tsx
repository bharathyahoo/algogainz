import React from 'react';
import { Alert, Snackbar, Slide } from '@mui/material';
import type { SlideProps } from '@mui/material';
import { WifiOff, Wifi } from '@mui/icons-material';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = React.useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = React.useState(false);

  React.useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      setShowOnlineMessage(false);
    } else if (wasOffline) {
      // Show "back online" message temporarily
      setShowOnlineMessage(true);
      const timer = setTimeout(() => {
        setShowOnlineMessage(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  return (
    <>
      {/* Offline Banner */}
      <Snackbar
        open={!isOnline}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={SlideTransition}
      >
        <Alert
          severity="warning"
          icon={<WifiOff />}
          sx={{
            width: '100%',
            boxShadow: 3,
          }}
        >
          <strong>Offline Mode</strong> - You're viewing cached data. Some features may be limited.
        </Alert>
      </Snackbar>

      {/* Back Online Banner */}
      <Snackbar
        open={showOnlineMessage}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        TransitionComponent={SlideTransition}
        autoHideDuration={3000}
        onClose={() => setShowOnlineMessage(false)}
      >
        <Alert
          severity="success"
          icon={<Wifi />}
          sx={{
            width: '100%',
            boxShadow: 3,
          }}
        >
          <strong>Back Online</strong> - Connection restored!
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineBanner;
