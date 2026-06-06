import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import toast, { Toaster } from 'react-hot-toast';
import api from '../utils/api.js';

export default function TenantRegister() {
  const { ownerId } = useParams();

  const [propertyInfo, setPropertyInfo] = useState(null);
  const [loadError, setLoadError]       = useState(false);
  const [form, setForm]   = useState({ houseNumber: '', tenantName: '', phoneNumber: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);

  const cardRef    = useRef(null);
  const successRef = useRef(null);

  // Load property info
  useEffect(() => {
    api.get(`/property/public/${ownerId}`)
      .then(r => {
        setPropertyInfo(r.data);
        // Entrance animation
        gsap.fromTo(cardRef.current,
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 0.1 }
        );
      })
      .catch(() => setLoadError(true));
  }, [ownerId]);

  useEffect(() => {
    if (success && successRef.current) {
      gsap.fromTo(successRef.current,
        { scale: 0.85, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
      );
    }
  }, [success]);

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  const validate = () => {
    const e = {};
    if (!form.houseNumber.trim()) e.houseNumber = 'House number is required';
    if (!form.tenantName.trim())  e.tenantName  = 'Your name is required';
    if (!form.phoneNumber.trim()) e.phoneNumber = 'WhatsApp number is required';
    else if (!/^[0-9+\s\-]{9,15}$/.test(form.phoneNumber.trim()))
      e.phoneNumber = 'Enter a valid phone number';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitting(true);
    try {
      await api.post(`/property/public/${ownerId}`, form);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.error || 'Registration failed. Please try again.';
      toast.error(msg);
      // Shake the card
      gsap.fromTo(cardRef.current, { x: -8 }, { x: 0, duration: 0.4, ease: 'elastic.out(1, 0.3)' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Error state ──────────────────────────────────────────────────
  if (loadError) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h2 className="font-display font-bold text-white text-xl mb-2">Link not found</h2>
        <p className="text-slate-500 text-sm">This registration link is invalid or has expired.<br/>Please ask your caretaker for a new link.</p>
      </div>
    </div>
  );

  // ── Loading ──────────────────────────────────────────────────────
  if (!propertyInfo) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <svg className="w-8 h-8 animate-spin text-ocean-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  // ── Success state ─────────────────────────────────────────────────
  if (success) return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-950">
      <Toaster position="top-center" />
      <div ref={successRef} className="text-center max-w-sm w-full">
        <div className="w-20 h-20 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <h2 className="font-display font-bold text-white text-2xl mb-2">You're registered!</h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Room <span className="text-white font-semibold">{form.houseNumber.toUpperCase()}</span> has been registered at{' '}
          <span className="text-white font-semibold">{propertyInfo.houseName}</span>.
        </p>
        <p className="text-slate-500 text-sm mt-3">
          Your caretaker will fill in your opening meter reading.<br/>
          You'll receive water bills on WhatsApp at <span className="text-white font-mono">{form.phoneNumber}</span>.
        </p>

        <div className="mt-6 p-4 bg-ocean-500/10 border border-ocean-500/20 rounded-xl">
          <div className="flex items-center gap-2 justify-center">
            <svg className="w-5 h-5 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
            </svg>
            <span className="text-ocean-400 font-display font-semibold text-sm">Powered by AquaBill</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── Registration form ─────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-slate-950 relative overflow-hidden">
      <Toaster position="top-center" toastOptions={{
        style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155', borderRadius: '12px', fontFamily: 'DM Sans, sans-serif', fontSize: '14px' },
        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
      }} />

      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-ocean-500/5 rounded-full blur-3xl pointer-events-none"/>
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-ocean-700/5 rounded-full blur-3xl pointer-events-none"/>

      <div className="w-full max-w-sm" ref={cardRef}>
        {/* Header */}
        <div className="flex flex-col items-center mb-7">
          <div className="w-14 h-14 rounded-2xl bg-ocean-500/20 border border-ocean-500/40 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-ocean-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2C12 2 5 10 5 15a7 7 0 0014 0C19 10 12 2 12 2z"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-2xl text-white text-center">
            {propertyInfo.houseName}
          </h1>
          <p className="text-slate-500 text-sm mt-1 text-center">
            Register your room to receive water bills on WhatsApp
          </p>
        </div>

        {/* Form */}
        <div className="card p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* House number */}
            <div>
              <label className="label">Room / House Number *</label>
              <input
                className={`input-field ${errors.houseNumber ? 'border-red-500/60 focus:ring-red-500/20' : ''}`}
                value={form.houseNumber}
                onChange={e => set('houseNumber', e.target.value)}
                placeholder="e.g. A1, B3, 12"
                autoComplete="off"
                autoCapitalize="characters"
              />
              {errors.houseNumber && (
                <p className="text-xs text-red-400 mt-1.5 font-display">{errors.houseNumber}</p>
              )}
            </div>

            {/* Tenant name */}
            <div>
              <label className="label">Your Full Name *</label>
              <input
                className={`input-field ${errors.tenantName ? 'border-red-500/60 focus:ring-red-500/20' : ''}`}
                value={form.tenantName}
                onChange={e => set('tenantName', e.target.value)}
                placeholder="e.g. John Kamau"
                autoComplete="name"
              />
              {errors.tenantName && (
                <p className="text-xs text-red-400 mt-1.5 font-display">{errors.tenantName}</p>
              )}
            </div>

            {/* WhatsApp number */}
            <div>
              <label className="label">WhatsApp Number *</label>
              <input
                className={`input-field font-mono ${errors.phoneNumber ? 'border-red-500/60 focus:ring-red-500/20' : ''}`}
                value={form.phoneNumber}
                onChange={e => set('phoneNumber', e.target.value)}
                placeholder="e.g. 0712345678"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
              />
              {errors.phoneNumber && (
                <p className="text-xs text-red-400 mt-1.5 font-display">{errors.phoneNumber}</p>
              )}
              <p className="text-xs text-slate-600 mt-1.5">
                Water bills will be sent to this number
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3.5 mt-1"
            >
              {submitting ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Registering...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                  </svg>
                  Register My Room
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Your details will only be used to send you water bills.
        </p>
      </div>
    </div>
  );
}
