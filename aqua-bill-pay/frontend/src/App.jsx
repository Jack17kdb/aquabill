import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/auth.store.js';
import Layout from './components/Layout.jsx';
import SuperAdminLayout from './components/SuperAdminLayout.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import ManageHouses from './pages/ManageHouses.jsx';
import WaterInput from './pages/WaterInput.jsx';
import Invoices from './pages/Invoices.jsx';
import Settings from './pages/Settings.jsx';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard.jsx';
import SuperAdminAccounts from './pages/superadmin/SuperAdminAccounts.jsx';
import SuperAdminPayments from './pages/superadmin/SuperAdminPayments.jsx';
import TenantRegister from './pages/TenantRegister.jsx';

const ProtectedRoute = ({ children, requireRole }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  if (requireRole && user?.role !== requireRole) {
    return <Navigate to={user?.role === 'superadmin' ? '/superadmin' : '/dashboard'} replace />;
  }
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid #334155',
            fontFamily: 'DM Sans, sans-serif',
            fontSize: '14px',
            borderRadius: '12px'
          },
          success: { iconTheme: { primary: '#0ea5e9', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      <Routes>
        {/* Public — no auth needed */}
        <Route path="/register/:ownerId" element={<TenantRegister />} />

        <Route path="/login" element={<Login />} />

        {/* SuperAdmin routes */}
        <Route path="/superadmin" element={
          <ProtectedRoute requireRole="superadmin"><SuperAdminLayout /></ProtectedRoute>
        }>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="accounts" element={<SuperAdminAccounts />} />
          <Route path="payments" element={<SuperAdminPayments />} />
        </Route>

        {/* Admin routes */}
        <Route path="/" element={
          <ProtectedRoute requireRole="admin"><Layout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="houses" element={<ManageHouses />} />
          <Route path="water-input" element={<WaterInput />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
