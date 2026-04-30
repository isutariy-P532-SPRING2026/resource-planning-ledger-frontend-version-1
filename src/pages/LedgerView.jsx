import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listAccounts, getEntries } from '../api.js';
import Spinner  from '../components/Spinner.jsx';
import ErrorBox from '../components/ErrorBox.jsx';

export default function LedgerView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initId = searchParams.get('accountId') ? Number(searchParams.get('accountId')) : null;

  // AccountDto has { id, name, kind, balance, overConsumed } — balance comes free with the list
  const [accounts,   setAccounts]   = useState([]);
  const [selectedId, setSelectedId] = useState(initId);
  const [entries,    setEntries]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [loadingEnt, setLoadingEnt] = useState(false);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    listAccounts()
      .then(setAccounts)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingEnt(true);
    getEntries(selectedId)
      .then(setEntries)
      .catch(setError)
      .finally(() => setLoadingEnt(false));
  }, [selectedId]);

  function selectAccount(id) {
    setSelectedId(id);
    setSearchParams({ accountId: id });
  }

  const poolAccounts  = accounts.filter(a => a.kind === 'POOL');
  const usageAccounts = accounts.filter(a => a.kind === 'USAGE');
  const selectedAcc   = accounts.find(a => a.id === selectedId);
  const balance       = selectedAcc?.balance ?? null;

  if (loading) return <Spinner />;

  return (
    <>
      <h1>Ledger</h1>
      <ErrorBox error={error} />

      <div className="grid-2">
        {/* Account list */}
        <div>
          {[['Pool Accounts', poolAccounts], ['Usage Accounts', usageAccounts]].map(([label, list]) => (
            <div key={label} className="card">
              <h2>{label}</h2>
              {list.length === 0
                ? <p className="muted">None yet.</p>
                : list.map(a => (
                  <div
                    key={a.id}
                    onClick={() => selectAccount(a.id)}
                    style={{
                      padding: '7px 10px', borderRadius: 4, cursor: 'pointer',
                      background: a.id === selectedId ? '#eff6ff' : 'transparent',
                      color: a.id === selectedId ? 'var(--primary)' : 'var(--text)',
                      fontWeight: a.id === selectedId ? 600 : 400,
                    }}
                  >
                    {a.name}
                  </div>
                ))
              }
            </div>
          ))}
        </div>

        {/* Entries panel */}
        <div>
          {!selectedId
            ? <div className="card"><p className="muted">Select an account to view entries.</p></div>
            : (
              <div className="card">
                <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
                  <h2 style={{ marginBottom: 0 }}>{selectedAcc?.name}</h2>
                  {balance !== null && (
                    <span style={{ fontSize: 18, fontWeight: 700 }}
                      className={balance < 0 ? 'amount-neg' : 'amount-pos'}>
                      {Number(balance).toFixed(4)}
                    </span>
                  )}
                </div>

                {loadingEnt ? <Spinner /> : entries.length === 0
                  ? <p className="muted">No entries yet.</p>
                  : (
                    <table>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th style={{ textAlign: 'right' }}>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map((e, i) => (
                          <tr key={e.id ?? i}>
                            <td className="mono muted">
                              {e.bookedAt ? new Date(e.bookedAt).toLocaleDateString() : '—'}
                            </td>
                            <td>{e.description || '—'}</td>
                            <td style={{ textAlign: 'right' }}
                              className={e.amount < 0 ? 'amount-neg' : 'amount-pos'}>
                              {Number(e.amount).toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )
                }
              </div>
            )
          }
        </div>
      </div>
    </>
  );
}
