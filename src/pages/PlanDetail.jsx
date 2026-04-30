import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPlan, addChildNode, getPlanReport } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner     from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import PlanTree    from '../components/PlanTree.jsx';

function ReportModal({ planId, onClose }) {
  const [rows,    setRows]    = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    getPlanReport(planId)
      .then(setRows)
      .catch(e => toast(e?.response?.data?.message || e.message, 'error'))
      .finally(() => setLoading(false));
  }, [planId]);

  function statusColor(s) {
    if (s === 'COMPLETED')   return '#15803d';
    if (s === 'IN_PROGRESS') return '#1d4ed8';
    if (s === 'SUSPENDED')   return '#92400e';
    if (s === 'ABANDONED')   return '#991b1b';
    return '#374151';
  }

  const lines = rows.map(r => {
    const indent = '  '.repeat(r.depth);
    const type   = r.type === 'PLAN' ? '📁' : '📌';
    const allocs = r.allocations
      ? Object.entries(r.allocations).map(([k, v]) => `${k}: ${v}`).join(', ')
      : '';
    return `${indent}${type} ${r.name}  [${r.status}]${allocs ? `  {${allocs}}` : ''}`;
  }).join('\n');

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 700 }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <h2 style={{ marginBottom: 0 }}>Plan Report</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close ×</button>
        </div>
        {loading ? <Spinner /> : (
          rows.length === 0
            ? <p className="muted">No nodes in this plan.</p>
            : <pre className="report-pre">{lines}</pre>
        )}
      </div>
    </div>
  );
}

export default function PlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast    = useToast();

  const [plan,      setPlan]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [selected,  setSelected]  = useState(null);
  const [showReport, setShowReport] = useState(false);

  // Add child form
  const [childName, setChildName] = useState('');
  const [childType, setChildType] = useState('ACTION');
  const [adding,    setAdding]    = useState(false);
  const [childErr,  setChildErr]  = useState('');

  function load() {
    setLoading(true);
    getPlan(id)
      .then(setPlan)
      .catch(e => toast(e?.response?.data?.message || e.message, 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  const targetId   = selected?.type === 'PLAN' ? selected.id : (plan?.id ?? null);
  const targetName = selected?.type === 'PLAN' ? selected.name : plan?.name;

  async function handleAddChild(e) {
    e.preventDefault();
    if (!childName.trim()) { setChildErr('Name is required'); return; }
    if (!targetId) return;
    setAdding(true); setChildErr('');
    try {
      await addChildNode(targetId, { name: childName.trim(), type: childType });
      toast(`${childType === 'PLAN' ? 'Sub-plan' : 'Action'} "${childName.trim()}" added`, 'success');
      setChildName('');
      load();
    } catch (err) {
      toast(err?.response?.data?.message || err.message, 'error');
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <Spinner />;
  if (!plan)   return <p className="muted">Plan not found.</p>;

  return (
    <div>
      <div className="flex items-center gap-12" style={{ marginBottom: 20 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/plans')}>← Plans</button>
        <h1 style={{ marginBottom: 0 }}>{plan.name}</h1>
        <StatusBadge status={plan.status} />
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}
          onClick={() => setShowReport(true)}>
          📄 View Report
        </button>
      </div>

      <div className="grid-2">
        {/* Tree */}
        <div className="card">
          <h2>Plan Tree</h2>
          <p className="muted" style={{ marginBottom: 12, fontSize: 12 }}>
            Click a node to select it. Action nodes open their detail page.
          </p>
          <PlanTree plan={plan} selectedId={selected?.id} onSelect={setSelected} />
        </div>

        {/* Right panel */}
        <div>
          {/* Selected node info */}
          {selected && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                <h3 style={{ marginBottom: 0 }}>{selected.name}</h3>
                <StatusBadge status={selected.status} />
              </div>
              <p className="muted" style={{ marginBottom: 8 }}>Type: {selected.type}</p>
              {selected.dependsOn && (
                <p className="muted" style={{ marginBottom: 8, fontSize: 12 }}>
                  Depends on: {selected.dependsOn.split(',').map(d => (
                    <span key={d} className="tag" style={{ margin: '1px 3px' }}>{d.trim()}</span>
                  ))}
                </p>
              )}
              {selected.legalTransitions?.length > 0 && (
                <div>
                  <p className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Legal transitions:</p>
                  <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                    {selected.legalTransitions.map(t => (
                      <span key={t} className="tag">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {selected.type === 'ACTION' && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }}
                  onClick={() => navigate(`/actions/${selected.id}`)}>
                  Open Action Detail →
                </button>
              )}
            </div>
          )}

          {/* Add child form */}
          <div className="card">
            <h3 style={{ marginBottom: 4 }}>Add Node</h3>
            <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Adding to: <strong>{targetName}</strong>
              {selected && selected.type !== 'PLAN' && (
                <span> (select a plan node to nest deeper)</span>
              )}
            </p>
            <form onSubmit={handleAddChild}>
              <div className="form-row">
                <label>Name *</label>
                <input value={childName}
                  onChange={e => { setChildName(e.target.value); setChildErr(''); }}
                  className={childErr ? 'invalid' : ''}
                  placeholder="e.g. Excavation Phase" />
                {childErr && <div className="field-error">{childErr}</div>}
              </div>
              <div className="form-row">
                <label>Type</label>
                <select value={childType} onChange={e => setChildType(e.target.value)}>
                  <option value="ACTION">Action (leaf)</option>
                  <option value="PLAN">Sub-Plan (composite)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary btn-sm"
                disabled={adding || !childName.trim()}>
                {adding ? 'Adding…' : '+ Add Node'}
              </button>
            </form>
          </div>

          {plan.targetStartDate && (
            <div className="card" style={{ marginTop: 16 }}>
              <h3>Target Start Date</h3>
              <p style={{ marginTop: 4 }}>{plan.targetStartDate}</p>
            </div>
          )}
        </div>
      </div>

      {showReport && (
        <ReportModal planId={id} onClose={() => setShowReport(false)} />
      )}
    </div>
  );
}
