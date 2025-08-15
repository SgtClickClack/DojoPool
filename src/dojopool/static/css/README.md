# CSS Organization Guidelines

## Directory Structure
```
css/
├── base.css        # Base styles, variables, and utilities
├── components/     # Component-specific styles
├── layouts/        # Layout and grid styles
└── themes/         # Theme variations
```

## Naming Conventions
1. Use kebab-case for file names and class names
2. Follow BEM (Block Element Modifier) methodology
3. Prefix utility classes with `u-`
4. Prefix theme classes with `theme-`
5. Prefix component classes with `c-`

## File Organization
1. Each file should have a clear purpose
2. Group related styles together
3. Use comments to explain complex selectors
4. Keep specificity low
5. Avoid deep nesting

## Performance Guidelines
1. Use CSS variables for theme values
2. Minimize use of expensive properties
3. Optimize media queries
4. Consider mobile-first approach
5. Use appropriate units (rem, em, %)

## Responsive Design
1. Use standard breakpoints:
   - sm: 576px
   - md: 768px
   - lg: 992px
   - xl: 1200px
   - xxl: 1400px

2. Implement mobile-first media queries:
   ```css
   /* Mobile first */
   .element {
     /* Base styles */
   }
   
   @media (min-width: 768px) {
     /* Tablet and up */
   }
   
   @media (min-width: 992px) {
     /* Desktop and up */
   }
   ```

## Best Practices
1. Keep selectors short and efficient
2. Avoid !important declarations
3. Use CSS Grid and Flexbox appropriately
4. Maintain consistent spacing
5. Document complex implementations

## Documentation
1. Add comments for:
   - File purpose
   - Complex selectors
   - Magic numbers
   - Browser-specific code
   - Performance considerations

2. Example:
   ```css
   /* Component: Card
   * Description: Standard card component with hover effects
   * Usage: Add class 'c-card' to container element
   */
   .c-card {
     /* Base styles */
   }
   ```

## Maintenance
1. Regular cleanup of unused styles
2. Performance monitoring
3. Browser compatibility checks
4. Documentation updates
5. Code review guidelines

## Version Control
1. Document significant changes
2. Keep track of browser support
3. Note performance impacts
4. Update documentation
5. Follow semantic versioning 