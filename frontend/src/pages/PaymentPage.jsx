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

export default function PaymentPage() {
  const [details, setDetails]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [phone, setPhone]         = useState('');
  const [amount, setAmount]       = useState('');
  const [pushing, setPushing]     = useState(false);
  const [polling, setPolling]     = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [payStatus, setPayStatus] = useState(null);
  const pollRef  = useRef(null);
  const formRef  = useRef(null);

  const fetchDetails = () => {
    setLoading(true);
    api.get('/payment/details')
      .then(r => {
        setDetails(r.data);
        setPhone(r.data.caretakerPhone || '');
        // Pre-fill with remaining balance if partial, else full amount
        const existing = r.data.existingPayment;
        if (existing?.status === 'partial') {
          const remaining = r.data.amountExpected - (existing.amountPaid || 0);
          setAmount(String(Math.max(0, remaining)));
        } else {
          setAmount(String(r.data.amountExpected));
        }
        if (existing) setPayStatus(existing);
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load payment details'); setLoading(false); });
  };

  useEffect(() => {
    fetchDetails();
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  useEffect(() => {
    if (!loading && formRef.current) {
      gsap.fromTo(formRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
      );
    }
  }, [loading]);

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
          toast.success('✅ Payment received — thank you!');
          fetchDetails(); // refresh amounts
        } else if (r.data.status === 'failed') {
          clearInterval(pollRef.current);
          setPolling(false);
          toast.error('Payment cancelled or failed. You can try again.');
        } else if (attempts >= 24) {
          clearInterval(pollRef.current);
          setPolling(false);
          toast('No response yet — check your M-Pesa messages.', { icon: '⚠️' });
        }
      } catch { /* silently continue */ }
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
      gsap.fromTo(formRef.current, { x: -6 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
    } finally {
      setPushing(false);
    }
  };

  const sc = statusConfig[payStatus?.status || 'pending'];
  const amountPaid      = payStatus?.amountPaid || 0;
  const amountExpected  = details?.amountExpected || 0;
  const amountRemaining = Math.max(0, amountExpected - amountPaid);
  const isPaid          = payStatus?.status === 'completed';
  const progressPct     = amountExpected > 0 ? Math.min(100, (amountPaid / amountExpected) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Subscription Payment</h1>
        <p className="text-slate-500 text-sm mt-1">
          {details?.billingPeriod
            ? `Billing period: ${details.billingPeriod}`
            : 'Loading...'}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-ocean-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : (
        <div ref={formRef} className="flex flex-col gap-5">

          {/* Billing breakdown card */}
          <div className="card p-5">
            <h2 className="font-display font-semibold text-white mb-4">Billing Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Property</span>
                <span className="text-white font-medium">{details?.houseName || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Occupied rooms</span>
                <span className="text-white font-mono">{details?.occupiedRooms || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Rate per room</span>
                <span className="text-white font-mono">KES {details?.pricePerRoom || 0}</span>
              </div>
              <div className="border-t border-slate-700/50 pt-3 flex justify-between">
                <span className="font-display font-semibold text-white">Total Due</span>
                <span className="font-display font-bold text-ocean-400 text-lg">
                  KES {amountExpected.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Payment progress bar */}
            {amountPaid > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-500">Paid: KES {amountPaid.toLocaleString()}</span>
                  <span className="text-slate-500">Remaining: KES {amountRemaining.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-ocean-500 rounded-full transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1 text-right">{Math.round(progressPct)}% paid</p>
              </div>
            )}
          </div>

          {/* Current status */}
          {payStatus && (
            <div className={`flex items-start gap-3 px-4 py-4 rounded-xl border ${sc.bg}`}>
              <div className={`text-2xl leading-none mt-0.5 ${sc.color}`}>
                {payStatus.status === 'completed' ? '✓' : payStatus.status === 'partial' ? '◑' : payStatus.status === 'failed' ? '✗' : '⏳'}
              </div>
              <div className="flex-1">
                <div className={`font-display font-bold ${sc.color}`}>{sc.label}</div>
                {payStatus.mpesaReceiptNumber && (
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    M-Pesa Receipt: <span className="text-emerald-400">{payStatus.mpesaReceiptNumber}</span>
                  </div>
                )}
                {payStatus.paidAt && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    {new Date(payStatus.paidAt).toLocaleString('en-KE')}
                  </div>
                )}
                {payStatus.status === 'partial' && amountRemaining > 0 && (
                  <div className="text-sm text-blue-300 mt-1 font-display">
                    Balance: KES {amountRemaining.toLocaleString()} remaining
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Polling indicator */}
          {polling && (
            <div className="flex items-center gap-3 px-4 py-3.5 bg-ocean-900/30 border border-ocean-800/40 rounded-xl">
              <svg className="w-5 h-5 animate-spin text-ocean-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <div>
                <p className="text-sm text-ocean-400 font-display font-semibold">Waiting for M-Pesa...</p>
                <p className="text-xs text-slate-500 mt-0.5">Enter your PIN on your phone to complete payment</p>
              </div>
            </div>
          )}

          {/* Payment form — always visible unless fully paid */}
          {!isPaid && (
            <div className="card p-5">
              <h2 className="font-display font-semibold text-white mb-4">Pay via M-Pesa</h2>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="label">M-Pesa Phone Number</label>
                  <input
                    className="input-field font-mono"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0712345678"
                    type="tel"
                    inputMode="tel"
                    disabled={pushing || polling}
                  />
                  <p className="text-xs text-slate-600 mt-1.5">
                    Pre-filled from your account — edit if paying from a different number
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
                    placeholder="2000"
                    disabled={pushing || polling}
                  />
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {/* Quick fill buttons */}
                    {amountRemaining > 0 && amountRemaining !== Number(amount) && (
                      <button
                        type="button"
                        onClick={() => setAmount(String(amountRemaining))}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-display"
                      >
                        Pay remaining (KES {amountRemaining.toLocaleString()})
                      </button>
                    )}
                    {amountExpected > 0 && Number(amount) !== amountExpected && (
                      <button
                        type="button"
                        onClick={() => setAmount(String(amountExpected))}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-all font-display"
                      >
                        Pay full (KES {amountExpected.toLocaleString()})
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1.5">
                    You can pay in instalments — any amount is accepted
                  </p>
                </div>

                <button
                  onClick={handleStkPush}
                  disabled={pushing || polling}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-4 text-base disabled:opacity-60"
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
                    'Waiting for payment...'
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

          {isPaid && (
            <div className="card p-8 text-center border-emerald-900/30">
              <div className="text-5xl mb-3">✅</div>
              <h3 className="font-display font-bold text-white text-xl mb-1">All paid up!</h3>
              <p className="text-slate-400 text-sm">
                Your subscription for {details?.billingPeriod} is fully settled.
                See you next month!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
