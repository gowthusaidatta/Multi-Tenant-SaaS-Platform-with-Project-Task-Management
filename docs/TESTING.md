# Testing Documentation

## Overview
This project includes comprehensive automated testing for both backend and frontend components to ensure code reliability and prevent regressions.

## Backend Testing

### Test Framework
- **Jest**: Unit and integration testing framework
- **Supertest**: HTTP assertions for API endpoint testing

### Running Backend Tests

```bash
cd backend

# Install dependencies
npm install

# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

### Test Structure

```
backend/
├── tests/
│   ├── middleware/
│   │   └── auth.test.js          # Auth middleware tests
│   ├── utils/
│   │   ├── validation.test.js    # Validation utility tests
│   │   └── responses.test.js     # Response helper tests
│   └── integration/
│       ├── auth.test.js          # Auth API tests
│       └── projects.test.js      # Projects API tests
```

### Backend Test Coverage

#### Unit Tests
- **Authentication Middleware** (auth.test.js)
  - Token validation
  - Role-based authorization
  - Super admin permissions
  - Error handling

- **Validation Utilities** (validation.test.js)
  - Email validation
  - Password strength validation
  - Subdomain format validation
  - UUID validation
  - Enum validation

- **Response Utilities** (responses.test.js)
  - Success responses (200, 201)
  - Error responses (400, 401, 403, 404, 409)
  - Response structure consistency

#### Integration Tests
- **Authentication API** (auth.test.js)
  - Tenant registration
  - User login
  - Token validation
  - Get current user
  - Logout

- **Projects API** (projects.test.js)
  - Create project
  - List projects
  - Update project
  - Delete project
  - Tenant isolation

### Coverage Goals
- Minimum 70% code coverage
- 100% coverage for critical authentication paths
- All API endpoints tested

## Frontend Testing

### Test Framework
- **Vitest**: Fast unit test framework
- **React Testing Library**: Component testing
- **jsdom**: DOM simulation

### Running Frontend Tests

```bash
cd frontend

# Install dependencies
npm install

# Run all tests
npm test

# Run tests in UI mode
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Structure

```
frontend/
├── src/
│   └── tests/
│       ├── setup.js           # Test configuration
│       ├── auth.test.jsx      # Auth context tests
│       ├── Login.test.jsx     # Login component tests
│       └── api.test.js        # API module tests
```

### Frontend Test Coverage

#### Component Tests
- **Login Component** (Login.test.jsx)
  - Form rendering
  - Input validation
  - Successful login flow
  - Error handling
  - Loading states
  - Navigation links

#### Context Tests
- **Auth Context** (auth.test.jsx)
  - User authentication state
  - Token management
  - Loading states
  - Error handling

#### API Tests
- **API Module** (api.test.js)
  - HTTP request formatting
  - Token inclusion in headers
  - Response handling
  - Error handling
  - Query parameters

### Coverage Goals
- Minimum 60% code coverage
- 100% coverage for authentication flow
- All user-facing components tested

## Continuous Integration

### GitHub Actions Workflow
Tests run automatically on:
- Every push to `main` or `develop` branches
- Every pull request
- Manual workflow dispatch

### CI Pipeline
1. Setup Node.js environment
2. Install dependencies
3. Run backend tests
4. Run frontend tests
5. Generate coverage reports
6. Upload artifacts

## Writing New Tests

### Backend Test Example

```javascript
import { describe, it, expect } from '@jest/globals';
import { myFunction } from '../src/utils/myModule.js';

describe('MyFunction', () => {
  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Frontend Test Example

```javascript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

## Best Practices

1. **Test Organization**
   - Group related tests with `describe` blocks
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Test Isolation**
   - Clean up after each test
   - Use `beforeEach` and `afterEach` hooks
   - Mock external dependencies

3. **Coverage**
   - Focus on critical paths first
   - Test edge cases and error conditions
   - Don't obsess over 100% coverage

4. **Maintenance**
   - Keep tests simple and readable
   - Update tests with code changes
   - Remove obsolete tests

## Troubleshooting

### Common Issues

**Jest with ES Modules**
```bash
# Use this command for ES module support
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

**CORS Errors in Tests**
- Mock axios calls instead of real HTTP requests
- Use `vi.mock()` or `jest.mock()`

**Async Test Timeouts**
```javascript
// Increase timeout for slow tests
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
