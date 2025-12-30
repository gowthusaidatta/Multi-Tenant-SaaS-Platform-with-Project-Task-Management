import React, { useState } from 'react';
import { AuthAPI } from '../api';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, User, Lock, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const [form, setForm] = useState({ tenantName: '', subdomain: '', adminEmail: '', adminFullName: '', adminPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const isValidSubdomain = (s) => {
    if (!s) return false;
    const v = String(s).toLowerCase();
    if (v.length < 3 || v.length > 63) return false;
    return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(v);
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!isValidSubdomain(form.subdomain)) {
      setLoading(false);
      setError('Invalid subdomain. Use 3–63 chars: lowercase letters, numbers, hyphens.');
      return;
    }

    try {
      await AuthAPI.registerTenant(form);
      setMessage('Tenant registered successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (e) {
      setError(e.response?.data?.message || 'Registration failed. Please ensure the subdomain is unique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">PM</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Your Workspace</h1>
          <p className="text-gray-600">Set up your organization and admin account</p>
        </div>

        {/* Register Card */}
        <div className="card p-8 shadow-soft-xl">
          {message ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-accent-100 rounded-full mb-4">
                <CheckCircle2 className="w-8 h-8 text-accent-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600 mb-4">{message}</p>
              <p className="text-sm text-gray-500">Redirecting to login...</p>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Organization Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    required
                    className="input pl-10"
                    placeholder="Acme Inc."
                    value={form.tenantName}
                    onChange={(e) => setForm({ ...form, tenantName: e.target.value })}
                  />
                </div>
              </div>

              {/* Subdomain */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subdomain
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    required
                    className={`input pl-10 ${!isValidSubdomain(form.subdomain) && form.subdomain ? 'border-red-300 focus:ring-red-500' : ''}`}
                    placeholder="acme"
                    value={form.subdomain}
                    onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Your workspace URL: <span className="font-medium">{form.subdomain || 'your-subdomain'}.yourapp.com</span>
                </p>
              </div>

              {/* Admin Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    required
                    className="input pl-10"
                    placeholder="John Doe"
                    value={form.adminFullName}
                    onChange={(e) => setForm({ ...form, adminFullName: e.target.value })}
                  />
                </div>
              </div>

              {/* Admin Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    required
                    type="email"
                    className="input pl-10"
                    placeholder="admin@acme.com"
                    autoComplete="username"
                    value={form.adminEmail}
                    onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    required
                    type="password"
                    className="input pl-10"
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={form.adminPassword}
                    onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !isValidSubdomain(form.subdomain)}
                className="w-full btn btn-primary btn-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating workspace...
                  </span>
                ) : (
                  'Create Workspace'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
