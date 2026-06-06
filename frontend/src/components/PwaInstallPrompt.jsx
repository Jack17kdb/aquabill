import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function PwaInstallPrompt() {
  const [prompt, setPrompt]   = useState(null);  // deferred install event
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    // Don't show if user already dismissed or if already installed (standalone)
    const alreadyDismissed = localStorage.getItem('pwa_install_dismissed');
    if (alreadyDismissed) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault(); // stop browser's default mini-bar
      setPrompt(e);
      setVisible(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    if (visible && modalRef.current) {
      gsap.fromTo(modalRef.current,
        { y: 80, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.5)' }
      );
    }
  }, [visible]);

  const dismiss = () => {
    gsap.to(modalRef.current, {
      y: 60, opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => {
        setVisible(false);
        setDismissed(true);
        localStorage.setItem('pwa_install_dismissed', '1');
      }
    });
  };

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      gsap.to(modalRef.current, {
        scale: 0.95, opacity: 0, duration: 0.25,
        onComplete: () => setVisible(false)
      });
    } else {
      dismiss();
    }
  };

  if (!visible || dismissed) return null;

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-4 right-4 z-50 flex justify-center pointer-events-none">
      <div
        ref={modalRef}
        className="card w-full max-w-sm p-5 pointer-events-auto shadow-2xl shadow-black/50 border-ocean-500/20"
        style={{ backdropFilter: 'blur(16px)' }}
      >
        <div className="flex items-start gap-4">
          {/* App icon */}
          <div className="w-14 h-14 rounded-2xl bg-ocean-500/20 border border-ocean-500/40 flex items-center justify-center flex-shrink-0">
            <svg className="w-8 h-8 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display font-bold text-white text-base leading-tight">
                  Install AquaBill
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Add to home screen for quick access — works offline too
                </p>
              </div>
              <button
                onClick={dismiss}
                className="text-slate-500 hover:text-slate-300 p-0.5 flex-shrink-0 mt-0.5"
                aria-label="Dismiss"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={install}
                className="flex-1 bg-ocean-500 hover:bg-ocean-400 text-white font-display font-semibold text-sm px-4 py-2 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Install
              </button>
              <button
                onClick={dismiss}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 font-display text-sm transition-all border border-slate-700 hover:bg-slate-800"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
