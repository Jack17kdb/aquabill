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
import PaymentPage from './pages/PaymentPage.jsx';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard.jsx';
import SuperAdminAccounts from './pages/superadmin/SuperAdminAccounts.jsx';
import SuperAdminPayments from './pages/superadmin/SuperAdminPayments.jsx';
import TenantRegister from './pages/TenantRegister.jsx';
import PwaInstallPrompt from './components/PwaInstallPrompt.jsx';

const ProtectedRoute = ({ children, requireRole, allowRoles }) => {
  const { token, user } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;

  // Check single role
  if (requireRole && user?.role !== requireRole) {
    const dest = user?.role === 'superadmin' ? '/superadmin'
               : user?.role === 'caretaker'  ? '/houses'
               : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  // Check allowed roles list
  if (allowRoles && !allowRoles.includes(user?.role)) {
    return <Navigate to="/houses" replace />;
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
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } }
        }}
      />
      <Routes>
        {/* Public — no auth */}
        <Route path="/register/:ownerId" element={<TenantRegister />} />
        <Route path="/login" element={<Login />} />

        {/* SuperAdmin */}
        <Route path="/superadmin" element={
          <ProtectedRoute requireRole="superadmin"><SuperAdminLayout /></ProtectedRoute>
        }>
          <Route index element={<SuperAdminDashboard />} />
          <Route path="accounts" element={<SuperAdminAccounts />} />
          <Route path="payments" element={<SuperAdminPayments />} />
        </Route>

        {/* Admin + Caretaker share the same Layout */}
        <Route path="/" element={
          <ProtectedRoute allowRoles={['admin','caretaker']}><Layout /></ProtectedRoute>
        }>
          <Route index element={<Navigate to="/houses" replace />} />

          {/* Admin only pages */}
          <Route path="dashboard" element={
            <ProtectedRoute allowRoles={['admin']}><Dashboard /></ProtectedRoute>
          }/>
          <Route path="invoices" element={
            <ProtectedRoute allowRoles={['admin']}><Invoices /></ProtectedRoute>
          }/>
          <Route path="settings" element={
            <ProtectedRoute allowRoles={['admin']}><Settings /></ProtectedRoute>
          }/>
          <Route path="payment" element={
            <ProtectedRoute allowRoles={['admin']}><PaymentPage /></ProtectedRoute>
          }/>

          {/* Admin + caretaker pages */}
          <Route path="houses"      element={<ManageHouses />} />
          <Route path="water-input" element={<WaterInput />} />
        </Route>
      </Routes>
      <PwaInstallPrompt />
    </BrowserRouter>
  );
}
