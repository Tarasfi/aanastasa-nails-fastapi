import React, { useState } from 'react';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminPage() {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token'));

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  if (!token) {
    return <AdminLogin onLoginSuccess={(newToken) => setToken(newToken)} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}