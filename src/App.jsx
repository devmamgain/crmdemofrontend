import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Leads from './pages/Leads.jsx';
import Deals from './pages/Deals.jsx';
import FairMarketValue from './pages/FairMarketValue.jsx';
import Reports from './pages/Reports.jsx';
import AiLeads from './pages/AiLeads.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/deals" element={<Deals />} />
        <Route path="/fmv" element={<FairMarketValue />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/ai-leads" element={<AiLeads />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
