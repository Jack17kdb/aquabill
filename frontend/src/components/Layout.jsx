import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import useAuthStore from '../store/auth.store.js';
import toast from 'react-hot-toast';

const NavIcon = ({ name, className = 'w-5 h-5' }) => {
  const icons = {
    dashboard: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
        <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
        <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
        <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
      </svg>
    ),
    houses: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/>
        <rect x="9" y="14" width="6" height="7" rx="0.5" strokeWidth="2"/>
      </svg>
    ),
    water: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
      </svg>
    ),
    invoices: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6M9 16h6M7 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2M7 4a2 2 0 012-2h6a2 2 0 012 2v0a2 2 0 01-2 2H9a2 2 0 01-2-2z"/>
      </svg>
    ),
    payment: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
      </svg>
    ),
    settings: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        <circle cx="12" cy="12" r="3" strokeWidth="2"/>
      </svg>
    )
  };
  return icons[name] || null;
};

// ── Mobile retractable drawer ──────────────────────────────────────
function MobileDrawer({ navItems, onNavigate, onLogout, user }) {
  const [open, setOpen]   = useState(false);
  const drawerRef         = useRef(null);
  const overlayRef        = useRef(null);
  const isAnimatingRef    = useRef(false);   // prevent animation overlap
  const isMountedRef      = useRef(true);    // guard post-unmount state updates
  const location          = useLocation();

  // ── Mark unmounted so async callbacks never fire after cleanup ──
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  // ── Set drawer's initial off-screen position BEFORE first paint ──
  // This replaces the inline style={{ transform }} that fought with GSAP.
  // The drawer is ALWAYS mounted; GSAP is the sole owner of its transform.
  useLayoutEffect(() => {
    if (drawerRef.current) {
      gsap.set(drawerRef.current, { yPercent: 100 });
    }
    if (overlayRef.current) {
      gsap.set(overlayRef.current, { opacity: 0, pointerEvents: 'none' });
    }
  }, []);

  // ── Close on route change ───────────────────────────────────────
  useEffect(() => {
    if (open) closeDrawer();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDrawer = () => {
    if (isAnimatingRef.current) return;
    if (!drawerRef.current || !overlayRef.current) return;

    isAnimatingRef.current = true;
    setOpen(true);

    // Show overlay
    gsap.set(overlayRef.current, { pointerEvents: 'auto' });
    gsap.to(overlayRef.current, {
      opacity: 1,
      duration: 0.25,
      ease: 'power2.out',
    });

    // Slide drawer up from off-screen
    gsap.to(drawerRef.current, {
      yPercent: 0,
      duration: 0.35,
      ease: 'power3.out',
      onComplete: () => { isAnimatingRef.current = false; },
    });
  };

  const closeDrawer = () => {
    if (!drawerRef.current || !overlayRef.current) {
      setOpen(false);
      return;
    }
    if (isAnimatingRef.current) return;

    isAnimatingRef.current = true;

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        if (overlayRef.current) {
          gsap.set(overlayRef.current, { pointerEvents: 'none' });
        }
      },
    });

    gsap.to(drawerRef.current, {
      yPercent: 100,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        isAnimatingRef.current = false;
        if (isMountedRef.current) setOpen(false);
      },
    });
  };

  const activeItem = navItems.find(
    i => location.pathname === i.to || location.pathname.startsWith(i.to + '/')
  );

  return (
    <>
      {/* ── Fixed handle bar ─────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
        <button
          onClick={open ? closeDrawer : openDrawer}
          className="w-full flex items-center justify-between px-5 py-3.5 active:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            {activeItem && (
              <div className="w-7 h-7 rounded-lg bg-ocean-500/20 border border-ocean-500/30 flex items-center justify-center">
                <NavIcon name={activeItem.icon} className="w-4 h-4 text-ocean-400" />
              </div>
            )}
            <span className="font-display font-semibold text-white text-sm">
              {activeItem?.label || 'Menu'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-display">
              {open ? 'Close' : 'Menu'}
            </span>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/>
            </svg>
          </div>
        </button>
      </div>

      {/* ── Overlay — always mounted, opacity controlled by GSAP ─── */}
      {/* z-index 45: above handle (40) but below drawer (50)        */}
      <div
        ref={overlayRef}
        className="lg:hidden fixed inset-0 bg-black/60"
        style={{ zIndex: 45, opacity: 0, pointerEvents: 'none' }}
        onClick={closeDrawer}
      />

      {/*
        ── Sliding drawer — always mounted, transform owned by GSAP ─
        KEY LAYOUT DECISIONS:
        • bottom: 56px  → top edge of handle bar; drawer grows upward from here
        • top: auto     → do NOT set a top value; height is determined by content
        • max-height    → caps at 75vh so it never overflows the screen
        • overflow-y-auto → scroll inside when content exceeds max-height
        • NO inline transform → GSAP owns yPercent exclusively
        • z-index 50    → above overlay (45) and handle (40)
      */}
      <div
        ref={drawerRef}
        className="lg:hidden fixed left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/80 rounded-t-2xl overflow-y-auto"
        style={{ bottom: '56px', maxHeight: 'calc(75vh)' }}
      >
        {/* Drag handle pill */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700"/>
        </div>

        {/* User info */}
        <div className="px-5 py-3 border-b border-slate-800/80">
          <p className="text-xs text-slate-500 font-mono truncate">{user?.email}</p>
          <p className="text-xs text-slate-600 mt-0.5">{user?.houseName || 'Admin'}</p>
        </div>

        {/* Nav items */}
        <nav className="px-3 py-3 flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => { onNavigate?.(); closeDrawer(); }}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-display font-medium text-sm ${
                  isActive
                    ? 'bg-ocean-500/15 text-ocean-400 border border-ocean-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-ocean-500/20' : 'bg-slate-800'
                  }`}>
                    <NavIcon name={item.icon} className="w-4 h-4" />
                  </div>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 pt-1 border-t border-slate-800/80 mt-1">
          <button
            onClick={() => { closeDrawer(); onLogout(); }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-red-400 hover:bg-red-900/20 transition-all font-display font-medium text-sm"
          >
            <div className="w-8 h-8 rounded-lg bg-red-900/30 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
              </svg>
            </div>
            Logout
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main layout ────────────────────────────────────────────────────
export default function Layout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard',   label: 'Dashboard',   icon: 'dashboard' },
    { to: '/houses',      label: 'Houses',       icon: 'houses'    },
    { to: '/water-input', label: 'Water Input',  icon: 'water'     },
    { to: '/invoices',    label: 'Invoices',     icon: 'invoices'  },
    { to: '/payment',     label: 'Pay',          icon: 'payment'   },
    { to: '/settings',    label: 'Settings',     icon: 'settings'  },
  ];

  return (
    <div className="flex h-screen overflow-hidden">

      {/* ── Desktop sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/50 border-r border-slate-800/80 p-4 gap-2 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-ocean-500/20 border border-ocean-500/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-none">AquaBill</div>
            <div className="text-xs text-slate-500 font-mono">v1.0</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item ${isActive
                  ? 'bg-ocean-500/15 text-ocean-400 border border-ocean-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <NavIcon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User info */}
        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-slate-500 font-mono truncate">{user?.email}</div>
          </div>
          <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      {/* ── Mobile drawer ───────────────────────────────────────── */}
      <MobileDrawer
        navItems={navItems}
        onLogout={handleLogout}
        user={user}
      />

      {/* ── Main content ────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
