import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function PWAInstallModal({ type, onInstall, onDismiss }) {
  const modalRef = useRef(null);
  const iconRef  = useRef(null);

  useEffect(() => {
    gsap.fromTo(modalRef.current,
      { y: 100, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: 'back.out(1.4)' }
    );
    gsap.fromTo(iconRef.current,
      { scale: 0.5, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, delay: 0.2, ease: 'back.out(1.7)' }
    );
  }, []);

  const handleDismiss = (permanent) => {
    gsap.to(modalRef.current, {
      y: 100, opacity: 0, duration: 0.3, ease: 'power2.in',
      onComplete: () => onDismiss(permanent)
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none">
      {/* Backdrop — only on larger screens */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto hidden sm:block"
           onClick={() => handleDismiss(false)} />

      <div
        ref={modalRef}
        className="relative w-full max-w-sm mx-4 mb-6 sm:mb-8 pointer-events-auto"
      >
        <div className="card p-6 border-ocean-500/20 shadow-2xl shadow-black/50">

          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div ref={iconRef} className="w-16 h-16 rounded-2xl bg-ocean-500/20 border border-ocean-500/40 flex items-center justify-center">
              <svg className="w-9 h-9 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
              </svg>
            </div>
          </div>

          {type === 'ios' ? (
            /* iOS instructions */
            <>
              <h3 className="font-display font-bold text-white text-center text-lg mb-1">
                Install AquaBill
              </h3>
              <p className="text-slate-400 text-sm text-center mb-5">
                Add to your Home Screen for the best experience — works offline too.
              </p>
              <div className="space-y-3 mb-5">
                {[
                  { step: '1', text: 'Tap the Share button', icon: '□↑' },
                  { step: '2', text: 'Scroll down and tap "Add to Home Screen"', icon: '+□' },
                  { step: '3', text: 'Tap "Add" to confirm', icon: '✓' }
                ].map(s => (
                  <div key={s.step} className="flex items-center gap-3 px-3 py-2.5 bg-slate-800/60 rounded-xl border border-slate-700/50">
                    <div className="w-7 h-7 rounded-lg bg-ocean-500/20 border border-ocean-500/30 flex items-center justify-center flex-shrink-0">
                      <span className="text-ocean-400 font-display font-bold text-xs">{s.step}</span>
                    </div>
                    <span className="text-sm text-slate-300">{s.text}</span>
                    <span className="ml-auto text-slate-500 text-xs font-mono">{s.icon}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            /* Android / Chrome prompt */
            <>
              <h3 className="font-display font-bold text-white text-center text-lg mb-1">
                Install AquaBill
              </h3>
              <p className="text-slate-400 text-sm text-center mb-2">
                Install the app on your phone for faster access and offline meter entry.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mb-5">
                {['Works offline', 'No app store', 'Instant access'].map(f => (
                  <span key={f} className="badge bg-ocean-500/10 text-ocean-400 border border-ocean-500/20 text-xs px-2.5 py-1">
                    ✓ {f}
                  </span>
                ))}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2">
            {type !== 'ios' && (
              <button
                onClick={() => { onInstall(); }}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                </svg>
                Install App
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => handleDismiss(false)}
                className="btn-secondary flex-1 text-sm py-2.5"
              >
                Not now
              </button>
              <button
                onClick={() => handleDismiss(true)}
                className="flex-1 text-slate-500 hover:text-slate-400 text-sm font-display transition-colors py-2.5"
              >
                Don't ask again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
