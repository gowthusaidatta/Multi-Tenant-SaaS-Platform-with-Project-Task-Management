# Contributing to Multi-Tenant SaaS Platform

Thank you for your interest in contributing to this project! This document provides guidelines for contributing.

## Code of Conduct

This project adheres to a code of conduct. By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- System information (OS, Node version, Docker version)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, include:
- Clear use case
- Expected benefits
- Potential implementation approach

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## Development Setup

```bash
# Clone the repository
git clone https://github.com/gowthusaidatta/Multi-Tenant-SaaS-Platform-with-Project-Task-Management.git

# Start services
docker-compose up -d

# Check health
curl http://localhost:5000/api/health
```

## Coding Standards

### Backend (Node.js/Express)
- Use ES6+ syntax
- Follow RESTful API conventions
- Always validate input
- Use async/await for asynchronous code
- Add JSDoc comments for functions
- Handle errors properly

### Frontend (React)
- Use functional components with hooks
- Follow React best practices
- Use meaningful component names
- Add PropTypes or TypeScript types
- Keep components small and focused

### Database
- Always use parameterized queries
- Add indexes for frequently queried columns
- Use transactions for multi-step operations
- Document schema changes in migrations

## Commit Message Guidelines

Follow conventional commits:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting)
- `refactor:` Code refactoring
- `test:` Adding or updating tests
- `chore:` Maintenance tasks

Example: `feat: add user profile update endpoint`

## Testing

Before submitting a PR:
1. Test all API endpoints
2. Verify frontend functionality
3. Check Docker build: `docker-compose up -d --build`
4. Run linting (if configured)

## Questions?

Feel free to open an issue for any questions about contributing.
