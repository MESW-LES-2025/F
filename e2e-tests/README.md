# Automated Acceptance Tests

End-to-end tests for the Concordia application using Playwright.

## Setup

```bash
npm install
npx playwright install chromium
```

## Running Tests

Make sure the application is running on `http://localhost:8080` before running tests.

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui
```

## Test Coverage

- **Auth**: Complete coverage of user registration, login and logout flows
