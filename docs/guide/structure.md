# Project Structure

This guide explains the organization and structure of the DojoPool project, helping you understand where different components live and how they work together.

## Directory Overview

```
dojo-pool/
├── src/                  # Source code
│   ├── static/          # Static assets
│   │   ├── scss/       # Styles
│   │   ├── js/         # JavaScript
│   │   └── assets/     # Images, fonts, etc.
│   ├── templates/       # HTML templates
│   ├── core/           # Core functionality
│   ├── models/         # Data models
│   ├── auth/           # Authentication
│   └── utils/          # Utilities
├── docs/               # Documentation
└── tests/              # Test files
```

## Key Directories Explained

### 1. Styles (`src/static/scss/`)

```
scss/
├── abstracts/           # Variables, mixins, functions
│   ├── _variables.scss  # Global variables
│   ├── _mixins.scss    # Reusable mixins
│   └── _functions.scss # Helper functions
│
├── base/               # Base styles
│   ├── _reset.scss    # CSS reset/normalize
│   ├── _typography.scss # Typography rules
│   └── _accessibility.scss # Accessibility styles
│
├── components/         # Component styles
│   ├── _buttons.scss  # Button styles
│   ├── _forms.scss    # Form styles
│   └── _cards.scss    # Card styles
│
├── layout/            # Layout components
│   ├── _grid.scss    # Grid system
│   ├── _header.scss  # Header styles
│   └── _footer.scss  # Footer styles
│
├── pages/             # Page-specific styles
│   ├── _home.scss    # Home page styles
│   └── _auth.scss    # Authentication pages
│
├── themes/            # Theme variations
│   ├── _light.scss   # Light theme
│   └── _dark.scss    # Dark theme
│
└── main.scss         # Main file importing all others
```

### 2. JavaScript (`src/static/js/`)

```
js/
├── api/              # API integration
│   ├── client.ts    # API client
│   └── socket.ts    # WebSocket handling
│
├── components/       # UI components
│   ├── Button.ts    # Button component
│   └── Form.ts      # Form component
│
├── store/           # State management
│   └── store.ts     # Central store
│
├── utils/           # Utilities
│   ├── validation.ts # Form validation
│   └── formatting.ts # Data formatting
│
└── main.ts         # Main entry point
```

### 3. Core (`src/core/`)

```
core/
├── config.py        # Configuration
├── extensions.py    # Flask extensions
├── logging.py       # Logging setup
└── errors.py       # Error handling
```

### 4. Models (`src/models/`)

```
models/
├── base.py          # Base model class
├── user.py          # User model
├── role.py         # Role model
└── associations.py # Model relationships
```

## File Naming Conventions

1. **SCSS Files**
   - Partial files start with underscore: `_buttons.scss`
   - Main files without underscore: `main.scss`
   - Use kebab-case: `form-controls.scss`

2. **JavaScript/TypeScript Files**
   - Components use PascalCase: `Button.ts`
   - Utilities use camelCase: `formValidation.ts`
   - Constants use UPPER_SNAKE_CASE: `API_ENDPOINTS.ts`

3. **Python Files**
   - Use snake_case: `user_authentication.py`
   - Test files prefixed with `test_`: `test_user.py`

## Import Structure

### SCSS Imports

```scss
// Correct order of imports
@use 'abstracts/variables';
@use 'abstracts/mixins';
@use 'base/reset';
@use 'base/typography';
@use 'components/buttons';
@use 'layout/grid';
```

### JavaScript Imports

```typescript
// Third-party imports first
import { reactive } from 'vue';

// Absolute imports from our project
import { API_ENDPOINTS } from '@/config';

// Relative imports last
import { validateForm } from '../utils/validation';
```

## Component Organization

### 1. Component Structure

```
components/Button/
├── Button.ts        # Component logic
├── Button.scss     # Component styles
├── Button.test.ts  # Component tests
└── index.ts        # Public API
```

### 2. Component Dependencies

```typescript
// Button/Button.ts
import { Component } from '@/core/Component';
import { ButtonProps } from './types';
import { handleClick } from './utils';

export class Button extends Component {
  // Component implementation
}
```

## Configuration Files

### 1. Build Configuration

```
dojo-pool/
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts         # Vite configuration
├── jest.config.js         # Test configuration
└── .eslintrc.js          # Linting rules
```

### 2. Environment Configuration

```
dojo-pool/
├── .env                   # Default environment variables
├── .env.development      # Development variables
└── .env.production       # Production variables
```

## Best Practices

1. **File Organization**
   - Keep related files together
   - Use clear, descriptive names
   - Maintain consistent structure
   - Follow naming conventions

2. **Import Management**
   - Use absolute imports for project files
   - Group imports logically
   - Avoid circular dependencies
   - Use index files for public APIs

3. **Component Structure**
   - One component per file
   - Co-locate related files
   - Keep components focused
   - Document public APIs

4. **Testing Organization**
   - Mirror source structure
   - Keep tests close to implementation
   - Use descriptive test names
   - Maintain test independence

## Common Patterns

### 1. Feature Organization

```
features/auth/
├── components/     # Feature-specific components
├── hooks/         # Custom hooks
├── utils/         # Helper functions
└── index.ts       # Public API
```

### 2. Shared Resources

```
shared/
├── components/    # Shared components
├── hooks/        # Shared hooks
├── utils/        # Shared utilities
└── types/        # Type definitions
```

## Next Steps

1. Explore the [Component Documentation](../components/)
2. Review [Coding Standards](./coding-standards)
3. Learn about [Testing](./testing)
4. Check [Development Workflow](./workflow)
