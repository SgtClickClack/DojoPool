/** @jsxImportSource react */
import React, { useState, useEffect } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Snackbar, Alert, Typography } from '@mui/material';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import SystemUpdateIcon from '@mui/icons-material/SystemUpdate';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [updateAvailable, setUpdateAvailable] = useState<boolean>(false);
  const [showUpdateSnackbar, setShowUpdateSnackbar] = useState<boolean>(false);

  // PWA installation prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      // Only show prompt to users who have used the app for a while
      const hasUsedBefore = localStorage.getItem('app_used_count');
      if (hasUsedBefore && parseInt(hasUsedBefore) > 3) {
        setOpenDialog(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app has been used before
    const appUsedCount = localStorage.getItem('app_used_count');
    const count = appUsedCount ? parseInt(appUsedCount) : 0;
    localStorage.setItem('app_used_count', (count + 1).toString());

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Online/offline detection
  useEffect(() => {
    const handleOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      if (navigator.onLine) {
        // We're back online, update the last sync time
        localStorage.setItem('lastSync', Date.now().toString());
      }
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Initialize last sync time if not set
    if (!localStorage.getItem('lastSync')) {
      localStorage.setItem('lastSync', Date.now().toString());
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  // Service worker updates
  useEffect(() => {
    if ('serviceWorker' in navigator && window.workbox !== undefined) {
      const wb = window.workbox;

      // New service worker waiting
      wb.addEventListener('waiting', () => {
        setUpdateAvailable(true);
        setShowUpdateSnackbar(true);
      });

      // New service worker installed
      wb.addEventListener('installed', () => {
        console.log('Service Worker installed');
      });

      // Service worker activated (after skipWaiting())
      wb.addEventListener('activated', () => {
        console.log('Service Worker activated');
      });

      // Service worker controlling the page
      wb.addEventListener('controlling', () => {
        window.location.reload();
      });
    }
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    // Show the install prompt
    await installPrompt.prompt();

    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    console.log('User choice:', choiceResult.outcome);

    // Reset the deferred prompt
    setInstallPrompt(null);
    setOpenDialog(false);
  };

  const handleUpdateClick = () => {
    if ('serviceWorker' in navigator && window.workbox !== undefined) {
      window.workbox.addEventListener('controlling', () => {
        window.location.reload();
      });

      // Skip waiting to activate new service worker
      window.workbox.messageSkipWaiting();
    }
    setShowUpdateSnackbar(false);
  };

  return (
    <>
      {/* Offline status notification */}
      <Snackbar 
        open={!isOnline} 
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" sx={{ width: '100%' }}>
          You are offline. Some features may be unavailable.
        </Alert>
      </Snackbar>
      
      {/* Update available notification */}
      <Snackbar
        open={showUpdateSnackbar}
        autoHideDuration={15000}
        onClose={() => setShowUpdateSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity="info" 
          action={
            <Button 
              color="inherit" 
              size="small" 
              startIcon={<SystemUpdateIcon />}
              onClick={handleUpdateClick}
            >
              Update
            </Button>
          }
        >
          A new version is available!
        </Alert>
      </Snackbar>
      
      {/* Install prompt dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Install DojoPool</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <img src="/logo192.png" alt="DojoPool Logo" width="48" height="48" />
            <Typography>
              Install DojoPool on your device for a better experience with offline access and faster loading.
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            • Access DojoPool directly from your home screen<br />
            • Use offline mode when your connection is unstable<br />
            • Get smoother gameplay and faster load times<br />
            • Receive important notifications
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Not Now</Button>
          <Button 
            variant="contained" 
            startIcon={<InstallMobileIcon />} 
            onClick={handleInstallClick}
          >
            Install
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

// Add typings for workbox
declare global {
  interface Window {
    workbox: {
      addEventListener: (event: string, callback: () => void) => void;
      messageSkipWaiting: () => void;
    };
  }
}

export default PWAInstallPrompt;