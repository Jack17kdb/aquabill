import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

export default function Settings() {
  const [houses, setHouses]         = useState([]);
  const [pricePerUnit, setPricePerUnit] = useState(50);
  const [saving, setSaving]         = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    api.get('/property/all')
      .then(r => { setHouses(r.data.properties); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleApplyPriceToAll = async () => {
    if (!pricePerUnit || pricePerUnit <= 0) {
      toast.error('Enter a valid price per unit');
      return;
    }
    setSaving(true);
    try {
      await Promise.all(
        houses.map(h => api.put(`/property/update/${h._id}`, { waterMeterPricePerUnit: Number(pricePerUnit) }))
      );
      toast.success(`Rate updated to KES ${pricePerUnit}/unit for all ${houses.length} houses`);
    } catch {
      toast.error('Failed to update prices');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">System configuration</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Water pricing */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-white mb-1">Water Rate</h2>
          <p className="text-sm text-slate-500 mb-4">Set the price per cubic meter / unit of water</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Price per Unit (KES)</label>
              <input
                type="number"
                min="1"
                value={pricePerUnit}
                onChange={e => setPricePerUnit(e.target.value)}
                className="input-field"
                placeholder="50"
              />
            </div>
            <button
              onClick={handleApplyPriceToAll}
              disabled={saving || loading}
              className="btn-primary flex-shrink-0 flex items-center gap-2"
            >
              {saving && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              )}
              Apply to All Houses
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Updates all {houses.length} existing houses. New houses can be given custom rates individually.
          </p>
        </div>

        {/* Account info */}
        <div className="card p-5 border-slate-700/30">
          <h2 className="font-display font-semibold text-white mb-1">Account</h2>
          <p className="text-sm text-slate-500">
            Account credentials are managed by the platform administrator.
            Contact them at +25490697045 if you need a password change.
          </p>
        </div>

      </div>
    </div>
  );
}
