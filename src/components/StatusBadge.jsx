/**
 * Renders a colour-coded pill for any ActionStatus value.
 * Adding a new status in Week 2 only requires adding one CSS class — zero JS changes here.
 */
export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status?.replace('_', ' ')}</span>;
}
