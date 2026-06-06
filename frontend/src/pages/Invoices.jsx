import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

const StatusBadge = ({ status, reminderCount }) => {
  const map = {
    sent:    'bg-emerald-900/40 text-emerald-400 border-emerald-800/40',
    pending: 'bg-amber-900/40  text-amber-400  border-amber-800/40',
    failed:  'bg-red-900/40    text-red-400    border-red-800/40'
  };
  const labels = { sent: '✓ Sent', pending: '⏳ Pending', failed: '✗ Failed' };
  return (
    <span className={`badge text-xs border ${map[status] || map.pending}`}>
      {labels[status] || 'Pending'}
      {status === 'sent' && reminderCount > 0 && (
        <span className="ml-1 opacity-70">· {reminderCount}/3 reminders</span>
      )}
    </span>
  );
};

export default function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // track which button is busy
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchInvoices = (pg = 1) => {
    setLoading(true);
    api.get(`/invoice?page=${pg}&limit=20`)
      .then(r => {
        setInvoices(r.data.invoices);
        setTotalPages(r.data.pages);
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load invoices'); setLoading(false); });
  };

  useEffect(() => { fetchInvoices(page); }, [page]);

  const failedCount  = invoices.filter(i => i.whatsappStatus === 'failed').length;
  const pendingCount = invoices.filter(i => i.whatsappStatus === 'pending').length;
  const sentCount    = invoices.filter(i => i.whatsappStatus === 'sent').length;

  const handleSendReminders = async () => {
    setActionLoading('reminders');
    try {
      const res = await api.post('/whatsapp/send-reminders');
      toast.success(res.data.message);
      fetchInvoices(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to queue reminders');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRetryFailed = async () => {
    setActionLoading('retry');
    try {
      const res = await api.post('/invoice/retry-failed');
      toast.success(res.data.message);
      fetchInvoices(page);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Retry failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Invoices</h1>
          <p className="text-slate-500 text-sm mt-1">Water bills history</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {failedCount > 0 && (
            <button
              onClick={handleRetryFailed}
              disabled={actionLoading === 'retry'}
              className="flex items-center gap-2 bg-red-900/40 hover:bg-red-800/50 text-red-400 font-display font-medium px-4 py-2.5 rounded-xl border border-red-800/40 transition-all text-sm disabled:opacity-50"
            >
              {actionLoading === 'retry'
                ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              }
              Retry {failedCount} Failed
            </button>
          )}

          <button
            onClick={handleSendReminders}
            disabled={actionLoading === 'reminders' || sentCount === 0}
            title={sentCount === 0 ? 'No sent invoices to remind about' : 'Send manual reminders'}
            className="flex items-center gap-2 btn-secondary text-sm py-2.5 disabled:opacity-40"
          >
            {actionLoading === 'reminders'
              ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            }
            Send Reminders
          </button>
        </div>
      </div>

      {/* Summary pills */}
      {!loading && invoices.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-5">
          <span className="badge bg-emerald-900/30 text-emerald-400 border border-emerald-800/30 text-xs px-3 py-1.5">
            ✓ {sentCount} sent
          </span>
          {pendingCount > 0 && (
            <span className="badge bg-amber-900/30 text-amber-400 border border-amber-800/30 text-xs px-3 py-1.5">
              ⏳ {pendingCount} pending
            </span>
          )}
          {failedCount > 0 && (
            <span className="badge bg-red-900/30 text-red-400 border border-red-800/30 text-xs px-3 py-1.5">
              ✗ {failedCount} failed
            </span>
          )}
        </div>
      )}

      {/* Note about manual-only reminders */}
      <div className="mb-5 flex items-start gap-2 px-3 py-2.5 bg-slate-800/40 rounded-xl border border-slate-700/50">
        <svg className="w-4 h-4 text-ocean-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <p className="text-xs text-slate-400">
          Reminders are <span className="text-white font-medium">manual only</span> — the system never auto-sends to tenants. Use "Send Reminders" above when you want to follow up. Maximum 3 per invoice.
        </p>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-ocean-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : invoices.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📄</div>
          <p className="font-display font-medium text-slate-400">No invoices yet</p>
          <p className="text-slate-600 text-sm mt-1">Submit water readings to generate bills</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {invoices.map(inv => (
              <div
                key={inv._id}
                className={`card p-4 transition-all ${inv.whatsappStatus === 'failed' ? 'border-red-900/40' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* House badge */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-display font-bold ${
                    inv.whatsappStatus === 'sent'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : inv.whatsappStatus === 'failed'
                      ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                      : 'bg-slate-800 text-slate-500 border border-slate-700'
                  }`}>
                    {inv.houseNumber}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <span className="font-display font-semibold text-white">{inv.tenantName}</span>
                      <span className="font-display font-bold text-ocean-400 text-lg">
                        KES {inv.waterCost.toLocaleString()}
                      </span>
                    </div>

                    {/* Reading detail */}
                    <div className="flex items-center gap-1.5 mt-1 font-mono text-xs text-slate-500">
                      <span>{inv.previousReading}</span>
                      <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                      </svg>
                      <span className="text-slate-300">{inv.currentReading}</span>
                      <span className="text-slate-600 ml-1">({inv.unitsUsed} units × KES {inv.pricePerUnit})</span>
                    </div>

                    {/* Status row */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <StatusBadge status={inv.whatsappStatus} reminderCount={inv.reminderCount} />
                      {inv.retryCount > 0 && inv.whatsappStatus === 'failed' && (
                        <span className="badge bg-slate-800/60 text-slate-500 border border-slate-700 text-xs">
                          {inv.retryCount} attempt{inv.retryCount > 1 ? 's' : ''}
                        </span>
                      )}
                      <span className="text-xs text-slate-600 font-mono ml-auto">
                        {new Date(inv.createdAt).toLocaleDateString('en-KE', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-slate-500 text-sm font-mono">{page} / {totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-secondary px-3 py-2 text-sm disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
