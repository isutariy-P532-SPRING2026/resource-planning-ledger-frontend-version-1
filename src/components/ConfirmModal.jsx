/**
 * Reusable confirmation dialog for destructive actions.
 * Usage:
 *   <ConfirmModal
 *     title="Delete Protocol"
 *     message="This cannot be undone."
 *     onConfirm={handleDelete}
 *     onCancel={() => setConfirm(null)}
 *     danger
 *   />
 */
export default function ConfirmModal({ title, message, onConfirm, onCancel, confirmLabel = 'Delete', danger = true, loading = false }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
        <h2>{title}</h2>
        {message && <p>{message}</p>}
        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
