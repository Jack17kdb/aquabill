import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

const statusConfig = {
  pending:   { label: 'Unpaid',   color: 'text-amber-400',   bg: 'bg-amber-900/30  border-amber-800/40'  },
  completed: { label: 'Paid',     color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800/40' },
  partial:   { label: 'Partial',  color: 'text-blue-400',    bg: 'bg-blue-900/30   border-blue-800/40'   },
  failed:    { label: 'Failed',   color: 'text-red-400',     bg: 'bg-red-900/30    border-red-800/40'    }
};

export default function Payment() {
  const [details, setDetails]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [phone, setPhone]         = useState('');
  const [amount, setAmount]       = useState('');
  const [pushing, setPushing]     = useState(false);
  const [polling, setPolling]     = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [payStatus, setPayStatus] = useState(null);
  const pollRef   = useRef(null);
  const pageRef   = useRef(null);
  const formRef   = useRef(null);

  useEffect(() => {
    gsap.fromTo(pageRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
    );

    api.get('/payment/details')
      .then(r => {
        setDetails(r.data);
        setPhone(r.data.caretakerPhone || '');
        setAmount(String(r.data.amountExpected || ''));
        if (r.data.existingPayment) setPayStatus(r.data.existingPayment);
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load payment details'); setLoading(false); });

    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startPolling = (id) => {
    setPolling(true);
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const r = await api.get(`/payment/status/${id}`);
        setPayStatus(r.data);

        if (r.data.status === 'completed') {
          clearInterval(pollRef.current);
          setPolling(false);
          toast.success('✅ Payment confirmed! Thank you.');
          gsap.fromTo(formRef.current, { scale: 1 }, { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1 });
          // Refresh details to update balance
          api.get('/payment/details').then(r2 => setDetails(r2.data));
        } else if (r.data.status === 'failed') {
          clearInterval(pollRef.current);
          setPolling(false);
          toast.error('Payment was cancelled or failed. Try again.');
        } else if (attempts >= 24) {
          clearInterval(pollRef.current);
          setPolling(false);
          toast('No response yet — check your M-Pesa messages.', { icon: '⚠️' });
        }
      } catch { /* continue polling silently */ }
    }, 5000);
  };

  const handleStkPush = async () => {
    if (!phone.trim()) { toast.error('Enter a phone number'); return; }
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }

    setPushing(true);
    try {
      const r = await api.post('/payment/stk-push', {
        phoneNumber: phone.trim(),
        amount: Number(amount)
      });
      setPaymentId(r.data.paymentId);
      toast.success(r.data.message, { duration: 6000 });
      startPolling(r.data.paymentId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'STK push failed');
      gsap.fromTo(formRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
    } finally {
      setPushing(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="w-8 h-8 animate-spin text-ocean-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  const sc          = statusConfig[payStatus?.status || 'pending'];
  const amountPaid  = payStatus?.amountPaid || 0;
  const expected    = details?.amountExpected || 0;
  const remaining   = Math.max(0, expected - amountPaid);
  const isFullyPaid = payStatus?.status === 'completed';
  const pct         = expected > 0 ? Math.min(100, Math.round((amountPaid / expected) * 100)) : 0;

  return (
    <div ref={pageRef}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Subscription Payment</h1>
        <p className="text-slate-500 text-sm mt-1">
          {details?.billingPeriod
            ? `Billing period: ${details.billingPeriod}`
            : 'Current month'}
        </p>
      </div>

      <div className="flex flex-col gap-5 max-w-lg">

        {/* ── Billing summary card ── */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-white">Amount Due</h2>
            <span className={`badge text-xs border ${sc.bg} ${sc.color}`}>{sc.label}</span>
          </div>

          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs font-mono mb-1.5">
              <span className="text-slate-400">Paid: <span className="text-emerald-400">KES {amountPaid.toLocaleString()}</span></span>
              <span className="text-slate-400">Total: <span className="text-white">KES {expected.toLocaleString()}</span></span>
            </div>
            <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isFullyPaid ? 'bg-emerald-500' : pct > 0 ? 'bg-ocean-500' : 'bg-slate-700'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs mt-1.5">
              <span className="text-slate-500">{pct}% paid</span>
              {remaining > 0 && (
                <span className="text-amber-400 font-display font-medium">
                  KES {remaining.toLocaleString()} remaining
                </span>
              )}
            </div>
          </div>

          {/* Breakdown */}
          <div className="space-y-2 text-sm border-t border-slate-800 pt-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Occupied rooms</span>
              <span className="text-white font-mono">{details?.occupiedRooms}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Rate per room</span>
              <span className="text-white font-mono">KES {details?.pricePerRoom}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-800/60">
              <span className="font-display font-semibold text-white">Monthly total</span>
              <span className="font-display font-bold text-ocean-400 text-lg">
                KES {expected.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Receipt */}
          {payStatus?.mpesaReceiptNumber && (
            <div className="mt-4 flex items-center gap-2 px-3 py-2 bg-emerald-900/20 border border-emerald-800/30 rounded-lg">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <div>
                <p className="text-xs text-emerald-400 font-mono">Receipt: {payStatus.mpesaReceiptNumber}</p>
                {payStatus.paidAt && (
                  <p className="text-xs text-slate-500 font-mono">
                    {new Date(payStatus.paidAt).toLocaleString('en-KE')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Pay form ── */}
        {!isFullyPaid && (
          <div ref={formRef} className="card p-5">
            <h2 className="font-display font-semibold text-white mb-4">Pay via M-Pesa</h2>

            {/* Polling indicator */}
            {polling && (
              <div className="flex items-center gap-3 px-4 py-3 bg-ocean-900/30 border border-ocean-800/40 rounded-xl mb-4">
                <svg className="w-5 h-5 animate-spin text-ocean-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <div>
                  <p className="text-sm text-ocean-400 font-display font-medium">Waiting for M-Pesa confirmation...</p>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your PIN on your phone. Auto-updates when paid.</p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="label">M-Pesa Phone Number</label>
                <input
                  className="input-field font-mono"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="0712345678"
                  disabled={pushing || polling}
                  type="tel"
                  inputMode="tel"
                />
                <p className="text-xs text-slate-600 mt-1.5">
                  Pre-filled from your account — edit if different
                </p>
              </div>

              <div>
                <label className="label">Amount (KES)</label>
                <input
                  className="input-field font-mono text-lg"
                  type="number"
                  min="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder={String(remaining)}
                  disabled={pushing || polling}
                />
                {remaining < expected && remaining > 0 && (
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setAmount(String(remaining))}
                      className="text-xs px-3 py-1.5 bg-ocean-500/15 text-ocean-400 border border-ocean-500/30 rounded-lg hover:bg-ocean-500/25 transition-colors font-display"
                    >
                      Fill remaining (KES {remaining.toLocaleString()})
                    </button>
                  </div>
                )}
                <p className="text-xs text-slate-600 mt-1.5">
                  You can pay in installments — pre-filled with {remaining < expected ? 'remaining balance' : 'full amount'}
                </p>
              </div>

              <button
                onClick={handleStkPush}
                disabled={pushing || polling}
                className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base"
              >
                {pushing ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Sending to your phone...
                  </>
                ) : polling ? (
                  'Awaiting payment...'
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                    </svg>
                    Pay KES {Number(amount || 0).toLocaleString()} via M-Pesa
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {isFullyPaid && (
          <div className="card p-5 border-emerald-500/20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p className="font-display font-semibold text-emerald-400">Fully paid for this month</p>
            <p className="text-slate-500 text-sm mt-1">Thank you! Your account is active.</p>
          </div>
        )}
      </div>
    </div>
  );
}
