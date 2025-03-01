# DojoPool Frontend Testing Guide

This document provides information about the testing setup and how to run tests for the DojoPool frontend application.

## Testing Infrastructure

The DojoPool frontend uses the following testing tools:

- **Jest**: Main test runner
- **React Testing Library**: For testing React components
- **Testing Library React Hooks**: For testing custom hooks
- **Jest DOM**: For DOM testing utilities

## Running Tests

### Prerequisites

Make sure you have all dependencies installed:

```bash
npm install
```

### Running All Tests

To run all tests:

```bash
npm test
```

Alternatively, you can use the test runner script:

```bash
# Make the script executable first
chmod +x runTests.sh

# Run all tests
./runTests.sh

# Run all tests and install dependencies if needed
./runTests.sh --install
```

### Running Specific Tests

You can run specific test suites using the following commands:

```bash
# Run wallet-related tests
npm run test:wallet

# Run tournament-related tests
npm run test:tournament

# Run integration tests
npm run test:integration
```

### Test Coverage

To generate a test coverage report:

```bash
npm run test:coverage
```

Or using the test runner script:

```bash
./runTests.sh --coverage
```

The coverage report will be available in the `coverage/` directory.

## Test Structure

The tests are organized as follows:

- **Unit Tests**: Test individual components, hooks, and services in isolation
  - `useWallet.test.ts`: Tests for the wallet hook
  - `crossChainTournamentService.test.ts`: Tests for the tournament service
  - `TournamentRegistration.test.tsx`: Tests for the tournament registration component
  
- **Integration Tests**: Test multiple components working together
  - `TournamentRegistrationIntegration.test.tsx`: Tests the full tournament registration flow

## Mock Implementation

For testing blockchain interactions, we use Jest mocks to simulate:

- Wallet connections (MetaMask and Phantom)
- Blockchain API calls
- Transaction signing and sending
- Cross-chain validations

## Adding New Tests

When adding new functionality, please follow these guidelines for writing tests:

1. **Unit Tests**: Write tests for each new component, hook, or service.
2. **Integration Tests**: Ensure that components work together as expected.
3. **Coverage**: Aim for at least 80% test coverage for critical components.

## Running Only Specific Tests

To run only the tests for wallet and tournament components (without running other tests in the codebase), you can use one of the following methods:

### Using the Node.js Test Runner Script

We've created a Node.js script that will run all the wallet and tournament tests using npm's test command with the correct configuration:

```bash
# Make the script executable (Linux/Mac)
chmod +x run-wallet-tournament-tests.js

# Run the script
node run-wallet-tournament-tests.js
```

This script will:
- Run tests for useWallet, crossChainTournamentService, and TournamentRegistration
- Show colored output for better readability
- Provide a summary of test results
- Exit with the appropriate exit code

### Using Provided Scripts

We've created convenient scripts to run only the wallet and tournament tests:

**Windows (PowerShell):**
```
.\runSpecificTests.ps1
```

**Linux/Mac (Bash):**
```
./runSpecificTests.sh
```
Note: You may need to make the bash script executable first with `chmod +x runSpecificTests.sh`

### Using Jest Directly

You can also run specific tests directly with Jest:

```bash
# Run wallet tests only
npx jest src/tests/useWallet.test.ts

# Run tournament service tests only
npx jest src/tests/crossChainTournamentService.test.ts

# Run tournament registration component tests only
npx jest src/tests/TournamentRegistration.test.tsx

# Run tournament registration integration tests only
npx jest src/tests/TournamentRegistrationIntegration.test.tsx

# Run all custom tests at once using a pattern
npx jest "src/tests/(useWallet|crossChainTournamentService|TournamentRegistration)"
```

## Troubleshooting Common Issues

### "Preset ts-jest not found" Error

If you encounter the "Preset ts-jest not found" error when trying to run tests directly with Jest, use one of these approaches:

1. **Use our Node.js test runner script** (recommended):
   ```bash
   node run-wallet-tournament-tests.js
   ```
   This script creates a temporary Jest configuration that doesn't rely on the ts-jest preset and runs the tests directly.

2. **Use the npm scripts** (if available):
   ```bash
   npm run test:wallet
   npm run test:tournament
   npm run test:integration
   ```

3. **Modify the Jest configuration**:
   If you need to run tests directly with Jest, you can modify the jest.config.js file to use babel-jest instead of ts-jest:
   ```javascript
   module.exports = {
     testEnvironment: 'jsdom',
     transform: {
       '^.+\\.(ts|tsx)$': ['babel-jest', {
         presets: [
           ['@babel/preset-env', { targets: { node: 'current' } }],
           '@babel/preset-react',
           '@babel/preset-typescript'
         ]
       }],
       '^.+\\.(js|jsx)$': 'babel-jest'
     },
     // ... other configuration
   };
   ```

### "Cannot find module '@babel/preset-react'" Error

If you encounter this error, it means the Babel presets are not installed. Since this project uses workspaces with `workspace:*` protocol in package.json, you need to install dependencies following your team's monorepo dependency management approach:

#### Option 1: Using Yarn Workspaces (Recommended)

If you're using Yarn workspaces:

```bash
# Navigate to the root directory
cd ../../

# Install the dependencies at the workspace root
yarn add -D @babel/preset-env @babel/preset-react @babel/preset-typescript babel-jest
```

#### Option 2: Using npm Workspaces 

If you're using npm workspaces (npm 7+):

```bash
# Navigate to the root directory
cd ../../

# Install the dependencies at the workspace root
npm install -D @babel/preset-env @babel/preset-react @babel/preset-typescript babel-jest
```

#### Option 3: Using pnpm Workspaces

If you're using pnpm workspaces:

```bash
# Navigate to the root directory
cd ../../

# Install the dependencies at the workspace root
pnpm add -D @babel/preset-env @babel/preset-react @babel/preset-typescript babel-jest
```

#### Option 4: Adding to package.json Manually

If the above methods don't work due to workspace configurations, you may need to:

1. Add these dependencies to the root `package.json`:
   ```json
   "devDependencies": {
     "@babel/preset-env": "^7.22.5",
     "@babel/preset-react": "^7.22.5",
     "@babel/preset-typescript": "^7.22.5",
     "babel-jest": "^29.5.0"
     // ... other dependencies
   }
   ```

2. Then run the appropriate installation command for your package manager (`yarn`, `npm install`, or `pnpm install`)

After installing these dependencies, your tests should run correctly without the previous errors.

## Testing in a Monorepo Environment

### Understanding the Challenges

Testing in a monorepo environment presents unique challenges, especially when dealing with workspace dependencies:

1. **Dependency Resolution**: Monorepos often use workspace protocols (like `workspace:*`) which can cause issues with test runners that don't understand these protocols.

2. **Babel Configuration**: Jest requires Babel presets to properly transform TypeScript and JSX, but these dependencies might be hoisted or managed at the root level.

3. **Module Transformation**: ES modules syntax (`import`/`export`) needs proper transformation to work with Jest's default Node.js environment.

### Comprehensive Solutions

#### Solution 1: Install Dependencies at the Root Level (Recommended)

The most reliable solution is to install all testing-related dependencies at the root level of your monorepo:

```bash
# Navigate to the root directory
cd ../../

# For Yarn
yarn add -D jest @testing-library/react @testing-library/react-hooks @babel/preset-env @babel/preset-react @babel/preset-typescript babel-jest

# For npm
npm install -D jest @testing-library/react @testing-library/react-hooks @babel/preset-env @babel/preset-react @babel/preset-typescript babel-jest

# For pnpm
pnpm add -D jest @testing-library/react @testing-library/react-hooks @babel/preset-env @babel/preset-react @babel/preset-typescript babel-jest
```

#### Solution 2: Use Jest Projects Configuration

For complex monorepos, configure Jest to use the "projects" feature to handle multiple packages:

```javascript
// Root jest.config.js
module.exports = {
  projects: ['<rootDir>/packages/*/jest.config.js'],
  // Shared configuration
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-react',
        '@babel/preset-typescript'
      ]
    }]
  }
};
```

#### Solution 3: Use a Custom Test Runner

If you can't modify the dependencies, create a custom test runner script that:
1. Sets up a temporary Jest configuration
2. Handles the transformation of TypeScript and JSX files
3. Runs the tests with the temporary configuration

This approach is implemented in our `run-wallet-tournament-tests.js` script.

### Best Practices for Testing in Monorepos

1. **Consistent Configuration**: Maintain consistent Jest and Babel configurations across packages.
2. **Dependency Management**: Clearly document how testing dependencies should be installed and managed.
3. **CI Integration**: Ensure your CI pipeline correctly installs and resolves dependencies for tests.
4. **Test Isolation**: Keep tests isolated to their respective packages to prevent cross-package issues.
5. **Documentation**: Maintain clear documentation on how to run tests in your specific monorepo setup.

### "TypeError: window.ethereum is undefined"

This error occurs when the test environment doesn't properly mock the browser's ethereum object. Make sure that `setupTests.ts` is properly configured and imported.

### "Error: Not implemented: navigation"

This error occurs when tests try to use browser navigation. Use `MemoryRouter` from `react-router-dom` to mock navigation.

### "ReferenceError: Web3Provider is not defined"

This error indicates that the ethers library is not being properly mocked. Check the mock implementation in the test file.

## Contact

If you encounter any testing issues or need help with the testing infrastructure, please contact the development team. 