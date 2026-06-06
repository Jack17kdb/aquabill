import React, { useEffect, useState, useRef } from 'react';
import { gsap } from 'gsap';
import toast from 'react-hot-toast';
import api from '../../utils/api.js';

/* ─── Confirm Dialog ─── */
const ConfirmDialog = ({ message, subMessage, confirmLabel, confirmClass, onConfirm, onCancel }) => (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
    <div className="card w-full max-w-sm p-6 animate-fade-up">
      <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4 mx-auto">
        <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
        </svg>
      </div>
      <p className="font-display font-semibold text-white text-center mb-1">{message}</p>
      {subMessage && <p className="text-sm text-slate-400 text-center mb-5">{subMessage}</p>}
      <div className="flex gap-3 mt-5">
        <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
        <button onClick={onConfirm} className={`flex-1 font-display font-semibold px-4 py-3 rounded-xl transition-all active:scale-95 ${confirmClass}`}>
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

/* ─── Account Form Modal ─── */
const AccountModal = ({ initial, onSave, onClose, saving }) => {
  const isEdit = !!initial?._id;
  const [form, setForm] = useState({
    email: '',
    password: '',
    houseName: '',
    caretakerName: '',
    caretakerPhone: '',
    pricePerRoom: 50,
    ...initial
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isEdit && (!form.email || !form.password)) {
      toast.error('Email and password required');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="card w-full max-w-md p-6 animate-fade-up max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-display font-bold text-white text-lg">
              {isEdit ? `Edit: ${initial.houseName || initial.email}` : 'Add House Account'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">{isEdit ? 'Update account details' : 'Create a new admin account'}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Credentials */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wide mb-3">Login Credentials</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="label">Email *</label>
                <input className="input-field" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="admin@house.co.ke" required={!isEdit} />
              </div>
              <div>
                <label className="label">{isEdit ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input className="input-field" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder={isEdit ? 'Leave blank to keep current' : 'Min 6 characters'} minLength={isEdit ? 0 : 6} required={!isEdit} />
              </div>
            </div>
          </div>

          {/* House details */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wide mb-3">House Details</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="label">House / Property Name</label>
                <input className="input-field" value={form.houseName} onChange={e => set('houseName', e.target.value)} placeholder="Sunrise Apartments" />
              </div>
              <div>
                <label className="label">Price per Room / Month (KES)</label>
                <input className="input-field" type="number" min="0" value={form.pricePerRoom} onChange={e => set('pricePerRoom', Number(e.target.value))} placeholder="50" />
              </div>
            </div>
          </div>

          {/* Caretaker */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <p className="text-xs font-display font-semibold text-slate-400 uppercase tracking-wide mb-3">Caretaker Details</p>
            <div className="flex flex-col gap-3">
              <div>
                <label className="label">Caretaker Name</label>
                <input className="input-field" value={form.caretakerName} onChange={e => set('caretakerName', e.target.value)} placeholder="John Kamau" />
              </div>
              <div>
                <label className="label">Caretaker Phone (WhatsApp)</label>
                <input className="input-field" value={form.caretakerPhone} onChange={e => set('caretakerPhone', e.target.value)} placeholder="0712345678" />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {saving
                ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Saving...</>
                : isEdit ? 'Save Changes' : 'Create Account'
              }
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Account Card ─── */
const AccountCard = ({ account, onEdit, onToggle, onDelete, onRemind, remindingId }) => {
  const { _id, email, houseName, caretakerName, caretakerPhone, pricePerRoom, isActive, stats, createdAt } = account;

  return (
    <div className={`card p-5 transition-all duration-200 ${!isActive ? 'opacity-60 border-red-900/30' : ''}`}>
      {/* Header row */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isActive ? 'bg-violet-500/15 border border-violet-500/30' : 'bg-slate-800 border border-slate-700'}`}>
          <svg className={`w-5 h-5 ${isActive ? 'text-violet-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9.75L12 3l9 6.75V21H3V9.75z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-semibold text-white">{houseName || '(No name)'}</span>
            <span className={`badge text-xs ${isActive ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800/40' : 'bg-red-900/40 text-red-400 border border-red-800/40'}`}>
              {isActive ? 'Active' : 'Suspended'}
            </span>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">{email}</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { label: 'Total Rooms', value: stats.total },
          { label: 'Occupied', value: stats.occupied },
          { label: 'Monthly Fee', value: `KES ${stats.monthlyFee.toLocaleString()}` }
        ].map((s, i) => (
          <div key={i} className="bg-slate-800/60 rounded-lg p-2.5 text-center">
            <div className="font-display font-bold text-white text-lg leading-none">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Caretaker info */}
      {(caretakerName || caretakerPhone) && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
          <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
          </svg>
          <span className="text-sm text-slate-400">{caretakerName || '—'}</span>
          {caretakerPhone && <span className="text-xs text-slate-500 font-mono ml-auto">{caretakerPhone}</span>}
        </div>
      )}

      {/* Fee info */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-800/40 rounded-lg border border-slate-700/50">
        <svg className="w-4 h-4 text-amber-500/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
        <span className="text-sm text-slate-400">KES {pricePerRoom}/room · {stats.total} rooms</span>
        <span className="text-sm font-display font-semibold text-amber-400 ml-auto">= KES {stats.monthlyFee.toLocaleString()}/mo</span>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Edit */}
        <button onClick={() => onEdit(account)} className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          Edit
        </button>

        {/* Payment reminder */}
        <button
          onClick={() => onRemind(_id)}
          disabled={remindingId === _id || !caretakerPhone}
          title={!caretakerPhone ? 'No caretaker phone set' : 'Send payment reminder'}
          className="flex-1 bg-emerald-900/40 hover:bg-emerald-800/50 text-emerald-400 font-display font-medium px-3 py-2 rounded-xl border border-emerald-800/40 transition-all text-sm flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {remindingId === _id
            ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
          }
          Remind
        </button>

        {/* Toggle suspend */}
        <button
          onClick={() => onToggle(account)}
          className={`px-3 py-2 rounded-xl border font-display font-medium text-sm transition-all active:scale-95 flex items-center gap-1.5 ${
            isActive
              ? 'bg-amber-900/30 hover:bg-amber-800/40 text-amber-400 border-amber-800/40'
              : 'bg-emerald-900/30 hover:bg-emerald-800/40 text-emerald-400 border-emerald-800/40'
          }`}
        >
          {isActive
            ? <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Suspend</>
            : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>Activate</>
          }
        </button>

        {/* Delete */}
        <button
          onClick={() => onDelete(account)}
          className="px-3 py-2 rounded-xl border bg-red-900/30 hover:bg-red-800/40 text-red-400 border-red-800/40 font-display font-medium text-sm transition-all active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
        </button>
      </div>

      <p className="text-xs text-slate-600 font-mono mt-3">Added {new Date(createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
    </div>
  );
};

/* ─── Main Page ─── */
export default function SuperAdminAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [remindingId, setRemindingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editAccount, setEditAccount] = useState(null);
  const [confirm, setConfirm] = useState(null); // { type, account }
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all | active | suspended
  const listRef = useRef(null);

  const fetchAccounts = () => {
    setLoading(true);
    api.get('/superadmin/accounts')
      .then(r => { setAccounts(r.data.accounts); setLoading(false); })
      .catch(() => { toast.error('Failed to load accounts'); setLoading(false); });
  };

  useEffect(() => { fetchAccounts(); }, []);

  useEffect(() => {
    if (!loading && listRef.current) {
      gsap.fromTo(listRef.current.children,
        { y: 16, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.06, ease: 'power2.out' }
      );
    }
  }, [loading]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      if (editAccount?._id) {
        await api.put(`/superadmin/accounts/${editAccount._id}`, form);
        toast.success('Account updated');
      } else {
        await api.post('/superadmin/accounts', form);
        toast.success(`Account created for ${form.houseName || form.email}`);
      }
      setShowModal(false);
      setEditAccount(null);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (account) => {
    if (account.isActive) {
      // Ask confirmation before suspending
      setConfirm({ type: 'suspend', account });
    } else {
      // Activate immediately
      try {
        await api.patch(`/superadmin/accounts/${account._id}/toggle`);
        toast.success(`${account.houseName || account.email} activated`);
        fetchAccounts();
      } catch {
        toast.error('Failed to activate');
      }
    }
  };

  const handleConfirmSuspend = async () => {
    try {
      await api.patch(`/superadmin/accounts/${confirm.account._id}/toggle`);
      toast.success(`${confirm.account.houseName || confirm.account.email} suspended`);
      setConfirm(null);
      fetchAccounts();
    } catch {
      toast.error('Failed to suspend');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await api.delete(`/superadmin/accounts/${confirm.account._id}`);
      toast.success(`Account deleted`);
      setConfirm(null);
      fetchAccounts();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleRemind = async (id) => {
    setRemindingId(id);
    try {
      const res = await api.post(`/superadmin/accounts/${id}/remind`);
      toast.success(res.data.message);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send reminder');
    } finally {
      setRemindingId(null);
    }
  };

  const filtered = accounts.filter(a => {
    const matchSearch = !search ||
      a.houseName?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.caretakerName?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'active' && a.isActive) || (filter === 'suspended' && !a.isActive);
    return matchSearch && matchFilter;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">House Accounts</h1>
          <p className="text-slate-500 text-sm mt-1">{accounts.length} total accounts</p>
        </div>
        <button
          onClick={() => { setEditAccount(null); setShowModal(true); }}
          className="btn-primary flex items-center gap-2 bg-violet-600 hover:bg-violet-500"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Account
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5 flex-col sm:flex-row">
        <input
          className="input-field flex-1"
          placeholder="Search by house name, email or caretaker..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="flex gap-2">
          {['all', 'active', 'suspended'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2.5 rounded-xl font-display font-medium text-sm capitalize transition-all border ${
                filter === f
                  ? 'bg-violet-500/20 text-violet-400 border-violet-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <svg className="w-8 h-8 animate-spin text-violet-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">🏘️</div>
          <p className="font-display font-medium text-slate-400">
            {search || filter !== 'all' ? 'No accounts match your filters' : 'No accounts yet'}
          </p>
          <p className="text-slate-600 text-sm mt-1">
            {!search && filter === 'all' && 'Click "Add Account" to onboard your first property'}
          </p>
        </div>
      ) : (
        <div ref={listRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(account => (
            <AccountCard
              key={account._id}
              account={account}
              onEdit={a => { setEditAccount(a); setShowModal(true); }}
              onToggle={handleToggle}
              onDelete={a => setConfirm({ type: 'delete', account: a })}
              onRemind={handleRemind}
              remindingId={remindingId}
            />
          ))}
        </div>
      )}

      {/* Add/Edit modal */}
      {showModal && (
        <AccountModal
          initial={editAccount}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditAccount(null); }}
          saving={saving}
        />
      )}

      {/* Confirm dialogs */}
      {confirm?.type === 'suspend' && (
        <ConfirmDialog
          message={`Suspend ${confirm.account.houseName || confirm.account.email}?`}
          subMessage="The caretaker will not be able to log in until reactivated."
          confirmLabel="Yes, Suspend"
          confirmClass="bg-amber-600 hover:bg-amber-500 text-white"
          onConfirm={handleConfirmSuspend}
          onCancel={() => setConfirm(null)}
        />
      )}
      {confirm?.type === 'delete' && (
        <ConfirmDialog
          message={`Permanently delete ${confirm.account.houseName || confirm.account.email}?`}
          subMessage="This cannot be undone. All data for this account will be hidden."
          confirmLabel="Yes, Delete"
          confirmClass="bg-red-600 hover:bg-red-500 text-white"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
