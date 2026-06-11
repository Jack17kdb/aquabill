import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/auth.store.js';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

const PLACEHOLDERS = [
  { tag: '{tenantName}',       desc: 'Tenant full name' },
  { tag: '{houseNumber}',      desc: 'Room / house number' },
  { tag: '{previousReading}',  desc: 'Previous meter reading' },
  { tag: '{currentReading}',   desc: 'Current meter reading' },
  { tag: '{unitsUsed}',        desc: 'Units consumed' },
  { tag: '{waterCost}',        desc: 'Amount due (KES)' }
];

export default function Settings() {
  const { user } = useAuthStore();
  const [houses, setHouses]           = useState([]);
  const [pricePerUnit, setPricePerUnit] = useState(50);
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);

  const [template, setTemplate]         = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(true);

  // Caretaker management
  const [caretakers, setCaretakers]       = useState([]);
  const [showAddCaretaker, setShowAddCaretaker] = useState(false);
  const [caretakerForm, setCaretakerForm] = useState({ email:'', password:'', caretakerName:'', caretakerPhone:'' });
  const [savingCaretaker, setSavingCaretaker] = useState(false);

  useEffect(() => {
    api.get('/property/all')
      .then(r => { setHouses(r.data.properties); setLoading(false); })
      .catch(() => setLoading(false));

    api.get('/auth/template')
      .then(r => {
        setTemplate(r.data.template || '');
        setDefaultTemplate(r.data.defaultTemplate || '');
        setTemplateLoading(false);
      })
      .catch(() => setTemplateLoading(false));

    api.get('/auth/caretakers')
      .then(r => setCaretakers(r.data.caretakers))
      .catch(() => {});
  }, []);

  const fetchCaretakers = () => {
    api.get('/auth/caretakers').then(r => setCaretakers(r.data.caretakers)).catch(() => {});
  };

  const handleAddCaretaker = async (e) => {
    e.preventDefault();
    setSavingCaretaker(true);
    try {
      await api.post('/auth/caretakers', caretakerForm);
      toast.success('Caretaker account created');
      setCaretakerForm({ email:'', password:'', caretakerName:'', caretakerPhone:'' });
      setShowAddCaretaker(false);
      fetchCaretakers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create caretaker');
    } finally {
      setSavingCaretaker(false);
    }
  };

  const handleToggleCaretaker = async (ct) => {
    try {
      await api.put(`/auth/caretakers/${ct._id}`, { isActive: !ct.isActive });
      toast.success(`${ct.caretakerName || ct.email} ${ct.isActive ? 'suspended' : 'activated'}`);
      fetchCaretakers();
    } catch { toast.error('Failed to update'); }
  };

  const handleDeleteCaretaker = async (ct) => {
    if (!window.confirm(`Remove ${ct.caretakerName || ct.email}?`)) return;
    try {
      await api.delete(`/auth/caretakers/${ct._id}`);
      toast.success('Caretaker removed');
      fetchCaretakers();
    } catch { toast.error('Failed to remove'); }
  };

  const handleApplyPriceToAll = async () => {
    if (!pricePerUnit || pricePerUnit <= 0) { toast.error('Enter a valid price per unit'); return; }
    setSaving(true);
    try {
      await Promise.all(houses.map(h =>
        api.put(`/property/update/${h._id}`, { waterMeterPricePerUnit: Number(pricePerUnit) })
      ));
      toast.success(`Rate updated to KES ${pricePerUnit}/unit for all ${houses.length} houses`);
    } catch {
      toast.error('Failed to update prices');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTemplate = async () => {
    setSavingTemplate(true);
    try {
      await api.put('/auth/template', { template });
      toast.success('Message template saved');
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleResetTemplate = () => {
    setTemplate('');
    toast('Reset to default template — save to apply', { icon: '↩️' });
  };

  const insertPlaceholder = (tag) => {
    const ta = document.getElementById('msg-template');
    if (!ta) { setTemplate(t => t + tag); return; }
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const next  = template.slice(0, start) + tag + template.slice(end);
    setTemplate(next);
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + tag.length;
      ta.focus();
    }, 0);
  };

  // Live preview using the typed template or default
  const previewMessage = (template || defaultTemplate)
    .replace(/{tenantName}/g,      'John Kamau')
    .replace(/{houseNumber}/g,     'A3')
    .replace(/{previousReading}/g, '1200')
    .replace(/{currentReading}/g,  '1235')
    .replace(/{unitsUsed}/g,       '35')
    .replace(/{waterCost}/g,       '700.00');

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">System configuration</p>
      </div>

      <div className="flex flex-col gap-5">

        {/* Water rate */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-white mb-1">Water Rate</h2>
          <p className="text-sm text-slate-500 mb-4">Price per cubic meter / unit of water</p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <label className="label">Price per Unit (KES)</label>
              <input type="number" min="1" value={pricePerUnit}
                onChange={e => setPricePerUnit(e.target.value)}
                className="input-field" placeholder="50" />
            </div>
            <button onClick={handleApplyPriceToAll} disabled={saving || loading}
              className="btn-primary flex-shrink-0 flex items-center gap-2">
              {saving && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Apply to All Houses
            </button>
          </div>
          <p className="text-xs text-slate-600 mt-2">
            Updates all {houses.length} existing houses. New houses can have custom rates.
          </p>
        </div>

        {/* Message template */}
        <div className="card p-5">
          <h2 className="font-display font-semibold text-white mb-1">WhatsApp Message Template</h2>
          <p className="text-sm text-slate-500 mb-4">
            Customise the bill message sent to tenants. Leave blank to use the default.
          </p>

          {/* Placeholder chips */}
          <div className="mb-3">
            <p className="text-xs text-slate-500 font-display mb-2">Click to insert placeholder:</p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map(p => (
                <button
                  key={p.tag}
                  type="button"
                  onClick={() => insertPlaceholder(p.tag)}
                  title={p.desc}
                  className="text-xs bg-ocean-500/15 hover:bg-ocean-500/25 text-ocean-400 border border-ocean-500/30 px-2.5 py-1.5 rounded-lg font-mono transition-all"
                >
                  {p.tag}
                </button>
              ))}
            </div>
          </div>

          <textarea
            id="msg-template"
            value={template}
            onChange={e => setTemplate(e.target.value)}
            placeholder={templateLoading ? 'Loading...' : defaultTemplate}
            rows={10}
            className="input-field font-mono text-sm resize-none leading-relaxed"
            disabled={templateLoading}
          />

          <div className="flex gap-2 mt-3">
            <button onClick={handleSaveTemplate} disabled={savingTemplate || templateLoading}
              className="btn-primary flex items-center gap-2">
              {savingTemplate && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              Save Template
            </button>
            <button onClick={handleResetTemplate} className="btn-secondary text-sm">
              Reset to Default
            </button>
          </div>

          {/* Live preview */}
          <div className="mt-5">
            <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wide mb-2">
              Live Preview
            </p>
            <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 font-mono text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
              {previewMessage || <span className="text-slate-600 italic">Start typing to see preview…</span>}
            </div>
            <p className="text-xs text-slate-600 mt-1.5">
              Preview uses sample data: John Kamau, room A3, 35 units, KES 700
            </p>
          </div>
        </div>

        {/* Caretaker management */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="font-display font-semibold text-white">Caretaker Accounts</h2>
              <p className="text-sm text-slate-500 mt-0.5">
                Caretakers can add/edit houses and submit readings — but cannot send WhatsApp messages or access invoices.
              </p>
            </div>
            <button
              onClick={() => setShowAddCaretaker(s => !s)}
              className="btn-primary flex items-center gap-2 text-sm py-2 px-4 flex-shrink-0 ml-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add Caretaker
            </button>
          </div>

          {showAddCaretaker && (
            <form onSubmit={handleAddCaretaker} className="mt-4 bg-slate-800/40 rounded-xl p-4 border border-slate-700/50 flex flex-col gap-3">
              <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wide">New Caretaker</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Name</label>
                  <input className="input-field" value={caretakerForm.caretakerName}
                    onChange={e => setCaretakerForm(f=>({...f,caretakerName:e.target.value}))}
                    placeholder="John Kamau" />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input className="input-field" value={caretakerForm.caretakerPhone}
                    onChange={e => setCaretakerForm(f=>({...f,caretakerPhone:e.target.value}))}
                    placeholder="0712345678" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Email *</label>
                  <input className="input-field" type="email" value={caretakerForm.email}
                    onChange={e => setCaretakerForm(f=>({...f,email:e.target.value}))}
                    placeholder="caretaker@email.com" required />
                </div>
                <div>
                  <label className="label">Password *</label>
                  <input className="input-field" type="password" value={caretakerForm.password}
                    onChange={e => setCaretakerForm(f=>({...f,password:e.target.value}))}
                    placeholder="Min 6 chars" required minLength={6} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingCaretaker} className="btn-primary flex items-center gap-2">
                  {savingCaretaker && <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  Create Account
                </button>
                <button type="button" onClick={() => setShowAddCaretaker(false)} className="btn-secondary">Cancel</button>
              </div>
            </form>
          )}

          {caretakers.length === 0 ? (
            <div className="mt-4 text-center py-8 bg-slate-800/30 rounded-xl border border-slate-700/30">
              <p className="text-slate-500 text-sm">No caretaker accounts yet.</p>
              <p className="text-slate-600 text-xs mt-1">Add one above if you want to delegate house management.</p>
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {caretakers.map(ct => (
                <div key={ct._id} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${ct.isActive ? 'bg-slate-800/40 border-slate-700/40' : 'bg-slate-900/40 border-slate-800/40 opacity-60'}`}>
                  <div className="w-9 h-9 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-medium text-white text-sm">{ct.caretakerName || 'Unnamed'}</span>
                      <span className={`badge text-xs border ${ct.isActive ? 'bg-emerald-900/40 text-emerald-400 border-emerald-800/40' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                        {ct.isActive ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{ct.email}</p>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    <button onClick={() => handleToggleCaretaker(ct)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-display font-medium border transition-all ${ct.isActive ? 'bg-amber-900/30 text-amber-400 border-amber-800/40 hover:bg-amber-800/40' : 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40 hover:bg-emerald-800/40'}`}>
                      {ct.isActive ? 'Suspend' : 'Activate'}
                    </button>
                    <button onClick={() => handleDeleteCaretaker(ct)}
                      className="px-3 py-1.5 rounded-lg text-xs font-display font-medium bg-red-900/30 text-red-400 border border-red-800/40 hover:bg-red-800/40 transition-all">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Account info */}
        <div className="card p-5 border-slate-700/30">
          <h2 className="font-display font-semibold text-white mb-1">Account</h2>
          <p className="text-sm text-slate-500">
            Credentials managed by the platform administrator. Contact them for password changes.
          </p>
        </div>

      </div>
    </div>
  );
}
