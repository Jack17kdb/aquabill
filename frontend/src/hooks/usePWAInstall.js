import { useState, useEffect } from 'react';

export const usePWAInstall = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled]     = useState(false);
  const [showModal, setShowModal]         = useState(false);

  useEffect(() => {
    // Already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // iOS doesn't fire beforeinstallprompt — detect Safari manually
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    const isInStandaloneMode = window.navigator.standalone;

    if (isIOS && !isInStandaloneMode) {
      // Show iOS instructions after a delay
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowModal('ios'), 3000);
      }
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      // Show our custom modal after 3 seconds on first visit
      const dismissed = localStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setTimeout(() => setShowModal('android'), 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowModal(false);
      setInstallPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!installPrompt) return false;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowModal(false);
    }
    setInstallPrompt(null);
    return outcome === 'accepted';
  };

  const dismiss = (permanent = false) => {
    setShowModal(false);
    if (permanent) {
      localStorage.setItem('pwa_install_dismissed', '1');
    }
  };

  return { installPrompt, isInstalled, showModal, install, dismiss };
};
