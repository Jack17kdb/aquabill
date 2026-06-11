import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import api from '../utils/api.js';
import useAuthStore from '../store/auth.store.js';

// ── IndexedDB offline storage ──────────────────────────────────────
const DB_NAME = 'aquabill_offline';
const DB_STORE = 'pending_readings';

const openDB = () => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB_NAME, 1);
  req.onupgradeneeded = e => e.target.result.createObjectStore(DB_STORE, { keyPath: 'houseId' });
  req.onsuccess = e => resolve(e.target.result);
  req.onerror = () => reject(new Error('Failed to open IndexedDB'));
});

const saveOffline = async (readings) => {
  const db = await openDB();
  const tx = db.transaction(DB_STORE, 'readwrite');
  for (const r of readings) tx.objectStore(DB_STORE).put(r);
};

const loadOffline = async () => {
  const db = await openDB();
  return new Promise((resolve) => {
    const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = () => resolve([]);
  });
};

const clearOffline = async () => {
  const db = await openDB();
  db.transaction(DB_STORE, 'readwrite').objectStore(DB_STORE).clear();
};

// ── Skip-confirm dialog ────────────────────────────────────────────
const SkipConfirmDialog = ({ skipped, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
    <div className="card w-full max-w-sm p-6 animate-fade-up">
      <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-4 mx-auto">
        <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>

      <h3 className="font-display font-bold text-white text-center mb-1">
        {skipped.length} occupied {skipped.length === 1 ? 'house has' : 'houses have'} no reading
      </h3>
      <p className="text-sm text-slate-400 text-center mb-4">
        These occupied units were left blank and will <span className="text-white font-medium">not be billed</span> this cycle:
      </p>

      {/* List skipped houses */}
      <div className="bg-slate-800/60 rounded-xl border border-slate-700/50 divide-y divide-slate-700/40 mb-5 max-h-40 overflow-y-auto">
        {skipped.map(h => (
          <div key={h._id} className="flex items-center justify-between px-4 py-2.5">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-slate-300 text-sm">{h.houseNumber}</span>
              <span className="text-slate-500 text-xs">{h.tenantName || 'No tenant'}</span>
            </div>
            <span className="text-xs text-amber-400 font-mono">No reading</span>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="btn-secondary flex-1 text-sm">
          ← Go back &amp; fill
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-display font-semibold px-4 py-3 rounded-xl transition-all active:scale-95 text-sm"
        >
          Skip &amp; Send
        </button>
      </div>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────────────────
export default function WaterInput() {
  const { user } = useAuthStore();
  const isCaretaker = user?.role === 'caretaker';
  const [houses, setHouses]         = useState([]);
  const [readings, setReadings]     = useState({});
  const [errors, setErrors]         = useState({});
  const [loading, setLoading]       = useState(true);
  const [submitting, setSubmitting] = useState(false); // true = button locked
  const [isOnline, setIsOnline]     = useState(navigator.onLine);
  const [hasPending, setHasPending] = useState(false);
  const [skipDialog, setSkipDialog] = useState(null); // array of skipped houses | null

  const inputRefs = useRef({});
  const navigate  = useNavigate();

  // ── Online/offline listeners ──
  useEffect(() => {
    const onOnline  = () => { setIsOnline(true);  checkPending(); };
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const checkPending = async () => {
    const pending = await loadOffline();
    setHasPending(pending.length > 0);
  };

  // ── Load occupied houses ──
  useEffect(() => {
    api.get('/property/all')
      .then(r => {
        const occupied = r.data.properties.filter(h => !h.isVacant);
        setHouses(occupied);
        const init = {};
        occupied.forEach(h => { init[h._id] = ''; });
        setReadings(init);
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load houses'); setLoading(false); });
    checkPending();
  }, []);

  // ── Input helpers ──
  const handleReadingChange = (houseId, value, lastReading) => {
    setReadings(prev => ({ ...prev, [houseId]: value }));
    if (value && Number(value) < lastReading) {
      setErrors(prev => ({ ...prev, [houseId]: `Must be ≥ ${lastReading}` }));
    } else {
      setErrors(prev => { const e = { ...prev }; delete e[houseId]; return e; });
    }
  };

  const focusInput = (el) => {
    if (!el) return;
    el.focus();
    el.select();
    gsap.fromTo(el, { scale: 1 }, { scale: 1.02, duration: 0.15, yoyo: true, repeat: 1 });
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const next = houses[index + 1];
      if (next && inputRefs.current[next._id]) focusInput(inputRefs.current[next._id]);
    }
  };

  // ── Derive valid / blank lists ──
  const getValidReadings = () =>
    houses
      .filter(h => readings[h._id] !== '' && readings[h._id] !== undefined && !errors[h._id])
      .map(h => ({ houseId: h._id, houseNumber: h.houseNumber, currentReading: Number(readings[h._id]) }));

  const getBlankOccupied = () =>
    houses.filter(h => readings[h._id] === '' || readings[h._id] === undefined);

  // ── Actual submission (after any confirmation) ──
  const doSubmit = async (validReadings) => {
    // FIX 1: button already locked by setSubmitting(true) before this runs

    if (!isOnline) {
      await saveOffline(validReadings.map(r => ({ ...r, savedAt: Date.now() })));
      setHasPending(true);
      setSubmitting(false);
      toast.success(`${validReadings.length} readings saved offline. Will sync when online.`);
      return;
    }

    try {
      const res = await api.post('/billing/submit-readings', { readings: validReadings });
      await clearOffline();
      setHasPending(false);

      const { processed, skippedDuplicates } = res.data;

      // FIX 2: build a summary then redirect
      const lines = [];
      if (processed > 0)        lines.push(`✅ ${processed} bill${processed > 1 ? 's' : ''} queued for WhatsApp`);
      if (skippedDuplicates > 0) lines.push(`📅 ${skippedDuplicates} already billed this month`);

      // Show toast first, then navigate — toast persists across pages
      toast.success(lines.join('\n') || 'Done', { duration: 4000 });

      // Small delay so user sees the toast before the page changes
      setTimeout(() => navigate('/invoices'), 800);

    } catch (err) {
      setSubmitting(false); // re-enable on error so caretaker can retry
      toast.error(err.response?.data?.error || 'Submission failed');
    }
    // NOTE: don't setSubmitting(false) on success — we're navigating away anyway
  };

  // ── Submit handler ── (FIX 1 + FIX 3)
  const handleSubmit = async () => {
    const validReadings = getValidReadings();

    if (validReadings.length === 0 && Object.keys(errors).length === 0) {
      toast.error('Please enter at least one reading');
      return;
    }
    if (Object.keys(errors).length > 0) {
      toast.error('Fix validation errors first');
      return;
    }

    // FIX 1: lock button immediately — before any async work
    setSubmitting(true);

    // FIX 3: check for blank occupied houses
    const blanks = getBlankOccupied();
    if (blanks.length > 0) {
      // Show confirm dialog — keep button locked while dialog is open
      setSkipDialog(blanks);
      return; // wait for user choice
    }

    await doSubmit(validReadings);
  };

  // Dialog: user chose to go back and fill
  const handleSkipCancel = () => {
    setSkipDialog(null);
    setSubmitting(false); // re-enable button so they can fill and try again
  };

  // Dialog: user confirmed skipping blanks
  const handleSkipConfirm = async () => {
    setSkipDialog(null);
    const validReadings = getValidReadings(); // re-derive (blanks excluded)
    await doSubmit(validReadings);
  };

  // ── Offline sync ──
  const handleSyncOffline = async () => {
    const pending = await loadOffline();
    if (pending.length === 0) { toast('No pending readings'); return; }
    setSubmitting(true);
    try {
      const formatted = pending.map(r => ({ houseId: r.houseId, currentReading: r.currentReading }));
      const res = await api.post('/billing/submit-readings', { readings: formatted });
      await clearOffline();
      setHasPending(false);
      toast.success(`Synced ${res.data.processed} offline readings!`);
      setTimeout(() => navigate('/invoices'), 800);
    } catch (err) {
      toast.error('Sync failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Derived counts ──
  const filledCount = Object.values(readings).filter(v => v !== '').length;
  const errorCount  = Object.keys(errors).length;
  const blankCount  = houses.length - filledCount;

  // ── Loading state ──
  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="w-8 h-8 animate-spin text-ocean-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div>
      {/* Skip confirm dialog */}
      {skipDialog && (
        <SkipConfirmDialog
          skipped={skipDialog}
          onConfirm={handleSkipConfirm}
          onCancel={handleSkipCancel}
        />
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Water Readings</h1>
        <p className="text-slate-500 text-sm mt-1">{houses.length} occupied units</p>
      </div>

      {/* Caretaker notice */}
      {isCaretaker && (
        <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-amber-900/20 border border-amber-800/40 rounded-xl">
          <svg className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
          <p className="text-sm text-amber-300">
            <span className="font-display font-semibold">Caretaker mode:</span> You can enter and submit readings.
            WhatsApp messages will be sent by the landlord after review.
          </p>
        </div>
      )}

      {/* Status bar */}
      <div className="flex flex-wrap gap-2 mb-5">
        {!isOnline && (
          <div className="badge bg-amber-900/40 text-amber-400 border border-amber-800/40 text-sm px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse-slow mr-1"/>
            Offline — readings will be saved locally
          </div>
        )}
        {hasPending && isOnline && (
          <button
            onClick={handleSyncOffline}
            disabled={submitting}
            className="badge bg-ocean-900/40 text-ocean-400 border border-ocean-800/40 text-sm px-3 py-1.5 hover:bg-ocean-800/40 transition-colors cursor-pointer disabled:opacity-50"
          >
            ☁️ Sync offline readings
          </button>
        )}
        {filledCount > 0 && (
          <div className="badge bg-emerald-900/40 text-emerald-400 border border-emerald-800/40 text-sm px-3 py-1.5">
            {filledCount} filled
          </div>
        )}
        {blankCount > 0 && filledCount > 0 && (
          <div className="badge bg-slate-800/60 text-slate-500 border border-slate-700 text-sm px-3 py-1.5">
            {blankCount} blank
          </div>
        )}
        {errorCount > 0 && (
          <div className="badge bg-red-900/40 text-red-400 border border-red-800/40 text-sm px-3 py-1.5">
            {errorCount} error{errorCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {houses.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-display font-medium text-slate-400">No occupied houses</p>
          <p className="text-slate-600 text-sm mt-1">All houses are vacant or none have been added</p>
        </div>
      ) : (
        <>
          {/* Reading cards */}
          <div className="flex flex-col gap-3 mb-28">
            {houses.map((house, index) => {
              const prevReading = house.lastReading ?? 0;
              const currentVal  = readings[house._id] ?? '';
              const hasError    = !!errors[house._id];
              const units = currentVal !== '' && !hasError
                ? Math.max(0, Number(currentVal) - prevReading)
                : null;

              return (
                <div
                  key={house._id}
                  className={`card p-4 transition-all duration-200 ${
                    hasError        ? 'border-red-500/40' :
                    currentVal !== '' ? 'border-ocean-500/30' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* House badge */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-sm ${
                      currentVal !== '' && !hasError
                        ? 'bg-ocean-500/20 text-ocean-400 border border-ocean-500/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {house.houseNumber}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-display font-medium text-white text-sm">
                          {house.tenantName || 'Unknown tenant'}
                        </span>
                        {units !== null && (
                          <span className="font-mono text-xs text-ocean-400">
                            {units} units · KES {(units * house.waterMeterPricePerUnit).toLocaleString()}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-500 font-mono flex-shrink-0">
                          Prev: <span className="text-slate-300">{prevReading}</span>
                        </div>
                        <div className="flex-1">
                          <input
                            ref={el => inputRefs.current[house._id] = el}
                            type="number"
                            inputMode="numeric"
                            min={prevReading}
                            value={currentVal}
                            onChange={e => handleReadingChange(house._id, e.target.value, prevReading)}
                            onKeyDown={e => handleKeyDown(e, index)}
                            onFocus={e => { e.target.select(); gsap.to(e.target, { scale: 1.02, duration: 0.15 }); }}
                            onBlur={e => gsap.to(e.target, { scale: 1, duration: 0.15 })}
                            placeholder={`≥ ${prevReading}`}
                            className={`reading-input w-full bg-slate-800/80 border rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-600 transition-all duration-200 font-mono text-sm focus:outline-none focus:ring-2 ${
                              hasError
                                ? 'border-red-500/60 focus:ring-red-500/20'
                                : currentVal !== ''
                                ? 'border-ocean-500/40 focus:ring-ocean-500/20 focus:border-ocean-500'
                                : 'border-slate-700 focus:ring-ocean-500/20 focus:border-ocean-500'
                            }`}
                          />
                        </div>
                      </div>

                      {hasError && (
                        <p className="text-xs text-red-400 mt-1.5 font-display">{errors[house._id]}</p>
                      )}
                    </div>
                  </div>

                  {/* Next arrow */}
                  {index < houses.length - 1 && (
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={() => focusInput(inputRefs.current[houses[index + 1]._id])}
                        className="text-xs text-slate-600 hover:text-ocean-400 transition-colors font-display flex items-center gap-1"
                      >
                        Next → {houses[index + 1].houseNumber}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Sticky CTA ── */}
          <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 p-4 bg-slate-950/95 backdrop-blur border-t border-slate-800 lg:ml-64">
            <div className="max-w-2xl mx-auto">
              <button
                onClick={handleSubmit}
                disabled={submitting || filledCount === 0 || errorCount > 0}
                className="btn-primary w-full flex items-center justify-center gap-3 py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting && !skipDialog ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                    {isOnline
                      ? isCaretaker
                        ? `Submit ${filledCount > 0 ? filledCount + ' ' : ''}Readings for Review`
                        : `Calculate & Send ${filledCount > 0 ? filledCount + ' ' : ''}WhatsApp Messages`
                      : `Save ${filledCount > 0 ? filledCount + ' ' : ''}Readings Offline`
                    }
                  </>
                )}
              </button>

              {/* Progress hint */}
              {filledCount > 0 && !submitting && (
                <p className="text-center text-xs text-slate-600 mt-2 font-display">
                  {filledCount} of {houses.length} filled
                  {blankCount > 0 && (
                    <span className="text-amber-600/70"> · {blankCount} will be skipped</span>
                  )}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
