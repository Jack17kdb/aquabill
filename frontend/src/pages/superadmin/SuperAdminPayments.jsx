import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

const statusConfig = {
  completed: { label: 'Paid',     color: 'text-emerald-400', bg: 'bg-emerald-900/40 border-emerald-800/40' },
  partial:   { label: 'Partial',  color: 'text-blue-400',   bg: 'bg-blue-900/40    border-blue-800/40'    },
  pending:   { label: 'Unpaid',   color: 'text-amber-400',  bg: 'bg-amber-900/40   border-amber-800/40'   },
  failed:    { label: 'Failed',   color: 'text-red-400',    bg: 'bg-red-900/40     border-red-800/40'     },
  none:      { label: 'No record',color: 'text-slate-500',  bg: 'bg-slate-800/60   border-slate-700'      }
};

export default function SuperAdminPayments() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [remindingId, setRemindingId] = useState(null);
  const listRef = useRef(null);

  const fetchData = () => {
    setLoading(true);
    api.get('/superadmin/payments')
      .then(r => { setData(r.data); setLoading(false); })
      .catch(() => { toast.error('Failed to load payment data'); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!loading && listRef.current) {
      gsap.fromTo(listRef.current.children,
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.3, stagger: 0.05, ease: 'power2.out' }
      );
    }
  }, [loading]);

  const handleRemind = async (accountId) => {
    setRemindingId(accountId);
    try {
      const res = await api.post(`/superadmin/accounts/${accountId}/remind`);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reminder');
    } finally {
      setRemindingId(null);
    }
  };

  const getStatusKey = (payment) => {
    if (!payment) return 'none';
    return payment.status;
  };

  const filtered = data?.overview?.filter(a => {
    if (filter === 'all')      return true;
    if (filter === 'paid')     return a.payment?.status === 'completed';
    if (filter === 'partial')  return a.payment?.status === 'partial';
    if (filter === 'overdue')  return !a.payment || ['pending', 'failed', null].includes(a.payment?.status);
    return true;
  }) || [];

  const now = new Date();
  const monthName = now.toLocaleString('en-KE', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Payments</h1>
        </div>
        <p className="text-slate-500 text-sm">{monthName} subscription status</p>
      </div>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: 'Renewed',  value: data.summary.renewed,  color: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400' },
            { label: 'Partial',  value: data.summary.partial,  color: 'bg-blue-500/15    border-blue-500/30',    text: 'text-blue-400'    },
            { label: 'Overdue',  value: data.summary.overdue,  color: 'bg-red-500/15     border-red-500/30',     text: 'text-red-400'     }
          ].map(s => (
            <div key={s.label} className={`card p-4 border ${s.color} text-center`}>
              <div className={`font-display font-bold text-2xl ${s.text}`}>{s.value}</div>
              <div className="text-xs text-slate-400 font-display mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { key: 'all',     label: 'All' },
          { key: 'paid',    label: 'Paid' },
          { key: 'partial', label: 'Partial' },
          { key: 'overdue', label: 'Overdue' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-xl font-display font-medium text-sm transition-all border ${
              filter === f.key
                ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">💳</div>
          <p className="font-display font-medium text-slate-400">No accounts in this filter</p>
        </div>
      ) : (
        <div ref={listRef} className="flex flex-col gap-3">
          {filtered.map(account => {
            const statusKey = getStatusKey(account.payment);
            const sc = statusConfig[statusKey];
            const amountPaid     = account.payment?.amountPaid     || 0;
            const amountExpected = account.payment?.amountExpected || account.amountExpected;
            const remaining      = amountExpected - amountPaid;

            return (
              <div key={account._id} className="card p-4">
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${sc.bg} border`}>
                    <svg className={`w-5 h-5 ${sc.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/>
                    </svg>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + status */}
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-display font-semibold text-white">
                        {account.houseName}
                      </span>
                      <span className={`badge text-xs border ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                      {!account.isActive && (
                        <span className="badge text-xs bg-red-900/40 text-red-400 border border-red-800/40">
                          Suspended
                        </span>
                      )}
                    </div>

                    {/* Caretaker */}
                    {account.caretakerName && (
                      <p className="text-xs text-slate-500 mb-2">
                        {account.caretakerName}
                        {account.caretakerPhone && <span className="font-mono ml-2">{account.caretakerPhone}</span>}
                      </p>
                    )}

                    {/* Payment breakdown */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="font-display font-bold text-white text-sm">{account.occupiedRooms}</div>
                        <div className="text-xs text-slate-500">Rooms</div>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-2 text-center">
                        <div className="font-display font-bold text-white text-sm">
                          KES {amountExpected?.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">Expected</div>
                      </div>
                      <div className={`rounded-lg p-2 text-center ${amountPaid > 0 ? 'bg-emerald-900/20' : 'bg-slate-800/50'}`}>
                        <div className={`font-display font-bold text-sm ${amountPaid > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                          KES {amountPaid?.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">Paid</div>
                      </div>
                    </div>

                    {/* Receipt / remaining */}
                    {account.payment?.mpesaReceiptNumber && (
                      <div className="text-xs text-slate-500 font-mono mb-2">
                        Receipt: <span className="text-emerald-400">{account.payment.mpesaReceiptNumber}</span>
                        {account.payment.paidAt && (
                          <span className="ml-2 text-slate-600">
                            {new Date(account.payment.paidAt).toLocaleDateString('en-KE')}
                          </span>
                        )}
                      </div>
                    )}
                    {statusKey === 'partial' && remaining > 0 && (
                      <div className="text-xs text-blue-400 font-display mb-2">
                        Balance remaining: KES {remaining.toLocaleString()}
                      </div>
                    )}

                    {/* Actions */}
                    {statusKey !== 'completed' && account.caretakerPhone && (
                      <button
                        onClick={() => handleRemind(account._id)}
                        disabled={remindingId === account._id}
                        className="flex items-center gap-1.5 text-xs bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 font-display font-medium px-3 py-1.5 rounded-lg border border-emerald-800/40 transition-all disabled:opacity-50"
                      >
                        {remindingId === account._id
                          ? <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                          : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
                        }
                        Send reminder
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
