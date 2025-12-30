/**
 * Tests for Authentication Context
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth';
import { BrowserRouter } from 'react-router-dom';

// Mock API module
vi.mock('../api', async () => {
  const actual = await vi.importActual('../api');
  return {
    ...actual,
    AuthAPI: {
      ...actual.AuthAPI,
      me: vi.fn(),
    },
  };
});

import { AuthAPI } from '../api';

// Test component that uses auth context
const TestComponent = () => {
  const { user, isAuthenticated, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!isAuthenticated) return <div>Not authenticated</div>;
  return <div>User: {user.fullName}</div>;
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should show not authenticated when no token', async () => {
    localStorage.removeItem('token');
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });

  it('should handle authentication error', async () => {
    localStorage.setItem('token', 'invalid-token');
    AuthAPI.me.mockRejectedValue(new Error('Unauthorized'));

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeInTheDocument();
    });
  });
});
