/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './pages/MainLayout';
import CRMLayout from './pages/customers/CRMLayout';
import Dashboard from './pages/customers/Dashboard';
import CustomerList from './pages/customers/CustomerList';
import CustomerKanban from './pages/customers/CustomerKanban';
import TaskTracking from './pages/customers/TaskTracking';
import Leads from './pages/customers/Leads';
import Projects from './pages/customers/Projects';
import GanttChart from './pages/customers/GanttChart';
import Invoices from './pages/customers/Invoices';
import Logs from './pages/customers/Logs';
import System from './pages/customers/System';
import QuoteGenerator from './pages/customers/QuoteGenerator';
import ConstructionApp from './pages/construction/ConstructionApp';
import MoodboardApp from './pages/moodboard/MoodboardApp';
import MarketingApp from './pages/marketing/MarketingApp';

const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6 text-gray-500">Tính năng {title} đang phát triển...</div>
);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/customers" replace />} />
          
          {/* Main App Routes */}
          <Route path="construction" element={<ConstructionApp />} />
          <Route path="moodboard" element={<MoodboardApp />} />
          <Route path="marketing" element={<MarketingApp />} />
          <Route path="tasks" element={<TaskTracking />} />
          <Route path="projects" element={<PlaceholderPage title="Dự án" />} />
          <Route path="dashboard" element={<PlaceholderPage title="Thống kê (Dashboard)" />} />
          <Route path="history" element={<PlaceholderPage title="Lịch sử" />} />
          <Route path="users" element={<PlaceholderPage title="Người dùng" />} />

          {/* CRM Master Module */}
          <Route path="customers" element={<CRMLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="list" element={<CustomerList />} />
            <Route path="kanban" element={<CustomerKanban />} />
            <Route path="leads" element={<Leads />} />
            <Route path="tasks" element={<TaskTracking />} />
            <Route path="projects" element={<Projects />} />
            <Route path="gantt" element={<GanttChart />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="quotes/new" element={<QuoteGenerator />} />
            <Route path="logs" element={<Logs />} />
            <Route path="system" element={<System />} />
            <Route path="*" element={<div className="p-6 text-gray-500">Tính năng đang phát triển...</div>} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
