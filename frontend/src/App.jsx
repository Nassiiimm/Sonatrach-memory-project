import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/Auth.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Requests from './pages/Requests.jsx';
import Approvals from './pages/Approvals.jsx';
import Relex from './pages/Relex.jsx';
import Finance from './pages/Finance.jsx';
import Admin from './pages/Admin.jsx';

function PrivateRoute({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={
        <PrivateRoute>
          <Dashboard />
        </PrivateRoute>
      } />
      <Route path="/requests" element={
        <PrivateRoute roles={['EMPLOYE','MANAGER','RELEX','FINANCE','ADMIN']}>
          <Requests />
        </PrivateRoute>
      } />
      <Route path="/approvals" element={
        <PrivateRoute roles={['MANAGER']}>
          <Approvals />
        </PrivateRoute>
      } />
      <Route path="/relex" element={
        <PrivateRoute roles={['RELEX']}>
          <Relex />
        </PrivateRoute>
      } />
      <Route path="/finance" element={
        <PrivateRoute roles={['FINANCE']}>
          <Finance />
        </PrivateRoute>
      } />
      <Route path="/admin" element={
        <PrivateRoute roles={['ADMIN']}>
          <Admin />
        </PrivateRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}