import { useEffect, useState } from 'react';
import { listAuditLog } from '../api.js';
import { useToast } from '../context/ToastContext.jsx';
import Spinner from '../components/Spinner.jsx';

function err(e) {
  const d = e?.response?.data;
  if (typeof d === 'string') return d;
  if (d?.message) return d.message;
  if (d?.error)   return d.error;
  return e?.message || 'An unexpected error occurred';
}

const EVENT_COLOR = {
  IMPLEMENT:            '#1d4ed8',
  SUSPEND:              '#92400e',
  RESUME:               '#0e7490',
  COMPLETE:             '#15803d',
  ABANDON:              '#991b1b',
  TRANSACTION_POSTED:   '#374151',
  ENTRY_POSTED:         '#374151',
  DEPOSIT:              '#0e7490',
  OVER_CONSUMPTION_ALERT: '#dc2626',
};

/* Parses "debit: POOL-X -3 | credit: USAGE-X +3 | sum: 0" into structured parts. */
function parseTxDetails(details) {
  if (!details) return null;
  const debitMatch  = details.match(/debit:\s*([^\s]+)\s+([^\s|]+)/);
  const creditMatch = details.match(/credit:\s*([^\s]+)\s+\+?([^\s|]+)/);
  const sumMatch    = details.match(/sum:\s*([^\s]+)/);
  if (!debitMatch || !creditMatch) return null;
  return {
    debitAccount:  debitMatch[1],
    debitAmount:   debitMatch[2],
    creditAccount: creditMatch[1],
    creditAmount:  creditMatch[2],
    sum:           sumMatch ? sumMatch[1] : null,
  };
}

function TxDetailsCell({ event, details }) {
  if (event === 'TRANSACTION_POSTED') {
    const parts = parseTxDetails(details);
    if (parts) {
      return (
        <td style={{ fontSize: 12 }}>
          <span style={{ color: 'var(--danger, #dc2626)', fontFamily: 'monospace' }}>
            {parts.debitAccount} {parts.debitAmount}
          </span>
          <span style={{ margin: '0 6px', color: '#6b7280' }}>→</span>
          <span style={{ color: 'var(--success, #15803d)', fontFamily: 'monospace' }}>
            {parts.creditAccount} +{parts.creditAmount}
          </span>
          {parts.sum !== null && (
            <span style={{
              marginLeft: 10, fontSize: 11, fontWeight: 700,
              color: parts.sum === '0' || parts.sum === '0.0000' ? '#15803d' : '#dc2626',
            }}>
              Σ={parts.sum}
            </span>
          )}
        </td>
      );
    }
  }
  return (
    <td className="muted" style={{ fontSize: 12 }}>{details || '—'}</td>
  );
}

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

  // Group consecutive rows by actionId for alternating band background
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
                <th>Tx ID</th>
                <th>Account ID</th>
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
                  <td className="mono">{e.actionId      ?? '—'}</td>
                  <td className="mono">{e.transactionId ?? '—'}</td>
                  <td className="mono">{e.accountId     ?? '—'}</td>
                  <TxDetailsCell event={e.event} details={e.details} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
