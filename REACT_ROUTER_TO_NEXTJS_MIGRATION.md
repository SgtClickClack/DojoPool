# React Router to Next.js Migration Guide

## Overview

This document outlines the approach for migrating from react-router-dom to Next.js routing in the DojoPool project. The migration involves replacing react-router-dom components and hooks with their Next.js equivalents and leveraging Next.js's file-based routing system.

## Completed Changes

1. Created `_app.tsx` in the pages directory to handle global layout and theme
2. Refactored `src/pages/index.tsx` to use Next.js Link components
3. Updated `src/hooks/useGameFlow.ts` to use Next.js useRouter hook
4. Partially refactored `src/components/layout/Navbar.tsx` to demonstrate the pattern

## Migration Patterns

### 1. Replace Link Components

**From react-router-dom:**
```jsx
<Button
  component={RouterLink}
  to="/some-path"
  sx={{ ... }}
>
  Button Text
</Button>
```

**To Next.js:**
```jsx
<Link href="/some-path" passHref>
  <Button
    sx={{ ... }}
  >
    Button Text
  </Button>
</Link>
```

### 2. Replace Programmatic Navigation

**From react-router-dom:**
```jsx
import { useNavigate } from 'react-router-dom';

const Component = () => {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate('/some-path');
  };
  
  return <button onClick={handleClick}>Navigate</button>;
};
```

**To Next.js:**
```jsx
import { useRouter } from 'next/router';

const Component = () => {
  const router = useRouter();
  
  const handleClick = () => {
    router.push('/some-path');
  };
  
  return <button onClick={handleClick}>Navigate</button>;
};
```

### 3. Replace Route Parameters

**From react-router-dom:**
```jsx
import { useParams } from 'react-router-dom';

const Component = () => {
  const { id } = useParams();
  
  return <div>ID: {id}</div>;
};
```

**To Next.js:**
```jsx
import { useRouter } from 'next/router';

const Component = () => {
  const router = useRouter();
  const { id } = router.query;
  
  return <div>ID: {id}</div>;
};
```

### 4. Replace Routes and Route Components

**From react-router-dom:**
```jsx
<Router>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/about" element={<AboutPage />} />
    <Route path="/contact" element={<ContactPage />} />
  </Routes>
</Router>
```

**To Next.js:**
Create separate files in the pages directory:
- `pages/index.tsx` for the home page
- `pages/about.tsx` for the about page
- `pages/contact.tsx` for the contact page

## Remaining Work

1. **Complete Navbar Refactoring**: Finish updating all navigation links in `src/components/layout/Navbar.tsx`

2. **Refactor Additional Components**: Update all remaining components that use react-router-dom:
   - Components in `src/frontend` directory
   - Components in `src/components` directory
   - Components in `src/dojopool/frontend` directory

3. **Update Nested Package Dependencies**: Remove react-router-dom from `src/dojopool/frontend/package.json`

4. **Testing and Validation**:
   - Test all navigation flows to ensure they work correctly
   - Verify that all links and programmatic navigation function as expected
   - Check that route parameters are properly passed and accessed

## Recommendations

1. **Incremental Approach**: Continue the migration incrementally, focusing on one component or feature at a time.

2. **Comprehensive Testing**: After each component is refactored, thoroughly test its navigation functionality.

3. **Documentation**: Update component documentation to reflect the new routing approach.

4. **Code Review**: Conduct thorough code reviews to ensure all react-router-dom usages have been properly migrated.

5. **Performance Monitoring**: Monitor application performance before and after the migration to identify any potential issues.

## Conclusion

The migration from react-router-dom to Next.js routing will improve the consistency of the codebase and leverage the built-in features of Next.js. The patterns demonstrated in this document provide a clear path for completing the migration across the entire application.