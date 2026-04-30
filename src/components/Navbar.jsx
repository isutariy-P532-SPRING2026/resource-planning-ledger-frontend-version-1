import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/',               label: '📊 Dashboard' },
  { to: '/plans',          label: '📋 Plans' },
  { to: '/protocols',      label: '📖 Protocols' },
  { to: '/resource-types', label: '🔧 Resource Types' },
  { to: '/ledger',         label: '💰 Ledger' },
  { to: '/audit-log',      label: '🗒️ Audit Log' },
];

export default function Navbar() {
  return (
    <nav className="sidebar">
      <div className="brand">
        Resource Planning Ledger
        <small>CSCI-P532 Project 4</small>
      </div>
      {LINKS.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) => isActive ? 'active' : ''}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
