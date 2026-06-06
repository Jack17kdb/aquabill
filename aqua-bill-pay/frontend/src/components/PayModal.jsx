import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

const statusConfig = {
  pending:   { color: 'text-amber-400',  bg: 'bg-amber-900/30  border-amber-800/40',  label: 'Pending',   icon: '⏳' },
  completed: { color: 'text-emerald-400', bg: 'bg-emerald-900/30 border-emerald-800/40', label: 'Paid',    icon: '✓'  },
  partial:   { color: 'text-blue-400',   bg: 'bg-blue-900/30   border-blue-800/40',   label: 'Partial',   icon: '◑'  },
  failed:    { color: 'text-red-400',    bg: 'bg-red-900/30    border-red-800/40',    label: 'Failed',    icon: '✗'  }
};

export default function PayModal({ onClose }) {
  const [details, setDetails]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [phone, setPhone]         = useState('');
  const [amount, setAmount]       = useState('');
  const [pushing, setPushing]     = useState(false);
  const [polling, setPolling]     = useState(false);
  const [paymentId, setPaymentId] = useState(null);
  const [payStatus, setPayStatus] = useState(null);
  const pollRef  = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(modalRef.current, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35, ease: 'power3.out' });

    api.get('/payment/details')
      .then(r => {
        setDetails(r.data);
        setPhone(r.data.caretakerPhone || '');
        setAmount(String(r.data.amountExpected));
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
        const { status } = r.data;
        setPayStatus(r.data);

        if (status === 'completed') {
          clearInterval(pollRef.current);
          setPolling(false);
          toast.success('✅ Payment received! Thank you.');
          gsap.to(modalRef.current, { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1 });
        } else if (status === 'failed') {
          clearInterval(pollRef.current);
          setPolling(false);
          toast.error('Payment was cancelled or failed. You can try again.');
        } else if (attempts >= 24) {
          // Stop polling after 2 minutes (24 × 5s)
          clearInterval(pollRef.current);
          setPolling(false);
          toast('No response received. Check your M-Pesa messages.', { icon: '⚠️' });
        }
      } catch {
        // silently continue polling
      }
    }, 5000);
  };

  const handleStkPush = async () => {
    if (!phone) { toast.error('Enter a phone number'); return; }
    if (!amount || Number(amount) <= 0) { toast.error('Enter a valid amount'); return; }

    setPushing(true);
    try {
      const r = await api.post('/payment/stk-push', { phoneNumber: phone, amount: Number(amount) });
      setPaymentId(r.data.paymentId);
      toast.success(r.data.message, { duration: 5000 });
      startPolling(r.data.paymentId);
    } catch (err) {
      toast.error(err.response?.data?.error || 'STK push failed');
    } finally {
      setPushing(false);
    }
  };

  const alreadyPaid = payStatus?.status === 'completed';

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div ref={modalRef} className="card w-full max-w-sm p-6 max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-white text-lg">Pay Subscription</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              {details?.billingPeriod ? `Billing period: ${details.billingPeriod}` : 'Loading...'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="w-7 h-7 animate-spin text-ocean-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : (
          <>
            {/* Billing breakdown */}
            <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 p-4 mb-5">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-400 font-display">
                  {details?.houseName || 'Your property'}
                </span>
                <span className="text-xs text-slate-500 font-mono">{details?.billingPeriod}</span>
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Occupied rooms</span>
                  <span className="text-white font-mono">{details?.occupiedRooms}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rate per room</span>
                  <span className="text-white font-mono">KES {details?.pricePerRoom}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700/50">
                  <span className="text-white font-display font-semibold">Total Due</span>
                  <span className="text-ocean-400 font-display font-bold text-lg">
                    KES {details?.amountExpected?.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Existing payment status */}
            {payStatus && (
              <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border mb-5 ${statusConfig[payStatus.status]?.bg}`}>
                <span className="text-lg">{statusConfig[payStatus.status]?.icon}</span>
                <div className="flex-1">
                  <div className={`font-display font-semibold text-sm ${statusConfig[payStatus.status]?.color}`}>
                    {statusConfig[payStatus.status]?.label}
                    {payStatus.amountPaid > 0 && ` — KES ${payStatus.amountPaid?.toLocaleString()} paid`}
                  </div>
                  {payStatus.mpesaReceiptNumber && (
                    <div className="text-xs text-slate-500 font-mono mt-0.5">
                      Receipt: {payStatus.mpesaReceiptNumber}
                    </div>
                  )}
                  {payStatus.paidAt && (
                    <div className="text-xs text-slate-500 font-mono">
                      {new Date(payStatus.paidAt).toLocaleString('en-KE')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Polling indicator */}
            {polling && (
              <div className="flex items-center gap-3 px-4 py-3 bg-ocean-900/30 border border-ocean-800/40 rounded-xl mb-5">
                <svg className="w-5 h-5 animate-spin text-ocean-400 flex-shrink-0" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <div>
                  <p className="text-sm text-ocean-400 font-display font-medium">Waiting for payment...</p>
                  <p className="text-xs text-slate-500 mt-0.5">Enter your M-Pesa PIN on your phone</p>
                </div>
              </div>
            )}

            {/* Payment form — hide if completed */}
            {!alreadyPaid && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="label">M-Pesa Phone Number</label>
                  <input
                    className="input-field font-mono"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0712345678"
                    disabled={pushing || polling}
                  />
                  <p className="text-xs text-slate-600 mt-1">Pre-filled from your account — edit if different</p>
                </div>
                <div>
                  <label className="label">Amount (KES)</label>
                  <input
                    className="input-field font-mono"
                    type="number"
                    min="1"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    placeholder="2000"
                    disabled={pushing || polling}
                  />
                  <p className="text-xs text-slate-600 mt-1">
                    Pre-filled with full amount — you can edit for partial payment
                  </p>
                </div>

                <button
                  onClick={handleStkPush}
                  disabled={pushing || polling}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3.5"
                >
                  {pushing ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                      </svg>
                      Sending STK push...
                    </>
                  ) : polling ? (
                    'Awaiting payment...'
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                      </svg>
                      Pay via M-Pesa
                    </>
                  )}
                </button>
              </div>
            )}

            {alreadyPaid && (
              <button onClick={onClose} className="btn-secondary w-full mt-2">Close</button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
