# Component Documentation

## Table of Contents
- [Buttons](#buttons)
- [Forms](#forms)
- [Cards](#cards)
- [Modals](#modals)
- [Navigation](#navigation)
- [Tables](#tables)
- [Alerts](#alerts)
- [Loaders](#loaders)
- [Tooltips](#tooltips)
- [Badges](#badges)
- [Avatars](#avatars)

## Buttons

Buttons are used for actions, such as submitting forms, triggering modals, or navigating between pages.

### Basic Usage

```html
<button class="btn btn-primary">Primary Button</button>
```

### Variants

```html
<!-- Primary Button -->
<button class="btn btn-primary">Primary</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Secondary</button>

<!-- Outline Button -->
<button class="btn btn-outline">Outline</button>

<!-- Ghost Button -->
<button class="btn btn-ghost">Ghost</button>

<!-- Danger Button -->
<button class="btn btn-danger">Danger</button>

<!-- Success Button -->
<button class="btn btn-success">Success</button>
```

### Sizes

```html
<!-- Extra Small -->
<button class="btn btn-xs">Extra Small</button>

<!-- Small -->
<button class="btn btn-sm">Small</button>

<!-- Default -->
<button class="btn">Default</button>

<!-- Large -->
<button class="btn btn-lg">Large</button>

<!-- Extra Large -->
<button class="btn btn-xl">Extra Large</button>
```

### States

```html
<!-- Disabled -->
<button class="btn" disabled>Disabled</button>

<!-- Loading -->
<button class="btn btn-loading">
    <span class="loader"></span>
    Loading...
</button>

<!-- Active -->
<button class="btn active">Active</button>
```

### Icon Buttons

```html
<!-- Icon Only -->
<button class="btn btn-icon" aria-label="Settings">
    <svg><!-- icon svg --></svg>
</button>

<!-- Icon with Text -->
<button class="btn">
    <svg><!-- icon svg --></svg>
    Settings
</button>
```

### Accessibility

- Use `button` elements for clickable actions
- Use `a` elements for navigation
- Always include aria-label for icon-only buttons
- Ensure disabled buttons have proper styling and aria-disabled
- Maintain sufficient color contrast

## Forms

Forms are used for collecting user input.

### Text Input

```html
<div class="form-group">
    <label for="username" class="form-label">Username</label>
    <input 
        type="text" 
        id="username" 
        class="form-control" 
        placeholder="Enter username"
        aria-describedby="username-hint"
    />
    <div id="username-hint" class="form-hint">
        Username must be at least 3 characters
    </div>
</div>
```

### Select

```html
<div class="form-group">
    <label for="country" class="form-label">Country</label>
    <select id="country" class="form-select">
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
    </select>
</div>
```

### Checkbox

```html
<div class="form-check">
    <input 
        type="checkbox" 
        id="terms" 
        class="form-check-input"
    />
    <label for="terms" class="form-check-label">
        I agree to the terms
    </label>
</div>
```

### Radio

```html
<div class="form-radio-group">
    <div class="form-radio">
        <input 
            type="radio" 
            id="option1" 
            name="options" 
            class="form-radio-input"
        />
        <label for="option1" class="form-radio-label">
            Option 1
        </label>
    </div>
</div>
```

### Validation States

```html
<!-- Valid State -->
<div class="form-group">
    <input 
        type="text" 
        class="form-control is-valid" 
        aria-invalid="false"
    />
    <div class="form-feedback valid">Looks good!</div>
</div>

<!-- Invalid State -->
<div class="form-group">
    <input 
        type="text" 
        class="form-control is-invalid" 
        aria-invalid="true"
    />
    <div class="form-feedback invalid">
        This field is required
    </div>
</div>
```

### Accessibility

- Always use labels with form controls
- Use fieldsets and legends for grouped controls
- Provide clear error messages
- Use aria-describedby for hints and errors
- Ensure proper focus states

## Cards

Cards are used to group related content.

### Basic Card

```html
<div class="card">
    <div class="card-header">
        <h3 class="card-title">Card Title</h3>
    </div>
    <div class="card-body">
        Card content goes here
    </div>
    <div class="card-footer">
        Card footer
    </div>
</div>
```

### Image Card

```html
<div class="card">
    <img 
        src="image.jpg" 
        alt="Card image" 
        class="card-img-top"
    />
    <div class="card-body">
        <h3 class="card-title">Card Title</h3>
        <p class="card-text">Card description</p>
    </div>
</div>
```

### Action Card

```html
<div class="card">
    <div class="card-body">
        <h3 class="card-title">Card Title</h3>
        <p class="card-text">Card description</p>
        <div class="card-actions">
            <button class="btn btn-primary">Action</button>
            <button class="btn btn-secondary">Cancel</button>
        </div>
    </div>
</div>
```

### Accessibility

- Use proper heading hierarchy
- Ensure interactive elements are keyboard accessible
- Maintain proper color contrast
- Use semantic HTML structure

## Modals

Modals are used for displaying content that requires user attention.

### Basic Modal

```html
<div 
    class="modal" 
    role="dialog" 
    aria-modal="true" 
    aria-labelledby="modal-title"
>
    <div class="modal-overlay"></div>
    <div class="modal-container">
        <div class="modal-header">
            <h2 id="modal-title" class="modal-title">
                Modal Title
            </h2>
            <button 
                class="modal-close" 
                aria-label="Close modal"
            >
                ×
            </button>
        </div>
        <div class="modal-body">
            Modal content goes here
        </div>
        <div class="modal-footer">
            <button class="btn btn-primary">Save</button>
            <button class="btn btn-secondary">Cancel</button>
        </div>
    </div>
</div>
```

### Accessibility

- Use proper ARIA attributes
- Trap focus within modal
- Close on escape key
- Return focus on close
- Ensure proper z-index management

## Navigation

Navigation components for moving between pages and sections.

### Navbar

```html
<nav class="navbar" role="navigation">
    <div class="navbar-brand">
        <a href="/" class="navbar-logo">Logo</a>
    </div>
    <div class="navbar-menu">
        <a href="/home" class="navbar-item">Home</a>
        <a href="/about" class="navbar-item">About</a>
        <div class="navbar-dropdown">
            <button 
                class="navbar-dropdown-toggle"
                aria-expanded="false"
            >
                More
            </button>
            <div class="navbar-dropdown-menu">
                <a href="/settings" class="navbar-item">
                    Settings
                </a>
            </div>
        </div>
    </div>
</nav>
```

### Tabs

```html
<div class="tabs" role="tablist">
    <button 
        role="tab" 
        aria-selected="true" 
        aria-controls="panel-1"
    >
        Tab 1
    </button>
    <button 
        role="tab" 
        aria-selected="false" 
        aria-controls="panel-2"
    >
        Tab 2
    </button>
</div>
<div 
    id="panel-1" 
    role="tabpanel" 
    aria-labelledby="tab-1"
>
    Panel 1 content
</div>
```

### Accessibility

- Use proper ARIA roles
- Support keyboard navigation
- Indicate current page
- Provide skip links
- Ensure proper focus management

## Best Practices

1. **Component Structure**
   - Use semantic HTML
   - Keep components modular
   - Follow consistent naming
   - Document props and events

2. **Accessibility**
   - Include proper ARIA attributes
   - Support keyboard navigation
   - Maintain focus management
   - Provide text alternatives

3. **Styling**
   - Use CSS custom properties
   - Follow BEM methodology
   - Keep specificity low
   - Use utility classes when appropriate

4. **JavaScript**
   - Use event delegation
   - Handle errors gracefully
   - Manage state properly
   - Clean up event listeners

5. **Performance**
   - Lazy load when possible
   - Minimize reflows
   - Use efficient selectors
   - Optimize animations

## Tables

Tables are used for displaying structured data.

### Basic Table

```html
<table class="table">
    <thead>
        <tr>
            <th scope="col">Header 1</th>
            <th scope="col">Header 2</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Cell 1</td>
            <td>Cell 2</td>
        </tr>
    </tbody>
</table>
```

### Striped Table

```html
<table class="table table-striped">
    <!-- table content -->
</table>
```

### Responsive Table

```html
<div class="table-responsive">
    <table class="table">
        <!-- table content -->
    </table>
</div>
```

### Accessibility

- Use proper table structure (thead, tbody, tfoot)
- Include scope attributes on header cells
- Provide captions when needed
- Ensure proper color contrast
- Support keyboard navigation

## Alerts

Alerts are used to display important messages to users.

### Basic Alert

```html
<div 
    class="alert alert-info" 
    role="alert"
>
    This is an informational message
</div>
```

### Alert with Icon

```html
<div class="alert alert-success" role="alert">
    <svg class="alert-icon"><!-- success icon --></svg>
    <div class="alert-content">
        Operation completed successfully
    </div>
</div>
```

### Dismissible Alert

```html
<div 
    class="alert alert-warning" 
    role="alert"
>
    <div class="alert-content">
        Warning message
    </div>
    <button 
        class="alert-close" 
        aria-label="Close alert"
    >
        ×
    </button>
</div>
```

### Accessibility

- Use proper ARIA roles
- Ensure color is not the only indicator
- Make close buttons accessible
- Announce dynamic alerts to screen readers

## Loaders

Loaders indicate that content is being loaded.

### Spinner

```html
<div 
    class="spinner" 
    role="status"
>
    <span class="sr-only">Loading...</span>
</div>
```

### Progress Bar

```html
<div class="progress">
    <div 
        class="progress-bar" 
        role="progressbar" 
        aria-valuenow="75" 
        aria-valuemin="0" 
        aria-valuemax="100" 
        style="width: 75%"
    >
        75%
    </div>
</div>
```

### Skeleton Loader

```html
<div class="skeleton-loader">
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
    <div class="skeleton-line"></div>
</div>
```

### Accessibility

- Include text for screen readers
- Use ARIA attributes for progress
- Ensure animations respect reduced motion preferences
- Provide clear loading state indicators

## Tooltips

Tooltips provide additional information about elements.

### Basic Tooltip

```html
<button 
    class="btn" 
    data-tooltip="Tooltip text"
    aria-describedby="tooltip-1"
>
    Hover me
</button>
<div 
    id="tooltip-1" 
    class="tooltip" 
    role="tooltip"
>
    Tooltip text
</div>
```

### Positioned Tooltip

```html
<button 
    class="btn" 
    data-tooltip="Top tooltip"
    data-tooltip-position="top"
>
    Top
</button>
```

### Accessibility

- Use aria-describedby for tooltip content
- Ensure tooltips are keyboard accessible
- Position tooltips close to trigger elements
- Make tooltips dismissible

## Badges

Badges are used to highlight or display counts.

### Basic Badge

```html
<span class="badge">New</span>
```

### Status Badge

```html
<span class="badge badge-success">Active</span>
<span class="badge badge-danger">Inactive</span>
```

### Count Badge

```html
<button class="btn">
    Messages
    <span class="badge badge-count">4</span>
</button>
```

### Accessibility

- Use appropriate color contrast
- Include text alternatives when needed
- Ensure badges are readable
- Position badges consistently

## Avatars

Avatars represent users or entities.

### Basic Avatar

```html
<img 
    class="avatar" 
    src="user.jpg" 
    alt="User name"
/>
```

### Avatar Sizes

```html
<img class="avatar avatar-sm" src="user.jpg" alt="User">
<img class="avatar avatar-md" src="user.jpg" alt="User">
<img class="avatar avatar-lg" src="user.jpg" alt="User">
```

### Avatar with Fallback

```html
<div class="avatar">
    <span class="avatar-initials">JD</span>
</div>
```

### Avatar Group

```html
<div class="avatar-group">
    <img class="avatar" src="user1.jpg" alt="User 1">
    <img class="avatar" src="user2.jpg" alt="User 2">
    <div class="avatar">
        <span class="avatar-more">+3</span>
    </div>
</div>
```

### Accessibility

- Include descriptive alt text
- Use proper image aspect ratios
- Ensure fallback content is accessible
- Maintain proper color contrast for initials
  </rewritten_file> 