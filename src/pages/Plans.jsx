import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listPlans, createPlan, listProtocols } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner    from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

function CreatePlanModal({ onClose, onCreated }) {
  const [name,       setName]       = useState('');
  const [protocolId, setProtocolId] = useState('');
  const [startDate,  setStartDate]  = useState('');
  const [protocols,  setProtocols]  = useState([]);
  const [saving,     setSaving]     = useState(false);
  const [errors,     setErrors]     = useState({});
  const toast = useToast();

  useEffect(() => {
    listProtocols().then(setProtocols).catch(() => {});
  }, []);

  function validate() {
    const e = {};
    if (!name.trim()) e.name = 'Name is required';
    return e;
  }

  async function submit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const plan = await createPlan({
        name: name.trim(),
        sourceProtocolId: protocolId ? Number(protocolId) : null,
        targetStartDate:  startDate || null,
      });
      toast('Plan created successfully', 'success');
      onCreated(plan);
    } catch (err) {
      toast(err?.response?.data?.message || err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Create Plan</h2>
        <form onSubmit={submit}>
          <div className="form-row">
            <label>Name *</label>
            <input value={name} onChange={e => { setName(e.target.value); setErrors(x => ({ ...x, name: '' })); }}
              className={errors.name ? 'invalid' : ''} />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>
          <div className="form-row">
            <label>Source Protocol (optional)</label>
            <select value={protocolId} onChange={e => setProtocolId(e.target.value)}>
              <option value="">— scratch plan (no protocol) —</option>
              {protocols.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <label>Target Start Date (optional)</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Plans() {
  const [plans,     setPlans]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const toast    = useToast();

  function load() {
    setLoading(true);
    listPlans()
      .then(setPlans)
      .catch(e => toast(e?.response?.data?.message || e.message, 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 0 }}>Plans</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Plan</button>
      </div>

      {plans.length === 0 ? (
        <div className="card">
          <p className="muted">No plans yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Target Start</th>
                <th style={{ width: 100 }}></th>
              </tr>
            </thead>
            <tbody>
              {plans.map(p => (
                <tr key={p.id}>
                  <td style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 500 }}
                    onClick={() => navigate(`/plans/${p.id}`)}>
                    {p.name}
                  </td>
                  <td><StatusBadge status={p.status} /></td>
                  <td className="muted">{p.targetStartDate || '—'}</td>
                  <td>
                    <button className="btn btn-ghost btn-sm"
                      onClick={() => navigate(`/plans/${p.id}`)}>
                      Open →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CreatePlanModal
          onClose={() => setShowModal(false)}
          onCreated={plan => {
            setShowModal(false);
            navigate(`/plans/${plan.id}`);
          }}
        />
      )}
    </div>
  );
}
