import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';

/**
 * Recursive collapsible tree node.
 *
 * Props:
 *   node        — PlanNodeDto from GET /api/plans/:id
 *   selectedId  — currently highlighted node id
 *   onSelect    — called with node when user clicks
 *   planId      — root plan id (for navigation context)
 */
export default function PlanTreeNode({ node, selectedId, onSelect, planId }) {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const isComposite = node.type === 'PLAN';
  const isSelected = selectedId === node.id;

  function handleClick(e) {
    e.stopPropagation();
    if (isComposite) setOpen(o => !o);
    onSelect?.(node);
    if (!isComposite) navigate(`/actions/${node.id}`);
  }

  return (
    <div className="tree-node">
      <div
        className={`tree-node-inner ${isSelected ? 'selected' : ''}`}
        onClick={handleClick}
        title={isComposite ? 'Click to expand/collapse' : 'Click to view action detail'}
      >
        <span className="tree-toggle">
          {isComposite ? (open ? '▼' : '▶') : '•'}
        </span>
        <span style={{ flex: 1, fontSize: 13 }}>
          {node.name}
        </span>
        <StatusBadge status={node.status} />
      </div>

      {isComposite && open && node.children?.length > 0 && (
        <div className="tree-children">
          {node.children.map(child => (
            <PlanTreeNode
              key={child.id}
              node={child}
              selectedId={selectedId}
              onSelect={onSelect}
              planId={planId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
