import React, { useEffect, useState } from 'react';
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
  const [houses, setHouses]           = useState([]);
  const [pricePerUnit, setPricePerUnit] = useState(50);
  const [saving, setSaving]           = useState(false);
  const [loading, setLoading]         = useState(true);

  const [template, setTemplate]         = useState('');
  const [defaultTemplate, setDefaultTemplate] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(true);

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
  }, []);

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
