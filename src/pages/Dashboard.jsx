import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { listAccounts, listPlans } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/Spinner.jsx';
import StatusBadge from '../components/StatusBadge.jsx';

const STATUSES = ['PROPOSED', 'IN_PROGRESS', 'SUSPENDED', 'COMPLETED', 'ABANDONED'];

export default function Dashboard() {
  const [accounts, setAccounts] = useState([]);
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const navigate = useNavigate();
  const toast    = useToast();

  useEffect(() => {
    Promise.all([listAccounts(), listPlans()])
      .then(([accs, ps]) => { setAccounts(accs); setPlans(ps); })
      .catch(e => toast(e?.response?.data?.message || e.message, 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const poolAccounts = accounts.filter(a => a.kind === 'POOL');
  const alerts       = poolAccounts.filter(a => a.overConsumed || a.balance < 0);
  const statusCounts = STATUSES.reduce((m, s) => ({ ...m, [s]: plans.filter(p => p.status === s).length }), {});

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 0 }}>Dashboard</h1>
        <span className="muted">Resource Planning Ledger</span>
      </div>

      {/* Alert banner */}
      {alerts.length > 0 && (
        <div className="error-box" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <span className="alert-indicator" />
          <strong>{alerts.length} pool account{alerts.length !== 1 ? 's' : ''} over-consumed:</strong>
          <span className="muted">
            {alerts.map(a => `${a.name} (${Number(a.balance).toFixed(4)})`).join(', ')}
          </span>
        </div>
      )}

      {/* Plan status counts */}
      <h2>Plans by Status</h2>
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {STATUSES.map(s => (
          <div key={s} className="card stat-card">
            <div className="stat-label">{s.replace('_', ' ')}</div>
            <div className="stat-value">{statusCounts[s]}</div>
          </div>
        ))}
      </div>

      {/* Summary counts */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        <div className="card stat-card">
          <div className="stat-label">Total Plans</div>
          <div className="stat-value">{plans.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Pool Accounts</div>
          <div className="stat-value">{poolAccounts.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Pending Alerts</div>
          <div className={`stat-value${alerts.length > 0 ? ' amount-neg' : ''}`}>{alerts.length}</div>
        </div>
      </div>

      {/* Pool balances table */}
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <h2 style={{ marginBottom: 0 }}>Pool Account Balances</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/ledger')}>View Ledger →</button>
      </div>
      {poolAccounts.length === 0 ? (
        <p className="muted">No pool accounts yet.</p>
      ) : (
        <div className="card" style={{ padding: 0, marginBottom: 24 }}>
          <table>
            <thead>
              <tr><th>Account</th><th>Balance</th><th>Status</th></tr>
            </thead>
            <tbody>
              {poolAccounts.map(a => (
                <tr key={a.id} style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/ledger?accountId=${a.id}`)}>
                  <td style={{ color: 'var(--primary)', fontWeight: 500 }}>{a.name}</td>
                  <td className={a.balance < 0 ? 'amount-neg' : 'amount-pos'}>
                    {Number(a.balance).toFixed(4)}
                  </td>
                  <td>
                    {(a.overConsumed || a.balance < 0)
                      ? <span className="badge badge-ABANDONED" style={{ fontSize: 10 }}>ALERT</span>
                      : <span className="badge badge-COMPLETED" style={{ fontSize: 10 }}>OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Recent plans */}
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <h2 style={{ marginBottom: 0 }}>Recent Plans</h2>
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/plans')}>All Plans →</button>
      </div>
      {plans.length === 0 ? (
        <p className="muted">No plans yet.</p>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr><th>Name</th><th>Status</th></tr>
            </thead>
            <tbody>
              {plans.slice(0, 10).map(p => (
                <tr key={p.id} style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/plans/${p.id}`)}>
                  <td style={{ color: 'var(--primary)', fontWeight: 500 }}>{p.name}</td>
                  <td><StatusBadge status={p.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
