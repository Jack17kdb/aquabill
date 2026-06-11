import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function PwaInstallPrompt() {
  const [prompt, setPrompt]     = useState(null);
  const [visible, setVisible]   = useState(false);
  const [expanded, setExpanded] = useState(false);
  const drawerRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (localStorage.getItem('pwa_install_dismissed')) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      setVisible(true);
      // Slide in the collapsed tab after a short delay
      setTimeout(() => {
        gsap.fromTo(drawerRef.current,
          { y: 80, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.4)' }
        );
      }, 1500);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const expand = () => {
    setExpanded(true);
    gsap.fromTo(contentRef.current,
      { height: 0, opacity: 0 },
      { height: 'auto', opacity: 1, duration: 0.35, ease: 'power3.out' }
    );
  };

  const collapse = () => {
    gsap.to(contentRef.current, {
      height: 0, opacity: 0, duration: 0.25, ease: 'power2.in',
      onComplete: () => setExpanded(false)
    });
  };

  const dismiss = () => {
    gsap.to(drawerRef.current, {
      y: 100, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => {
        setVisible(false);
        localStorage.setItem('pwa_install_dismissed', '1');
      }
    });
  };

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      gsap.to(drawerRef.current, {
        y: 80, opacity: 0, duration: 0.3,
        onComplete: () => setVisible(false)
      });
    } else {
      collapse();
    }
  };

  if (!visible) return null;

  return (
    <div
      ref={drawerRef}
      className="fixed bottom-20 lg:bottom-4 right-4 z-50 w-64"
      style={{ opacity: 0 }} // GSAP animates this in
    >
      {/* ── Collapsed tab (always visible) ── */}
      <div
        onClick={expanded ? collapse : expand}
        className="flex items-center gap-2.5 bg-slate-900 border border-ocean-500/40 rounded-2xl px-4 py-3 cursor-pointer hover:bg-slate-800 transition-colors shadow-lg shadow-black/40 select-none"
      >
        <div className="w-7 h-7 rounded-lg bg-ocean-500/20 border border-ocean-500/40 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
          </svg>
        </div>
        <span className="font-display font-semibold text-white text-sm flex-1">Install AquaBill</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/>
        </svg>
      </div>

      {/* ── Expanded drawer content ── */}
      <div
        ref={contentRef}
        className="overflow-hidden"
        style={{ height: 0, opacity: 0 }}
      >
        <div className="bg-slate-900 border border-t-0 border-ocean-500/40 rounded-b-2xl px-4 pb-4 pt-3 shadow-lg shadow-black/40">
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Add to your home screen for instant access — works offline too, perfect for taking meter readings.
          </p>
          <div className="flex gap-2">
            <button
              onClick={install}
              className="flex-1 bg-ocean-500 hover:bg-ocean-400 text-white font-display font-semibold text-sm px-3 py-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
              </svg>
              Install
            </button>
            <button
              onClick={dismiss}
              className="px-3 py-2.5 rounded-xl text-slate-400 hover:text-slate-200 font-display text-sm transition-all border border-slate-700 hover:bg-slate-800"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
