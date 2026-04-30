import { Routes, Route } from 'react-router-dom';
import Navbar      from './components/Navbar.jsx';
import Dashboard   from './pages/Dashboard.jsx';
import Plans       from './pages/Plans.jsx';
import PlanDetail  from './pages/PlanDetail.jsx';
import ActionDetail from './pages/ActionDetail.jsx';
import Protocols   from './pages/Protocols.jsx';
import ResourceTypes from './pages/ResourceTypes.jsx';
import Ledger      from './pages/Ledger.jsx';
import AuditLog    from './pages/AuditLog.jsx';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="content">
        <Routes>
          <Route path="/"                 element={<Dashboard />} />
          <Route path="/plans"            element={<Plans />} />
          <Route path="/plans/:id"        element={<PlanDetail />} />
          <Route path="/actions/:id"      element={<ActionDetail />} />
          <Route path="/protocols"        element={<Protocols />} />
          <Route path="/resource-types"   element={<ResourceTypes />} />
          <Route path="/ledger"           element={<Ledger />} />
          <Route path="/audit-log"        element={<AuditLog />} />
        </Routes>
      </main>
    </div>
  );
}
