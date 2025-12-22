import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import ProtectedRoute from './routes/ProtectedRoute';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetails from './pages/ProjectDetails';
import Users from './pages/Users';

function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', padding: 12, gap: 12, borderBottom: '1px solid #eee' }}>
      <strong style={{ marginRight: 16 }}>GPP SaaS</strong>
      {user && (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/projects">Projects</Link>
          {['tenant_admin','super_admin'].includes(user.role) && <Link to="/users">Users</Link>}
        </>
      )}
      <span style={{ marginLeft: 'auto' }}>
        {user ? (
          <>
            <span style={{ marginRight: 12 }}>{user.fullName} ({user.role})</span>
            <button onClick={async () => { await logout(); navigate('/login'); }}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" style={{ marginLeft: 8 }}>Register</Link>
          </>
        )}
      </span>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavBar />
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
        <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
        <Route path="*" element={<Login />} />
      </Routes>
    </AuthProvider>
  );
}
