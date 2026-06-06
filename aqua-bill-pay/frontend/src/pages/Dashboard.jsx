import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import api from '../utils/api.js';
import PayModal from '../components/PayModal.jsx';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="stat-card animate-fade-up">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
      {icon}
    </div>
    <div className="font-display font-bold text-2xl text-white">{value}</div>
    <div className="font-display font-medium text-slate-200 text-sm">{label}</div>
    {sub && <div className="text-xs text-slate-500 font-mono mt-0.5">{sub}</div>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPay, setShowPay] = useState(false);
  const navigate = useNavigate();
  const cardsRef = useRef(null);

  useEffect(() => {
    api.get('/property/stats')
      .then(res => {
        setStats(res.data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error('Failed to load stats');
      });
  }, []);

  useEffect(() => {
    if (!loading && cardsRef.current) {
      gsap.fromTo(cardsRef.current.children,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' }
      );
    }
  }, [loading]);

  const now = new Date();
  const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-white">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{monthName} overview</p>
      </div>

      {/* Stats */}
      <div ref={cardsRef} className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Houses"
          value={loading ? '—' : stats?.total ?? 0}
          color="bg-ocean-500/15 border border-ocean-500/30"
          icon={<svg className="w-5 h-5 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/></svg>}
        />
        <StatCard
          label="Occupied"
          value={loading ? '—' : stats?.occupied ?? 0}
          color="bg-emerald-500/15 border border-emerald-500/30"
          icon={<svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>}
        />
        <StatCard
          label="Vacant"
          value={loading ? '—' : stats?.vacant ?? 0}
          color="bg-amber-500/15 border border-amber-500/30"
          icon={<svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/><line x1="12" y1="14" x2="12" y2="18" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="20" r="0.5" fill="currentColor"/></svg>}
        />
        <StatCard
          label="Water Billed"
          value={loading ? '—' : `KES ${(stats?.totalWaterBilled ?? 0).toLocaleString()}`}
          sub="This month (water only)"
          color="bg-blue-500/15 border border-blue-500/30"
          icon={<svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/></svg>}
        />
      </div>

      {/* Quick actions */}
      <div className="mb-6">
        <h2 className="font-display font-semibold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/water-input')}
            className="card p-5 flex items-center gap-4 hover:border-ocean-500/40 hover:bg-slate-800/80 transition-all duration-200 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-ocean-500/15 border border-ocean-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
              </svg>
            </div>
            <div>
              <div className="font-display font-semibold text-white">Enter Water Readings</div>
              <div className="text-sm text-slate-500 mt-0.5">Input meter readings & send bills</div>
            </div>
          </button>

          <button
            onClick={() => navigate('/houses')}
            className="card p-5 flex items-center gap-4 hover:border-ocean-500/40 hover:bg-slate-800/80 transition-all duration-200 text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/>
                <rect x="9" y="14" width="6" height="7" rx="0.5" strokeWidth="2"/>
              </svg>
            </div>
            <div>
              <div className="font-display font-semibold text-white">Manage Houses</div>
              <div className="text-sm text-slate-500 mt-0.5">Add tenants, update details</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
