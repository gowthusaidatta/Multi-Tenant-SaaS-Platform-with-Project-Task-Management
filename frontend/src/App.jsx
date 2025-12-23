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
    <div className="navbar">
      <div className="navbar-brand">GPP <span className="dot">●</span> SaaS</div>
      {user && (
        <div className="navbar-links">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/projects">Projects</Link>
          {['tenant_admin','super_admin'].includes(user.role) && <Link to="/users">Users</Link>}
        </div>
      )}
      <div className="navbar-right">
        {user ? (
          <>
            <span className="text-muted">{user.fullName} ({user.role})</span>
            <button className="btn" onClick={async () => { await logout(); navigate('/login'); }}>Logout</button>
          </>
        ) : (
          <div className="stack">
            <Link className="btn" to="/login">Login</Link>
            <Link className="btn btn-primary" to="/register">Register</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavBar />
      <div className="container">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/:projectId" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
          <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="*" element={<Login />} />
        </Routes>
        <div className="footer">© 2025 GPP Multi‑Tenant SaaS Platform</div>
      </div>
    </AuthProvider>
  );
}
