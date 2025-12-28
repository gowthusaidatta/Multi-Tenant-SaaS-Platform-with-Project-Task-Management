/**
 * Tests for Authentication Context
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../auth';
import { BrowserRouter } from 'react-router-dom';

// Mock API module
vi.mock('../api', () => ({
  getCurrentUser: vi.fn(),
  login: vi.fn(),
  logout: vi.fn(),
}));

import { getCurrentUser } from '../api';

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

  it('should show loading state initially', () => {
    getCurrentUser.mockReturnValue(new Promise(() => {})); // Never resolves
    
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should load user data from token', async () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      fullName: 'Test User',
      role: 'tenant_admin',
    };
    
    localStorage.setItem('token', 'fake-token');
    getCurrentUser.mockResolvedValue({ data: mockUser });

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User: Test User')).toBeInTheDocument();
    });
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
    getCurrentUser.mockRejectedValue(new Error('Unauthorized'));

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
    
    // Token should be removed after failed auth
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });
});
