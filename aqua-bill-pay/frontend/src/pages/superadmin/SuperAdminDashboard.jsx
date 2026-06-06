import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../../utils/api.js';
import toast from 'react-hot-toast';

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const cardsRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/superadmin/stats')
      .then(r => { setStats(r.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load stats'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!loading && cardsRef.current) {
      gsap.fromTo(cardsRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [loading]);

  const cards = [
    {
      label: 'Total Accounts',
      value: stats?.totalAccounts ?? '—',
      sub: 'All house accounts',
      color: 'bg-violet-500/15 border border-violet-500/30',
      iconColor: 'text-violet-400',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/>
    },
    {
      label: 'Active',
      value: stats?.activeAccounts ?? '—',
      sub: 'Paying accounts',
      color: 'bg-emerald-500/15 border border-emerald-500/30',
      iconColor: 'text-emerald-400',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    },
    {
      label: 'Suspended',
      value: stats?.suspendedAccounts ?? '—',
      sub: 'Awaiting payment',
      color: 'bg-red-500/15 border border-red-500/30',
      iconColor: 'text-red-400',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
    },
    {
      label: 'Total Rooms',
      value: stats?.totalRooms ?? '—',
      sub: `${stats?.occupiedRooms ?? 0} occupied`,
      color: 'bg-ocean-500/15 border border-ocean-500/30',
      iconColor: 'text-ocean-400',
      icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></>
    },
    {
      label: 'Monthly Revenue',
      value: stats ? `KES ${stats.totalMonthlyRevenue.toLocaleString()}` : '—',
      sub: 'From active accounts',
      color: 'bg-amber-500/15 border border-amber-500/30',
      iconColor: 'text-amber-400',
      icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Overview</h1>
        </div>
        <p className="text-slate-500 text-sm">Platform-wide summary</p>
      </div>

      <div ref={cardsRef} className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {cards.map((c, i) => (
          <div key={i} className={`stat-card ${c.color}`}>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 bg-transparent`}>
              <svg className={`w-5 h-5 ${c.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {c.icon}
              </svg>
            </div>
            <div className="font-display font-bold text-2xl text-white">{loading ? '—' : c.value}</div>
            <div className="font-display font-medium text-slate-200 text-sm">{c.label}</div>
            {c.sub && <div className="text-xs text-slate-500 font-mono mt-0.5">{c.sub}</div>}
          </div>
        ))}
      </div>

      {/* Quick action */}
      <button
        onClick={() => navigate('/superadmin/accounts')}
        className="card p-5 w-full flex items-center gap-4 hover:border-violet-500/40 hover:bg-slate-800/80 transition-all duration-200 text-left group"
      >
        <div className="w-12 h-12 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
          <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/>
          </svg>
        </div>
        <div>
          <div className="font-display font-semibold text-white">Manage House Accounts</div>
          <div className="text-sm text-slate-500 mt-0.5">Add, edit, suspend or delete accounts — send payment reminders</div>
        </div>
        <svg className="w-5 h-5 text-slate-600 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>
    </div>
  );
}
