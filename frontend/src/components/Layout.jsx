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

function MobileDrawer({ navItems, onNavigate, onLogout, user }) {
  const [open, setOpen]        = useState(false);
  const drawerRef              = useRef(null);
  const overlayRef             = useRef(null);
  const isAnimatingRef         = useRef(false);
  const isMountedRef           = useRef(true);
  const location               = useLocation();

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useLayoutEffect(() => {
    if (drawerRef.current)  gsap.set(drawerRef.current,  { xPercent: -100 });
    if (overlayRef.current) gsap.set(overlayRef.current, { opacity: 0, pointerEvents: 'none' });
  }, []);

  useEffect(() => {
    if (open) closeDrawer();
  }, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const openDrawer = () => {
    if (open || isAnimatingRef.current) return;
    if (!drawerRef.current || !overlayRef.current) return;

    isAnimatingRef.current = true;
    setOpen(true);

    gsap.killTweensOf([drawerRef.current, overlayRef.current]);

    gsap.set(overlayRef.current, { pointerEvents: 'auto' });
    gsap.to(overlayRef.current, { opacity: 1, duration: 0.25, ease: 'power2.out' });
    gsap.to(drawerRef.current, {
      xPercent: 0,
      duration: 0.3,
      ease: 'power3.out',
      onComplete: () => { isAnimatingRef.current = false; },
    });
  };

  const closeDrawer = () => {
    if (!open || isAnimatingRef.current) return;
    if (!drawerRef.current || !overlayRef.current) {
      setOpen(false);
      return;
    }

    isAnimatingRef.current = true;

    gsap.killTweensOf([drawerRef.current, overlayRef.current]);

    gsap.to(overlayRef.current, {
      opacity: 0,
      duration: 0.2,
      onComplete: () => {
        if (overlayRef.current) gsap.set(overlayRef.current, { pointerEvents: 'none' });
      },
    });
    gsap.to(drawerRef.current, {
      xPercent: -100,
      duration: 0.25,
      ease: 'power2.in',
      onComplete: () => {
        isAnimatingRef.current = false;
        if (isMountedRef.current) setOpen(false);
      },
    });
  };

  const activeItem = navItems.find(i => {
    if (location.pathname === i.to) return true;
    if (i.to !== '/' && location.pathname.startsWith(i.to + '/')) return true;
    return false;
  });

  return (
    <>
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-40 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-ocean-500/20 border border-ocean-500/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white text-base">
            {activeItem?.label || 'AquaBill'}
          </span>
        </div>

        <button
          onClick={openDrawer}
          className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50 active:bg-slate-800"
          aria-label="Open menu"
        >
          <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div
        ref={overlayRef}
        className="lg:hidden fixed inset-0 bg-black/60 z-45"
        style={{ opacity: 0, pointerEvents: 'none' }}
        onClick={closeDrawer}
      />

      <div
        ref={drawerRef}
        className="lg:hidden fixed inset-y-0 left-0 w-72 max-w-[80vw] z-50 bg-slate-900 border-r border-slate-700/80 overflow-y-auto flex flex-col justify-between"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div>
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800/80">
            <div className="w-8 h-8 rounded-lg bg-ocean-500/20 border border-ocean-500/30 flex items-center justify-center">
              <svg className="w-4 h-4 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
              </svg>
            </div>
            <div>
              {/* DEFENSIVE PROTECTION: Ensured values are strictly rendered as primitive values */}
              <p className="text-xs text-slate-500 font-mono truncate">
                {typeof user?.email === 'string' ? user.email : ''}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {typeof user?.houseName === 'string' ? user.houseName : 'Admin'}
              </p>
            </div>
          </div>

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
        </div>

        <div className="px-3 pb-5 pt-3 border-t border-slate-800/80 mt-auto">
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

export default function Layout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const isCaretaker = user?.role === 'caretaker';

  const navItems = [
    !isCaretaker && { to: '/dashboard',   label: 'Dashboard',  icon: 'dashboard' },
    { to: '/houses',      label: 'Houses',      icon: 'houses'    },
    { to: '/water-input', label: 'Water Input', icon: 'water'     },
    !isCaretaker && { to: '/invoices',    label: 'Invoices',   icon: 'invoices'  },
    !isCaretaker && { to: '/payment',     label: 'Pay',        icon: 'payment'   },
    !isCaretaker && { to: '/settings',    label: 'Settings',   icon: 'settings'  },
  ].filter(Boolean);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/50 border-r border-slate-800/80 p-4 gap-2 flex-shrink-0">
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

        <div className="mt-auto pt-4 border-t border-slate-800">
          <div className="px-3 py-2 mb-2">
            <div className="text-xs text-slate-500 font-mono truncate">
              {typeof user?.email === 'string' ? user.email : ''}
            </div>
            {isCaretaker && (
              <div className="text-xs text-amber-400 font-display font-medium mt-0.5">
                Caretaker Account
              </div>
            )}
          </div>
          <button onClick={handleLogout} className="nav-item w-full text-red-400 hover:text-red-300 hover:bg-red-900/20">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            Logout
          </button>
        </div>
      </aside>

      <MobileDrawer navItems={navItems} onLogout={handleLogout} user={user} />

      <main className="flex-1 overflow-y-auto pt-16 lg:pt-0">
        <div className="max-w-5xl mx-auto px-4 py-6 page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
