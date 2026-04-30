import { useEffect, useState } from 'react';
import { listAuditLog } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/Spinner.jsx';

function err(e) { return e?.response?.data?.message || e?.response?.data || e.message || 'Error'; }

const EVENT_COLOR = {
  IMPLEMENT:       '#1d4ed8',
  SUSPEND:         '#92400e',
  RESUME:          '#0e7490',
  COMPLETE:        '#15803d',
  ABANDON:         '#991b1b',
  ENTRY_POSTED:    '#374151',
  DEPOSIT:         '#0e7490',
};

export default function AuditLog() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  function load() {
    setLoading(true);
    listAuditLog()
      .then(setEntries)
      .catch(e => toast(err(e), 'error'))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (loading) return <Spinner />;

  // Compute alternating group bands by actionId so related entries are visually grouped
  const groupBands = (() => {
    const bands = [];
    let band = 0;
    let prevKey = undefined;
    for (const e of entries) {
      const key = e.actionId ?? `null-${e.id}`;
      if (key !== prevKey) { band = 1 - band; prevKey = key; }
      bands.push(band);
    }
    return bands;
  })();

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
        <h1 style={{ marginBottom: 0 }}>Audit Log</h1>
        <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
      </div>

      {entries.length === 0 ? (
        <div className="card"><p className="muted">No audit entries yet.</p></div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event</th>
                <th>Action ID</th>
                <th>Account ID</th>
                <th>Entry ID</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.id ?? i}
                  style={{ background: groupBands[i] === 1 ? 'var(--bg)' : 'transparent' }}>
                  <td className="mono muted" style={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                    {e.timestamp ? new Date(e.timestamp).toLocaleString() : '—'}
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: EVENT_COLOR[e.event] || 'var(--text)',
                      fontSize: 12,
                    }}>
                      {e.event}
                    </span>
                  </td>
                  <td className="mono">{e.actionId  ?? '—'}</td>
                  <td className="mono">{e.accountId ?? '—'}</td>
                  <td className="mono">{e.entryId   ?? '—'}</td>
                  <td className="muted" style={{ fontSize: 12 }}>{e.details || e.detail || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
