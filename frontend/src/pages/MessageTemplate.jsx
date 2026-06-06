import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import api from '../utils/api.js';

const DEFAULT_TEMPLATE = `Hello {tenantName},

WATER BILL:
Previous Reading: {previousReading}
Current Reading: {currentReading}
Units Used: {unitsUsed}
Amount Due: KES {waterCost}

Thank you.`;

const PLACEHOLDERS = [
  { tag: '{tenantName}',      desc: "Tenant's name" },
  { tag: '{houseNumber}',     desc: 'Room / house number' },
  { tag: '{previousReading}', desc: 'Last meter reading' },
  { tag: '{currentReading}',  desc: 'New meter reading' },
  { tag: '{unitsUsed}',       desc: 'Units consumed' },
  { tag: '{waterCost}',       desc: 'Amount due in KES' }
];

// Live preview substitutes placeholders with sample values
const SAMPLE = {
  '{tenantName}':      'John Kamau',
  '{houseNumber}':     'A3',
  '{previousReading}': '1200',
  '{currentReading}':  '1247',
  '{unitsUsed}':       '47',
  '{waterCost}':       '940.00'
};

const buildPreview = (template) => {
  let t = template || DEFAULT_TEMPLATE;
  Object.entries(SAMPLE).forEach(([k, v]) => { t = t.replaceAll(k, v); });
  return t;
};

export default function MessageTemplate() {
  const [template, setTemplate]   = useState('');
  const [original, setOriginal]   = useState('');
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef(null);
  const pageRef     = useRef(null);

  useEffect(() => {
    gsap.fromTo(pageRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
    );

    api.get('/auth/template')
      .then(r => {
        setTemplate(r.data.template || '');
        setOriginal(r.data.template || '');
        setLoading(false);
      })
      .catch(() => { toast.error('Failed to load template'); setLoading(false); });
  }, []);

  const insertPlaceholder = (tag) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end   = el.selectionEnd;
    const next  = template.slice(0, start) + tag + template.slice(end);
    setTemplate(next);
    // Restore cursor after tag
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    }, 0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post('/auth/template', { template });
      setOriginal(template);
      toast.success('Template saved');
      gsap.fromTo(pageRef.current, { scale: 1 }, { scale: 1.005, duration: 0.15, yoyo: true, repeat: 1 });
    } catch {
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setTemplate('');
    toast('Reset to default template', { icon: '↩️' });
  };

  const isDirty    = template !== original;
  const activeTemplate = template.trim() || DEFAULT_TEMPLATE;

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="w-8 h-8 animate-spin text-ocean-500" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
    </div>
  );

  return (
    <div ref={pageRef}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Message Template</h1>
        <p className="text-slate-500 text-sm mt-1">
          Customise the WhatsApp message sent to tenants
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">

        {/* ── Left: editor ── */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Placeholder chips */}
          <div className="card p-4">
            <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wide mb-3">
              Available placeholders — tap to insert
            </p>
            <div className="flex flex-wrap gap-2">
              {PLACEHOLDERS.map(p => (
                <button
                  key={p.tag}
                  onClick={() => insertPlaceholder(p.tag)}
                  title={p.desc}
                  className="px-3 py-1.5 bg-ocean-500/15 text-ocean-400 border border-ocean-500/30 rounded-lg text-xs font-mono hover:bg-ocean-500/25 transition-colors"
                >
                  {p.tag}
                </button>
              ))}
            </div>
          </div>

          {/* Textarea */}
          <div className="card p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-display font-semibold text-slate-300">
                Your template
                {!template.trim() && (
                  <span className="ml-2 text-xs text-slate-500 font-normal">(using default)</span>
                )}
              </label>
              {isDirty && (
                <span className="text-xs text-amber-400 font-display">Unsaved changes</span>
              )}
            </div>

            <textarea
              ref={textareaRef}
              value={template}
              onChange={e => setTemplate(e.target.value)}
              placeholder={DEFAULT_TEMPLATE}
              rows={12}
              className="w-full bg-slate-800/80 border border-slate-700 focus:border-ocean-500 focus:ring-2 focus:ring-ocean-500/20 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-600 transition-all duration-200 font-mono text-sm resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {saving ? (
                  <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving...</>
                ) : 'Save Template'}
              </button>
              <button
                onClick={handleReset}
                disabled={saving}
                title="Clear custom template and use the system default"
                className="btn-secondary px-4"
              >
                Reset to default
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Leaving the editor blank uses the default template shown in the preview.
              "Reset to default" clears your custom template permanently.
            </p>
          </div>
        </div>

        {/* ── Right: live preview ── */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="card p-4 sticky top-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse-slow"/>
              <p className="text-sm font-display font-semibold text-slate-300">Live Preview</p>
              <span className="text-xs text-slate-600 ml-auto">Sample values</span>
            </div>

            {/* WhatsApp-style bubble */}
            <div className="bg-[#1a2a1a] rounded-2xl rounded-tl-sm p-4 border border-[#2a3a2a]">
              <pre className="text-[#e9edef] text-sm font-sans whitespace-pre-wrap leading-relaxed">
                {buildPreview(activeTemplate)}
              </pre>
              <div className="flex justify-end mt-2">
                <span className="text-[#8696a0] text-xs">
                  {new Date().toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} ✓✓
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mt-3 text-center">
              This is how your message will appear in WhatsApp
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
