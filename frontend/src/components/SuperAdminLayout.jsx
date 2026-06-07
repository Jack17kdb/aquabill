import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import useAuthStore from '../store/auth.store.js';
import toast from 'react-hot-toast';

const NavIcon = ({ name, className = 'w-5 h-5' }) => {
  const icons = {
    overview: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
        <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth="2"/>
        <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
        <rect x="14" y="14" width="7" height="7" rx="1" strokeWidth="2"/>
      </svg>
    ),
    accounts: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/>
        <rect x="9" y="14" width="6" height="7" rx="0.5" strokeWidth="2"/>
      </svg>
    ),
    payments: (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
      </svg>
    )
  };
  return icons[name] || null;
};

function MobileDrawer({ navItems, onLogout, user }) {
  const [open, setOpen]     = useState(false);
  const drawerRef           = useRef(null);
  const overlayRef          = useRef(null);
  const isAnimatingRef      = useRef(false);
  const isMountedRef        = useRef(true);
  const location            = useLocation();

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useLayoutEffect(() => {
    if (drawerRef.current)  gsap.set(drawerRef.current,  { yPercent: 100 });
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
      yPercent: 0,
      duration: 0.35,
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
      yPercent: 100,
      duration: 0.28,
      ease: 'power2.in',
      onComplete: () => {
        isAnimatingRef.current = false;
        if (isMountedRef.current) setOpen(false);
      },
    });
  };

  const activeItem = navItems.find(i => {
    if (i.end) return location.pathname === i.to;
    return location.pathname === i.to || location.pathname.startsWith(i.to + '/');
  });

  return (
    <>
      {/* Handle bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800">
        <button
          onClick={open ? closeDrawer : openDrawer}
          className="w-full flex items-center justify-between px-5 py-3.5 active:bg-slate-800/60 transition-colors"
        >
          <div className="flex items-center gap-3">
            {activeItem && (
              <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
                <NavIcon name={activeItem.icon} className="w-4 h-4 text-violet-400" />
              </div>
            )}
            <span className="font-display font-semibold text-white text-sm">
              {activeItem?.label || 'Menu'}
            </span>
            <span className="badge bg-violet-500/20 text-violet-400 border border-violet-500/30 text-xs px-2 py-0.5">
              SuperAdmin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-display">{open ? 'Close' : 'Menu'}</span>
            <svg
              className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"/>
            </svg>
          </div>
        </button>
      </div>

      {/* Overlay */}
      <div
        ref={overlayRef}
        className="lg:hidden fixed inset-0 bg-black/60"
        style={{ zIndex: 45, opacity: 0, pointerEvents: 'none' }}
        onClick={closeDrawer}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className="lg:hidden fixed left-0 right-0 z-50 bg-slate-900 border-t border-slate-700/80 rounded-t-2xl overflow-y-auto"
        style={{
          bottom: '56px',
          maxHeight: 'calc(75vh)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-700"/>
        </div>

        <div className="px-5 py-3 border-b border-slate-800/80">
          <p className="text-xs text-slate-500 font-mono truncate">{user?.email}</p>
          <p className="text-xs text-violet-400 font-display font-semibold mt-0.5">Super Administrator</p>
        </div>

        <nav className="px-3 py-3 flex flex-col gap-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all font-display font-medium text-sm ${
                  isActive
                    ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isActive ? 'bg-violet-500/20' : 'bg-slate-800'
                  }`}>
                    <NavIcon name={item.icon} className="w-4 h-4" />
                  </div>
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-5 pt-1 border-t border-slate-800/80 mt-1">
          <button
            onClick={() => { closeDrawer(); setTimeout(onLogout, 300); }}
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

export default function SuperAdminLayout() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out');
    navigate('/login');
  };

  const navItems = [
    { to: '/superadmin',          label: 'Overview',       icon: 'overview',  end: true  },
    { to: '/superadmin/accounts', label: 'House Accounts', icon: 'accounts',  end: false },
    { to: '/superadmin/payments', label: 'Payments',       icon: 'payments',  end: false },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900/50 border-r border-slate-800/80 p-4 gap-2 flex-shrink-0">
        <div className="flex items-center gap-3 px-2 py-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg leading-none">AquaBill</div>
            <div className="text-xs text-violet-400 font-mono font-semibold">SuperAdmin</div>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `nav-item ${isActive
                  ? 'bg-violet-500/15 text-violet-400 border border-violet-500/30'
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
            <div className="text-xs text-slate-500 font-mono truncate">{user?.email}</div>
            <div className="text-xs text-violet-400 font-display font-semibold mt-0.5">Super Administrator</div>
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

      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 page-enter">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
