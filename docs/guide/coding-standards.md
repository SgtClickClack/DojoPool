# Coding Standards

This guide outlines our coding standards and best practices to maintain consistent, high-quality code across the project.

## General Guidelines

### 1. Code Formatting

- Use consistent indentation (2 spaces)
- Keep lines under 80 characters
- Use meaningful whitespace
- Follow language-specific conventions

```typescript
// Good
function calculateTotal(items: Item[]): number {
  return items
    .filter(item => item.isActive)
    .reduce((total, item) => total + item.price, 0);
}

// Bad
function calculateTotal(items: Item[]): number {
return items.filter(item=>item.isActive).reduce((total,item)=>total+item.price,0);}
```

### 2. Naming Conventions

- Use descriptive, meaningful names
- Follow consistent casing conventions
- Avoid abbreviations unless common

```typescript
// Good
const userAuthentication = new UserAuthentication();
const firstName = 'John';

// Bad
const auth = new Auth();
const fn = 'John';
```

## Language-Specific Standards

### TypeScript/JavaScript

#### 1. Variables

```typescript
// Constants
const MAX_ITEMS = 100;
const API_ENDPOINT = 'https://api.example.com';

// Variables
let currentUser: User | null = null;
let isLoading = false;

// Avoid
var oldStyle = 'bad'; // Don't use var
```

#### 2. Functions

```typescript
// Function Declaration
function calculateTotal(items: Item[]): number {
  // Implementation
}

// Arrow Functions
const multiply = (a: number, b: number): number => a * b;

// Async Functions
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await api.get(`/users/${id}`);
    return response.data;
  } catch (error) {
    handleError(error);
    throw error;
  }
}
```

#### 3. Classes

```typescript
class UserService {
  private readonly api: Api;
  
  constructor(api: Api) {
    this.api = api;
  }
  
  public async getUser(id: string): Promise<User> {
    // Implementation
  }
  
  private validateUser(user: User): boolean {
    // Implementation
  }
}
```

### SCSS/CSS

#### 1. Selectors

```scss
// Component Structure
.component {
  &__element {
    // Styles
    
    &--modifier {
      // Modifier styles
    }
  }
  
  &:hover {
    // Hover styles
  }
}

// Avoid deep nesting
.good {
  .child {
    // Maximum 2-3 levels deep
  }
}

.bad {
  .child {
    .grandchild {
      .great-grandchild {
        // Too deep
      }
    }
  }
}
```

#### 2. Properties

```scss
.element {
  // Positioning
  position: relative;
  z-index: 1;
  
  // Display & Box Model
  display: flex;
  margin: 0;
  padding: 1rem;
  
  // Colors & Typography
  color: var(--color-text);
  font-size: var(--font-size-base);
  
  // Other
  cursor: pointer;
  transition: all 0.2s ease;
}
```

### Python

#### 1. Functions and Methods

```python
def calculate_total(items: List[Item]) -> float:
    """
    Calculate the total price of active items.
    
    Args:
        items: List of items to calculate total from
        
    Returns:
        float: Total price of active items
    """
    return sum(item.price for item in items if item.is_active)
```

#### 2. Classes

```python
class UserService:
    def __init__(self, database: Database):
        self._database = database
        
    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        return self._database.query(User).get(user_id)
```

## Documentation Standards

### 1. Code Comments

```typescript
// Single-line comment for brief explanations
function validateEmail(email: string): boolean {
  // Use RFC 5322 standard for email validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Multi-line comment for complex functions
 * @param items - List of items to process
 * @param options - Processing options
 * @returns Processed items array
 */
function processItems(items: Item[], options: Options): ProcessedItem[] {
  // Implementation
}
```

### 2. Documentation Comments

```typescript
/**
 * Represents a user in the system.
 */
interface User {
  /** Unique identifier for the user */
  id: string;
  
  /** User's email address */
  email: string;
  
  /** User's role in the system */
  role: UserRole;
}
```

## Git Standards

### 1. Commit Messages

```bash
# Format: <type>(<scope>): <subject>
feat(auth): add OAuth2 authentication
fix(api): handle null response from server
docs(readme): update installation instructions
```

### 2. Branch Names

```bash
# Format: <type>/<description>
feature/add-user-authentication
bugfix/fix-login-validation
docs/update-api-docs
```

## Testing Standards

### 1. Unit Tests

```typescript
describe('UserService', () => {
  it('should return user when valid ID is provided', async () => {
    const service = new UserService(mockApi);
    const user = await service.getUser('123');
    expect(user).toBeDefined();
    expect(user.id).toBe('123');
  });
  
  it('should throw error when user not found', async () => {
    const service = new UserService(mockApi);
    await expect(service.getUser('invalid'))
      .rejects
      .toThrow('User not found');
  });
});
```

### 2. Integration Tests

```typescript
describe('Authentication Flow', () => {
  it('should authenticate user with valid credentials', async () => {
    const response = await api
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
      
    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
  });
});
```

## Error Handling

### 1. Error Types

```typescript
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

### 2. Error Handling Patterns

```typescript
async function fetchData(): Promise<Data> {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) {
      handleApiError(error);
    } else {
      handleUnexpectedError(error);
    }
    throw error;
  }
}
```

## Performance Standards

### 1. Code Optimization

```typescript
// Good - Cached computation
const memoizedCalculation = memoize((items: Item[]) => {
  return items.reduce((total, item) => total + item.price, 0);
});

// Bad - Repeated computation
function badCalculation(items: Item[]): number {
  return items.reduce((total, item) => total + item.price, 0);
}
```

### 2. Resource Loading

```typescript
// Good - Lazy loading
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Bad - Eager loading
import HeavyComponent from './HeavyComponent';
```

## Security Standards

### 1. Input Validation

```typescript
function processUserInput(input: unknown): string {
  if (typeof input !== 'string') {
    throw new ValidationError('Input must be a string');
  }
  
  return sanitizeInput(input);
}
```

### 2. Authentication

```typescript
async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    throw new AuthError('No token provided');
  }
  
  try {
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    throw new AuthError('Invalid token');
  }
}
```

## Code Review Guidelines

1. **Readability**
   - Is the code easy to understand?
   - Are variables and functions named clearly?
   - Is the code well-documented?

2. **Maintainability**
   - Is the code modular and reusable?
   - Are there any hardcoded values?
   - Is there any duplicate code?

3. **Performance**
   - Are there any obvious performance issues?
   - Is resource usage optimized?
   - Are expensive operations cached?

4. **Security**
   - Is user input properly validated?
   - Are security best practices followed?
   - Are there any potential vulnerabilities?

5. **Testing**
   - Are there sufficient tests?
   - Do tests cover edge cases?
   - Are tests meaningful and maintainable?
  </rewritten_file> 