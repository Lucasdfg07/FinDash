import { useEffect, useState } from 'react';

export function useServiceWorker() {
  const [isSupported, setIsSupported] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const checkSupport = () => {
      const supported = typeof window !== 'undefined' && 'serviceWorker' in navigator;
      setIsSupported(supported);

      if (supported) {
        registerServiceWorker();
      }
    };

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js', {
          scope: '/',
          updateViaCache: 'none'
        });

        setIsRegistered(true);
        console.log('Service Worker registered:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available
                console.log('New Service Worker available');
                // Show update prompt to user
                window.dispatchEvent(new CustomEvent('sw-update-available'));
              }
            });
          }
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        setIsRegistered(false);
      }
    };

    checkSupport();
  }, []);

  return { isSupported, isRegistered };
}
