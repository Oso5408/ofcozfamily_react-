# Testing Documentation

This document provides information about the testing setup and how to run tests for the login system.

## Testing Stack

- **Test Framework**: Vitest
- **Testing Library**: React Testing Library
- **Environment**: jsdom (simulates browser environment)

## Running Tests

The following npm scripts are available:

```bash
# Run tests in watch mode (re-runs on file changes)
npm test

# Run tests once and exit
npm run test:run

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Test Files

### Login System Tests (`src/test/login.test.jsx`)

This test suite covers invalid login scenarios, specifically testing cases where users provide incorrect or malicious credentials.

#### Test Categories

**1. Invalid Credentials Tests**
- Non-existent user (never visited website)
- Wrong password for existing user
- Invalid email format
- Empty credentials
- Rate limiting after too many failed attempts
- Network errors during login
- Unconfirmed email accounts
- Verification that user data is not stored on failed login

**2. Edge Cases Tests**
- SQL injection attempts (security testing)
- Very long input strings (boundary testing)
- Special characters in credentials

## Test Coverage

The test suite covers the following scenarios:

### User Who Never Visited the Website
Tests that the system properly rejects login attempts from users who have never registered:
```javascript
// Example: User with email 'newuser@example.com' tries to login
// Expected: "Invalid login credentials" error
```

### Invalid Credentials Handling
- Tests various types of invalid credentials
- Ensures proper error messages are displayed
- Verifies that authentication state is not modified

### Security Testing
- SQL injection attempts are safely handled
- Special characters don't break the system
- Input validation works correctly

## Configuration

### Vitest Config (`vitest.config.js`)
- Uses jsdom environment for browser simulation
- Includes React plugin for JSX support
- Sets up path aliases (@/ → src/)
- Loads setup file before tests

### Test Setup (`src/test/setup.js`)
- Imports testing utilities
- Mocks browser APIs (matchMedia, IntersectionObserver)
- Sets up cleanup after each test

## Mocking Strategy

The tests mock the following:
- **authService**: Simulates Supabase authentication responses
- **userService**: Mocks user-related operations
- **Supabase client**: Prevents actual API calls during tests

## Writing New Tests

To add new login tests:

1. Import required testing utilities:
```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
```

2. Mock the authService response:
```javascript
authService.signIn.mockResolvedValue({
  success: false,
  error: 'Your error message',
});
```

3. Render the component with AuthProvider:
```javascript
render(
  <AuthProvider>
    <TestLoginComponent />
  </AuthProvider>
);
```

4. Simulate user interactions:
```javascript
const user = userEvent.setup();
await user.type(emailInput, 'test@example.com');
await user.type(passwordInput, 'password123');
await user.click(loginButton);
```

5. Assert expected behavior:
```javascript
await waitFor(() => {
  const errorMessage = screen.getByTestId('error-message');
  expect(errorMessage).toBeInTheDocument();
  expect(errorMessage.textContent).toBe('Expected error message');
});
```

## Best Practices

1. **Clear mocks between tests**: Use `vi.clearAllMocks()` in `beforeEach()`
2. **Use waitFor**: Always wrap assertions in `waitFor()` for async operations
3. **Test user perspective**: Write tests from the user's point of view
4. **Meaningful error messages**: Include clear expectations in assertions
5. **Don't test implementation details**: Focus on behavior, not internal code structure

## Common Issues

### Tests timing out
- Increase timeout in `waitFor()` options
- Check that mocks are properly configured
- Ensure async operations are properly awaited

### Mock not being called
- Verify mock is set up before rendering component
- Check that the function path matches exactly
- Clear mocks between tests

### Element not found
- Use `screen.debug()` to see current DOM
- Check data-testid values match
- Ensure element is rendered conditionally based on state

## Future Test Coverage

Consider adding tests for:
- Successful login scenarios
- Password reset flow
- Registration validation
- Session persistence
- Token refresh logic
- Multi-factor authentication (if implemented)
- Social login providers (if implemented)

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
