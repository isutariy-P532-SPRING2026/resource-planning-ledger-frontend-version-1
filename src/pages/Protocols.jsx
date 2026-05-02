import { useEffect, useState } from 'react';
import { listProtocols, createProtocol, updateProtocol, deleteProtocol } from '../api.js';
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

/* ── Step builder ────────────────────────────────────────────────────────────── */
function StepBuilder({ steps, protocols, onChange }) {
  function add() {
    onChange([...steps, { name: '', subProtocolId: '', dependsOn: [] }]);
  }
  function remove(i) { onChange(steps.filter((_, idx) => idx !== i)); }
  function update(i, field, val) {
    onChange(steps.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  }
  function toggleDep(stepIdx, depName) {
    const cur  = steps[stepIdx].dependsOn;
    const next = cur.includes(depName) ? cur.filter(d => d !== depName) : [...cur, depName];
    update(stepIdx, 'dependsOn', next);
  }

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
        <div className="section-header" style={{ margin: 0 }}>Steps</div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={add}>+ Add Step</button>
      </div>
      {steps.length === 0 && <p className="muted" style={{ marginBottom: 8 }}>No steps — click "+ Add Step" to begin.</p>}
      {steps.map((step, i) => {
        const eligible = steps.slice(0, i).map(s => s.name).filter(n => n.trim());
        return (
          <div key={i} className="step-block">
            <div className="step-block-header">
              <span style={{ fontWeight: 600, fontSize: 13 }}>Step {i + 1}</span>
              <button type="button" className="btn btn-ghost btn-sm"
                style={{ color: 'var(--danger)' }} onClick={() => remove(i)}>Remove</button>
            </div>
            <div className="form-row">
              <label>Step Name *</label>
              <input value={step.name} onChange={e => update(i, 'name', e.target.value)}
                placeholder="e.g. Prepare Materials" />
            </div>
            <div className="form-row">
              <label>Sub-Protocol (optional)</label>
              <select value={step.subProtocolId} onChange={e => update(i, 'subProtocolId', e.target.value)}>
                <option value="">— none —</option>
                {protocols.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {eligible.length > 0 && (
              <div className="form-row">
                <label>Depends On</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                  {eligible.map(dep => (
                    <label key={dep} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 13 }}>
                      <input type="checkbox"
                        checked={step.dependsOn.includes(dep)}
                        onChange={() => toggleDep(i, dep)} />
                      {dep}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Create / Edit modal ─────────────────────────────────────────────────────── */
function ProtocolModal({ initial, allProtocols, onClose, onSaved }) {
  const isEdit = !!initial;
  const [name,  setName]  = useState(initial?.name  || '');
  const [desc,  setDesc]  = useState(initial?.description || '');
  const [steps, setSteps] = useState(
    initial?.steps?.map(s => ({
      name:          s.name,
      subProtocolId: s.subProtocolId ? String(s.subProtocolId) : '',
      dependsOn:     s.dependsOn ? s.dependsOn.split(',').map(d => d.trim()).filter(Boolean) : [],
    })) || []
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const toast = useToast();

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    const unnamed = steps.findIndex(s => !s.name.trim());
    if (unnamed !== -1) e.steps = `Step ${unnamed + 1} has no name`;
    return e;
  }

  async function submit(ev) {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: desc.trim() || null,
        steps: steps.map(s => ({
          name:          s.name.trim(),
          subProtocolId: s.subProtocolId ? Number(s.subProtocolId) : null,
          dependsOn:     s.dependsOn.length ? s.dependsOn.join(',') : null,
        })),
      };
      const result = isEdit
        ? await updateProtocol(initial.id, payload)
        : await createProtocol(payload);
      toast(`Protocol ${isEdit ? 'updated' : 'created'}`, 'success');
      onSaved(result);
    } catch (e) { toast(err(e), 'error'); }
    finally { setSaving(false); }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
        <h2>{isEdit ? 'Edit Protocol' : 'Create Protocol'}</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Name *</label>
            <input value={name}
              onChange={e => { setName(e.target.value); setErrors(x => ({ ...x, name: '' })); }}
              className={errors.name ? 'invalid' : ''} />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="form-row">
            <label>Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          {errors.steps && <div className="field-error" style={{ marginBottom: 8 }}>{errors.steps}</div>}
          <StepBuilder steps={steps} protocols={allProtocols.filter(p => p.id !== initial?.id)} onChange={setSteps} />
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !name.trim()}>
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Steps expand panel ──────────────────────────────────────────────────────── */
function ProtocolSteps({ steps }) {
  if (!steps?.length) return <p className="muted" style={{ marginTop: 8 }}>No steps defined.</p>;
  return (
    <table style={{ marginTop: 10 }}>
      <thead>
        <tr><th>#</th><th>Name</th><th>Sub-Protocol</th><th>Depends On</th></tr>
      </thead>
      <tbody>
        {steps.map(s => (
          <tr key={s.id}>
            <td className="muted">{s.stepOrder + 1}</td>
            <td style={{ fontWeight: 500 }}>{s.name}</td>
            <td className="muted">{s.subProtocolName || '—'}</td>
            <td className="muted">
              {s.dependsOn
                ? s.dependsOn.split(',').map(d => <span key={d} className="tag" style={{ margin: '1px 2px' }}>{d.trim()}</span>)
                : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────────── */
export default function Protocols() {
  const [protocols,  setProtocols]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [modal,      setModal]      = useState(null); // null | { mode: 'create'|'edit', protocol? }
  const [confirm,    setConfirm]    = useState(null); // null | protocol
  const [deleting,   setDeleting]   = useState(false);
  const toast = useToast();

  function load() {
    listProtocols()
      .then(setProtocols)
      .catch(e => toast(err(e), 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleDelete() {
    if (!confirm) return;
    setDeleting(true);
    try {
      await deleteProtocol(confirm.id);
      toast(`Protocol "${confirm.name}" deleted`, 'success');
      setProtocols(ps => ps.filter(p => p.id !== confirm.id));
      if (expandedId === confirm.id) setExpandedId(null);
    } catch (e) { toast(err(e), 'error'); }
    finally { setDeleting(false); setConfirm(null); }
  }

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 0 }}>Protocols</h1>
        <button className="btn btn-primary" onClick={() => setModal({ mode: 'create' })}>
          + New Protocol
        </button>
      </div>

      {protocols.length === 0 ? (
        <div className="card"><p className="muted">No protocols yet.</p></div>
      ) : (
        protocols.map(p => (
          <div key={p.id} className="card" style={{ marginBottom: 10 }}>
            <div className="flex items-center justify-between">
              {/* Name + expand */}
              <div style={{ flex: 1, cursor: 'pointer' }}
                onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                {p.description && (
                  <span className="muted" style={{ marginLeft: 12 }}>{p.description}</span>
                )}
              </div>
              {/* Actions */}
              <div className="flex items-center gap-8">
                <span className="muted" style={{ fontSize: 12 }}>
                  {p.steps?.length ?? 0} step{p.steps?.length !== 1 ? 's' : ''}
                </span>
                <button className="btn btn-ghost btn-sm"
                  onClick={e => { e.stopPropagation(); setModal({ mode: 'edit', protocol: p }); }}>
                  Edit
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger)' }}
                  onClick={e => { e.stopPropagation(); setConfirm(p); }}>
                  Delete
                </button>
                <span style={{ color: 'var(--muted)', fontSize: 11 }}>
                  {expandedId === p.id ? '▾' : '▸'}
                </span>
              </div>
            </div>

            {expandedId === p.id && (
              <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
                <ProtocolSteps steps={p.steps} />
              </div>
            )}
          </div>
        ))
      )}

      {modal && (
        <ProtocolModal
          initial={modal.mode === 'edit' ? modal.protocol : null}
          allProtocols={protocols}
          onClose={() => setModal(null)}
          onSaved={result => {
            if (modal.mode === 'create') setProtocols(ps => [result, ...ps]);
            else setProtocols(ps => ps.map(p => p.id === result.id ? result : p));
            setModal(null);
          }}
        />
      )}

      {confirm && (
        <ConfirmModal
          title="Delete Protocol"
          message={`Delete "${confirm.name}"? This cannot be undone.`}
          loading={deleting}
          onConfirm={handleDelete}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
