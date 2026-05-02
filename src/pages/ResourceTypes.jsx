import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { listResourceTypes, createResourceType, updateResourceType, deleteResourceType, depositToAccount } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner      from '../components/Spinner.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';

function err(e) {
  const d = e?.response?.data;
  if (typeof d === 'string') return d;
  if (d?.message) return d.message;
  if (d?.error)   return d.error;
  return e?.message || 'An unexpected error occurred';
}

/* ── Add Stock modal ─────────────────────────────────────────────────────────── */
function AddStockModal({ rt, onClose, onDone }) {
  const [amount, setAmount] = useState('');
  const [desc,   setDesc]   = useState('Initial stock deposit');
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const toast = useToast();

  async function submit(e) {
    e.preventDefault();
    const qty = parseFloat(amount);
    if (!amount || isNaN(qty) || qty <= 0) { setError('Enter a positive quantity'); return; }
    setSaving(true);
    try {
      await depositToAccount(rt.poolAccountId, { amount: qty, description: desc || 'Stock deposit' });
      toast(`Added ${qty} ${rt.unitOfMeasure} to ${rt.poolAccountName}`, 'success');
      onDone();
    } catch (ex) { toast(err(ex), 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add Stock to {rt.name}</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Pool account: <strong>{rt.poolAccountName || '—'}</strong> · Unit: {rt.unitOfMeasure}
        </p>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Quantity *</label>
            <input type="number" step="any" min="0.0001" value={amount}
              onChange={e => { setAmount(e.target.value); setError(''); }}
              className={error ? 'invalid' : ''}
              placeholder={`e.g. 100 ${rt.unitOfMeasure}`} autoFocus />
            {error && <div className="field-error">{error}</div>}
          </div>
          <div className="form-row">
            <label>Description (optional)</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Depositing…' : 'Add Stock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Create / Edit modal ─────────────────────────────────────────────────────── */
function ResourceTypeModal({ initial, onClose, onSaved }) {
  const isEdit = !!initial;
  const [name,     setName]     = useState(initial?.name || '');
  const [kind,     setKind]     = useState(initial?.kind || 'CONSUMABLE');
  const [unit,     setUnit]     = useState(initial?.unitOfMeasure || '');
  const [initQty,  setInitQty]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [errors,   setErrors]   = useState({});
  const toast = useToast();

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    if (!unit.trim()) e.unit = 'Unit of measure is required';
    const qty = parseFloat(initQty);
    if (initQty !== '' && (isNaN(qty) || qty < 0)) e.initQty = 'Must be a non-negative number';
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), kind, unitOfMeasure: unit.trim() };
      const result  = isEdit
        ? await updateResourceType(initial.id, payload)
        : await createResourceType(payload);

      // If an initial stock quantity was entered, deposit it immediately
      const qty = parseFloat(initQty);
      if (!isEdit && qty > 0 && result.poolAccountId) {
        await depositToAccount(result.poolAccountId, {
          amount: qty,
          description: 'Initial stock deposit',
        });
      }

      toast(`Resource type ${isEdit ? 'updated' : 'created'}`, 'success');
      onSaved(result);
    } catch (e) { toast(err(e), 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit Resource Type' : 'Create Resource Type'}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Name *</label>
            <input value={name}
              onChange={e => { setName(e.target.value); setErrors(x => ({ ...x, name: '' })); }}
              className={errors.name ? 'invalid' : ''} />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="form-row">
            <label>Kind</label>
            {isEdit ? (
              <input value={kind} disabled style={{ background: 'var(--bg)', color: 'var(--muted)' }} />
            ) : (
              <select value={kind} onChange={e => setKind(e.target.value)}>
                <option value="CONSUMABLE">CONSUMABLE</option>
                <option value="ASSET">ASSET</option>
              </select>
            )}
            {isEdit && <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>Kind cannot be changed after creation.</div>}
          </div>
          <div className="form-row">
            <label>Unit of Measure *</label>
            <input value={unit}
              onChange={e => { setUnit(e.target.value); setErrors(x => ({ ...x, unit: '' })); }}
              className={errors.unit ? 'invalid' : ''}
              placeholder="e.g. kg, hours, units" />
            {errors.unit && <div className="field-error">{errors.unit}</div>}
          </div>
          {!isEdit && (
            <div className="form-row">
              <label>Initial Stock (optional)</label>
              <input type="number" step="any" min="0" value={initQty}
                onChange={e => { setInitQty(e.target.value); setErrors(x => ({ ...x, initQty: '' })); }}
                className={errors.initQty ? 'invalid' : ''}
                placeholder={`e.g. 100${unit ? ' ' + unit.trim() : ''}`} />
              {errors.initQty
                ? <div className="field-error">{errors.initQty}</div>
                : <div className="muted" style={{ fontSize: 11, marginTop: 3 }}>
                    Deposited into the pool account right after creation. Leave blank to add later.
                  </div>
              }
            </div>
          )}
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function ResourceTypes() {
  const [types,      setTypes]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null); // null | { mode, rt? }
  const [stockModal, setStockModal] = useState(null); // null | rt
  const [confirm,    setConfirm]    = useState(null);
  const [deleting,   setDeleting]   = useState(false);
  const toast = useToast();

  function load() {
    listResourceTypes()
      .then(setTypes)
      .catch(e => toast(err(e), 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteResourceType(confirm.id);
      toast(`Resource type "${confirm.name}" deleted`, 'success');
      setTypes(ts => ts.filter(t => t.id !== confirm.id));
    } catch (e) { toast(err(e), 'error'); }
    finally { setDeleting(false); setConfirm(null); }
  }

  if (loading) return <Spinner />;

  const consumable = types.filter(t => t.kind === 'CONSUMABLE');
  const assets     = types.filter(t => t.kind === 'ASSET');

  function renderTable(list) {
    if (!list.length) return <p className="muted" style={{ marginBottom: 16 }}>None yet.</p>;
    return (
      <div className="card" style={{ padding: 0, marginBottom: 20 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Unit of Measure</th>
              <th>Pool Account</th>
              <th style={{ width: 130 }}></th>
            </tr>
          </thead>
          <tbody>
            {list.map(rt => (
              <tr key={rt.id}>
                <td style={{ fontWeight: 500 }}>{rt.name}</td>
                <td className="muted">{rt.unitOfMeasure}</td>
                <td>
                    {rt.poolAccountId
                      ? <Link to={`/ledger?accountId=${rt.poolAccountId}`}
                              style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>
                          {rt.poolAccountName}
                        </Link>
                      : <span className="muted">—</span>
                    }
                  </td>
                <td>
                  <div className="flex gap-8">
                    {rt.poolAccountId && (
                      <button className="btn btn-primary btn-sm"
                        onClick={() => setStockModal(rt)}>
                        + Add Stock
                      </button>
                    )}
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => setModal({ mode: 'edit', rt })}>Edit</button>
                    <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                      onClick={() => setConfirm(rt)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 0 }}>Resource Types</h1>
        <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}>
          + New Resource Type
        </button>
      </div>

      <h2>Consumable Resources</h2>
      {renderTable(consumable)}

      <h2>Asset Resources</h2>
      {renderTable(assets)}

      {modal && (
        <ResourceTypeModal
          initial={modal.mode === 'edit' ? modal.rt : null}
          onClose={() => setModal(null)}
          onSaved={result => {
            if (modal.mode === 'create') setTypes(ts => [result, ...ts]);
            else setTypes(ts => ts.map(t => t.id === result.id ? result : t));
            setModal(null);
          }}
        />
      )}

      {stockModal && (
        <AddStockModal
          rt={stockModal}
          onClose={() => setStockModal(null)}
          onDone={() => setStockModal(null)}
        />
      )}

      {confirm && (
        <ConfirmModal
          title="Delete Resource Type"
          message={`Delete "${confirm.name}"? Any existing allocations referencing this type may be affected.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
