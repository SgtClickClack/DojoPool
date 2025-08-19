# Buttons

Buttons are used to trigger actions or navigation. They communicate calls to action to users and allow them to interact with our application.

## Basic Usage

```html
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary">Secondary Button</button>
<button class="btn btn-outline">Outline Button</button>
```

## Button Variants

### Primary Button

Used for primary actions and main calls to action.

```html
<button class="btn btn-primary">Primary Action</button>
```

### Secondary Button

Used for secondary actions and alternative options.

```html
<button class="btn btn-secondary">Secondary Action</button>
```

### Outline Button

Used for less prominent actions or in places where a subtle button is needed.

```html
<button class="btn btn-outline">Outline Action</button>
```

### Ghost Button

Used for the least prominent actions or in places where a very subtle button is needed.

```html
<button class="btn btn-ghost">Ghost Action</button>
```

## Button Sizes

```html
<button class="btn btn-xs">Extra Small</button>
<button class="btn btn-sm">Small</button>
<button class="btn">Default</button>
<button class="btn btn-lg">Large</button>
<button class="btn btn-xl">Extra Large</button>
```

## States

### Loading State

Show a loading spinner when the button is processing an action.

```html
<button class="btn btn-primary btn-loading">
  <span class="spinner"></span>
  Loading...
</button>
```

### Disabled State

Use when the action is not available.

```html
<button class="btn btn-primary" disabled>Disabled Button</button>
```

## Icon Buttons

### Icon Only

For actions that can be represented by an icon alone. Always include an aria-label.

```html
<button class="btn btn-icon" aria-label="Settings">
  <svg><!-- settings icon --></svg>
</button>
```

### Icon with Text

For actions where both icon and text enhance understanding.

```html
<button class="btn btn-primary">
  <svg><!-- save icon --></svg>
  Save Changes
</button>
```

## Button Groups

Group related buttons together.

```html
<div class="btn-group">
  <button class="btn btn-primary">Left</button>
  <button class="btn btn-primary">Middle</button>
  <button class="btn btn-primary">Right</button>
</div>
```

## Full Width Buttons

Buttons that span the full width of their container.

```html
<button class="btn btn-primary btn-block">Full Width Button</button>
```

## Accessibility

### Keyboard Navigation

- Buttons are focusable and can be activated with Enter or Space
- Maintain a visible focus state
- Use proper HTML button elements for clickable actions

### Screen Readers

- Use aria-label for icon-only buttons
- Provide meaningful text content
- Use aria-disabled instead of disabled when appropriate

### Best Practices

- Use button elements for clickable actions
- Use anchor tags for navigation
- Maintain sufficient color contrast
- Provide visual feedback for interactions

## CSS Variables

```scss
// Button variables
--btn-padding-x: 1rem;
--btn-padding-y: 0.5rem;
--btn-font-size: 1rem;
--btn-line-height: 1.5;
--btn-border-radius: 0.25rem;
--btn-transition: all 0.2s ease-in-out;

// Button colors
--btn-primary-bg: var(--color-primary-500);
--btn-primary-color: var(--color-white);
--btn-primary-hover-bg: var(--color-primary-600);

--btn-secondary-bg: var(--color-gray-500);
--btn-secondary-color: var(--color-white);
--btn-secondary-hover-bg: var(--color-gray-600);
```

## Examples

### Form Submit Button

```html
<form>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" id="email" />
  </div>
  <button type="submit" class="btn btn-primary">Submit Form</button>
</form>
```

### Delete Confirmation Button

```html
<button class="btn btn-danger" data-confirm="Are you sure?">Delete Item</button>
```

### Save with Loading State

```html
<button class="btn btn-primary" id="saveButton">
  <span class="btn-content">Save Changes</span>
  <span class="btn-loading hidden">
    <span class="spinner"></span>
    Saving...
  </span>
</button>
```

## Implementation Details

### SCSS Structure

```scss
.btn {
  // Base styles
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--btn-padding-y) var(--btn-padding-x);
  font-size: var(--btn-font-size);
  line-height: var(--btn-line-height);
  border-radius: var(--btn-border-radius);
  transition: var(--btn-transition);

  // Variants
  &-primary {
    background-color: var(--btn-primary-bg);
    color: var(--btn-primary-color);

    &:hover {
      background-color: var(--btn-primary-hover-bg);
    }
  }

  // States
  &:disabled {
    opacity: 0.65;
    pointer-events: none;
  }

  &-loading {
    position: relative;
    pointer-events: none;

    .spinner {
      margin-right: 0.5rem;
    }
  }
}
```

### JavaScript Behavior

```javascript
class Button {
  constructor(element) {
    this.element = element;
    this.init();
  }

  init() {
    if (this.element.dataset.confirm) {
      this.setupConfirmation();
    }

    if (this.element.classList.contains('btn-loading')) {
      this.setupLoadingState();
    }
  }

  setupConfirmation() {
    this.element.addEventListener('click', (e) => {
      if (!confirm(this.element.dataset.confirm)) {
        e.preventDefault();
      }
    });
  }

  setLoading(isLoading) {
    const content = this.element.querySelector('.btn-content');
    const loadingEl = this.element.querySelector('.btn-loading');

    if (isLoading) {
      content.classList.add('hidden');
      loadingEl.classList.remove('hidden');
      this.element.setAttribute('disabled', '');
    } else {
      content.classList.remove('hidden');
      loadingEl.classList.add('hidden');
      this.element.removeAttribute('disabled');
    }
  }
}
```

## Browser Support

The button component is supported in all modern browsers:

- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Related Components

- [Forms](./forms.md) - For form submission buttons
- [Modals](./modals.md) - For modal action buttons
- [Cards](./cards.md) - For card action buttons
