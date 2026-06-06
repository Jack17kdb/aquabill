import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api.js';
import useAuthStore from '../store/auth.store.js';

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
    <div className="card w-full max-w-md p-6 animate-fade-up max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display font-bold text-white text-lg">{title}</h3>
        <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      {children}
    </div>
  </div>
);

const HouseForm = ({ initial, onSave, onCancel, loading }) => {
  const [form, setForm] = useState({
    houseNumber: '',
    tenantName: '',
    phoneNumber: '',
    waterMeterPricePerUnit: 50,
    lastReading: 0,
    isVacant: false,
    ...initial
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">House No. *</label>
          <input
            className="input-field"
            value={form.houseNumber}
            onChange={e => set('houseNumber', e.target.value)}
            placeholder="A1"
            required
            disabled={!!initial?._id}
          />
        </div>
        <div>
          <label className="label">Water Rate (KES/unit) *</label>
          <input
            className="input-field"
            type="number"
            min="1"
            value={form.waterMeterPricePerUnit}
            onChange={e => set('waterMeterPricePerUnit', Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div>
        <label className="label">Tenant Name</label>
        <input
          className="input-field"
          value={form.tenantName}
          onChange={e => set('tenantName', e.target.value)}
          placeholder="John Doe"
        />
      </div>

      <div>
        <label className="label">Phone Number (WhatsApp)</label>
        <input
          className="input-field"
          value={form.phoneNumber}
          onChange={e => set('phoneNumber', e.target.value)}
          placeholder="0712345678"
        />
      </div>

      <div>
        <label className="label">Opening Meter Reading</label>
        <input
          className="input-field"
          type="number"
          min="0"
          value={form.lastReading}
          onChange={e => set('lastReading', Number(e.target.value))}
        />
      </div>

      <div className="flex items-center gap-3 mt-2">
        <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
          {loading
            ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving...</>
            : 'Save House'
          }
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
      </div>
    </form>
  );
};

export default function ManageHouses() {
  const [houses, setHouses]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [copied, setCopied]     = useState(false);
  const { user }                = useAuthStore();
  const [saving, setSaving]     = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editHouse, setEditHouse] = useState(null);
  const [search, setSearch]     = useState('');

  const fetchHouses = () => {
    setLoading(true);
    api.get('/property/all')
      .then(r => { setHouses(r.data.properties); setLoading(false); })
      .catch(() => { toast.error('Failed to load houses'); setLoading(false); });
  };

  useEffect(fetchHouses, []);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editHouse?._id) {
        await api.put(`/property/update/${editHouse._id}`, form);
        toast.success(`House ${form.houseNumber} updated`);
      } else {
        await api.post('/property/create', form);
        toast.success(`House ${form.houseNumber} added`);
      }
      setShowModal(false);
      setEditHouse(null);
      fetchHouses();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVacant = async (house) => {
    try {
      await api.patch(`/property/vacant/${house._id}`, { isVacant: !house.isVacant });
      toast.success(`${house.houseNumber} marked as ${house.isVacant ? 'occupied' : 'vacant'}`);
      fetchHouses();
    } catch {
      toast.error('Failed to update');
    }
  };

  const filtered = houses.filter(h =>
    h.houseNumber.toLowerCase().includes(search.toLowerCase()) ||
    h.tenantName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Houses</h1>
          <p className="text-slate-500 text-sm mt-1">{houses.length} units total</p>
        </div>
        <button
          onClick={() => { setEditHouse(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add House
        </button>
      </div>

      <div className="mb-4">
        <input
          className="input-field"
          placeholder="Search by house number or tenant name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Registration link */}
      {user?.id && (
        <div className="mb-5 flex items-center gap-3 card p-4 border-ocean-500/20">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-display font-semibold text-slate-400 mb-1">Tenant Registration Link</p>
            <p className="text-xs text-slate-500 font-mono truncate">
              {window.location.origin}/register/{user.id}
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/register/${user.id}`)
                .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); })
                .catch(() => {
                  // Fallback for mobile browsers that block clipboard
                  const ta = document.createElement('textarea');
                  ta.value = `${window.location.origin}/register/${user.id}`;
                  document.body.appendChild(ta);
                  ta.select();
                  document.execCommand('copy');
                  document.body.removeChild(ta);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                });
            }}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl font-display font-medium text-sm transition-all border ${
              copied
                ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40'
                : 'bg-ocean-500/15 text-ocean-400 border-ocean-500/30 hover:bg-ocean-500/25'
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                Copy Link
              </>
            )}
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-ocean-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🏠</div>
          <p className="font-display font-medium text-slate-400">No houses found</p>
          <p className="text-slate-600 text-sm mt-1">Add your first house to get started</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(house => (
            <div key={house._id} className="card p-4 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 font-display font-bold text-sm ${
                house.isVacant
                  ? 'bg-slate-800 text-slate-500 border border-slate-700'
                  : 'bg-ocean-500/15 text-ocean-400 border border-ocean-500/30'
              }`}>
                {house.houseNumber}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-display font-semibold text-white">
                    {house.isVacant ? 'Vacant' : house.tenantName || 'No tenant set'}
                  </span>
                  {house.isVacant && (
                    <span className="badge bg-amber-900/40 text-amber-400 border border-amber-800/40">Vacant</span>
                  )}
                </div>
                {!house.isVacant && house.phoneNumber && (
                  <p className="text-sm text-slate-500 font-mono mt-0.5">{house.phoneNumber}</p>
                )}
                <div className="flex flex-wrap gap-3 mt-2">
                  <span className="text-xs text-slate-500">
                    <span className="text-slate-400">Last reading:</span> {house.lastReading ?? 0}
                  </span>
                  <span className="text-xs text-slate-500">
                    <span className="text-slate-400">Rate:</span> KES {house.waterMeterPricePerUnit}/unit
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { setEditHouse(house); setShowModal(true); }}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Edit"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                </button>
                <button
                  onClick={() => handleToggleVacant(house)}
                  className={`p-2 rounded-lg transition-colors ${
                    house.isVacant
                      ? 'text-emerald-400 hover:bg-emerald-900/30'
                      : 'text-amber-400 hover:bg-amber-900/30'
                  }`}
                  title={house.isVacant ? 'Mark occupied' : 'Mark vacant'}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {house.isVacant
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6"/>
                    }
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <Modal
          title={editHouse ? `Edit ${editHouse.houseNumber}` : 'Add New House'}
          onClose={() => setShowModal(false)}
        >
          <HouseForm
            initial={editHouse}
            onSave={handleSave}
            onCancel={() => setShowModal(false)}
            loading={saving}
          />
        </Modal>
      )}
    </div>
  );
}
