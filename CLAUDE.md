# DojoPool Development Guide

## Build & Test Commands
- `npm run dev` - Start development server
- `npm run dev -- -p 3001` - Start development server on port 3001
- `npm run build` - Build for production
- `npm run test` - Run all tests
- `npm run test -- -t "test name"` - Run specific test
- `npm run lint` - Check code quality
- `npm run lint:fix` - Automatically fix linting issues
- `npm run type-check` - Verify TypeScript types

## Code Style Guidelines
- **Formatting**: 2-space indentation, 100 char line limit, single quotes, trailing commas
- **Imports**: Group by external/internal, sort alphabetically
- **TypeScript**: Strict typing required, explicit return types on functions
- **Components**: Use functional components with hooks, avoid class components
- **Error Handling**: Use try/catch with specific error types, utilize ErrorBoundary for React components
- **Naming**: camelCase for variables/functions, PascalCase for components/classes, UPPER_CASE for constants
- **Testing**: Write unit tests for business logic and integration tests for components

## React 19 Compatibility
- Add `/** @jsxImportSource react */` at the top of all component/page files
- Use JSX syntax consistently (avoid React.createElement() when possible)
- Ensure all page components use default exports
- If you must use React.createElement(), do so consistently in the file
- Use the correct import paths (many components are in packages/frontend/src/components)

## Architecture Patterns
- Next.js 15.x for frontend with React 19
- Material UI for component library
- Express/Socket.io for real-time functionality
- TypeScript for type safety