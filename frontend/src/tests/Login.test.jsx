/**
 * Tests for Login Component
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthProvider } from '../auth';

// Mock the navigate function
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API
vi.mock('../api', () => ({
  login: vi.fn(),
  getCurrentUser: vi.fn().mockResolvedValue({ data: null }),
}));

import { login } from '../api';

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  const renderLogin = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render login form', () => {
    renderLogin();

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tenant subdomain/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login|sign in/i })).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    renderLogin();
    const user = userEvent.setup();

    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/email.*required/i)).toBeInTheDocument();
    });
  });

  it('should validate email format', async () => {
    renderLogin();
    const user = userEvent.setup();

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');

    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('should handle successful login', async () => {
    const mockResponse = {
      data: {
        token: 'fake-jwt-token',
        user: {
          id: 'user-123',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'tenant_admin',
        },
      },
    };
    login.mockResolvedValue(mockResponse);

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.type(screen.getByLabelText(/tenant subdomain/i), 'testcompany');

    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'Password123!',
        tenantSubdomain: 'testcompany',
      });
      expect(localStorage.setItem).toHaveBeenCalledWith('token', 'fake-jwt-token');
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('should display error message on login failure', async () => {
    login.mockRejectedValue({
      response: {
        data: {
          message: 'Invalid credentials',
        },
      },
    });

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'WrongPassword');
    await user.type(screen.getByLabelText(/tenant subdomain/i), 'testcompany');

    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('should show loading state during login', async () => {
    login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123!');
    await user.type(screen.getByLabelText(/tenant subdomain/i), 'testcompany');

    const submitButton = screen.getByRole('button', { name: /login|sign in/i });
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });

  it('should have link to registration page', () => {
    renderLogin();

    const registerLink = screen.getByText(/register|sign up|create account/i);
    expect(registerLink).toBeInTheDocument();
    expect(registerLink.closest('a')).toHaveAttribute('href', '/register');
  });
});
