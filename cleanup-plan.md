# DojoPool Codebase Cleanup Plan

## 1. Component Organization
- Consolidate components into a single hierarchy under `/packages/frontend/src/components/`
- Use consistent naming conventions (PascalCase for component files)
- Keep specialized AI/ML components in `/src/dojopool/components/` 

## 2. Pages Organization
- Fix React 19 compatibility issues in all pages
  - Add `/** @jsxImportSource react */` to all page files
  - Use JSX syntax consistently instead of React.createElement()
  - Ensure all page components use default exports

## 3. Directory Structure Cleanup
- Remove duplicate directories after consolidating their contents
- Organize assets into a consistent structure
- Move tests adjacent to the components they test

## 4. Code Quality Improvements
- Standardize on TypeScript for all components
- Convert remaining JavaScript files to TypeScript
- Implement consistent error handling pattern
- Add proper typing to all components and functions

## 5. Configuration Files
- Consolidate multiple .eslintrc files, .babelrc files into single root config
- Ensure all configuration references exist and are valid

## 6. Dead Code Removal
- Remove backup directories and unused files
- Clean up commented-out code
- Delete duplicate assets and configurations

## Implementation Priority
1. Fix React 19 compatibility issues to ensure app runs properly
2. Consolidate component directories to simplify development
3. Clean up configuration files for consistent tooling
4. Address code quality in most critical components
5. Remove dead code to reduce repository size