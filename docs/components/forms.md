# Forms

Forms are used to collect user input. Our form components are designed to be accessible, easy to use, and provide clear feedback to users.

## Basic Usage

```html
<form class="form">
    <div class="form-group">
        <label for="username">Username</label>
        <input 
            type="text" 
            id="username" 
            class="form-control"
            placeholder="Enter username"
        >
    </div>
    <button type="submit" class="btn btn-primary">Submit</button>
</form>
```

## Form Controls

### Text Input

```html
<div class="form-group">
    <label for="name">Name</label>
    <input 
        type="text" 
        id="name" 
        class="form-control"
        placeholder="Enter your name"
    >
    <div class="form-hint">
        Enter your full name
    </div>
</div>
```

### Select

```html
<div class="form-group">
    <label for="country">Country</label>
    <select id="country" class="form-select">
        <option value="">Select a country</option>
        <option value="us">United States</option>
        <option value="uk">United Kingdom</option>
        <option value="ca">Canada</option>
    </select>
</div>
```

### Textarea

```html
<div class="form-group">
    <label for="message">Message</label>
    <textarea 
        id="message" 
        class="form-control"
        rows="3"
        placeholder="Enter your message"
    ></textarea>
</div>
```

### Checkbox

```html
<div class="form-check">
    <input 
        type="checkbox" 
        id="terms" 
        class="form-check-input"
    >
    <label class="form-check-label" for="terms">
        I agree to the terms
    </label>
</div>
```

### Radio Buttons

```html
<div class="form-radio-group">
    <div class="form-radio">
        <input 
            type="radio" 
            id="option1" 
            name="options" 
            class="form-radio-input"
        >
        <label class="form-radio-label" for="option1">
            Option 1
        </label>
    </div>
    <div class="form-radio">
        <input 
            type="radio" 
            id="option2" 
            name="options" 
            class="form-radio-input"
        >
        <label class="form-radio-label" for="option2">
            Option 2
        </label>
    </div>
</div>
```

## Validation States

### Valid State

```html
<div class="form-group">
    <label for="email">Email</label>
    <input 
        type="email" 
        id="email" 
        class="form-control is-valid"
        value="user@example.com"
    >
    <div class="form-feedback valid">
        Looks good!
    </div>
</div>
```

### Invalid State

```html
<div class="form-group">
    <label for="password">Password</label>
    <input 
        type="password" 
        id="password" 
        class="form-control is-invalid"
        aria-describedby="password-error"
    >
    <div 
        id="password-error" 
        class="form-feedback invalid"
    >
        Password must be at least 8 characters
    </div>
</div>
```

## Form Layout

### Horizontal Form

```html
<form class="form-horizontal">
    <div class="form-group row">
        <label 
            for="email" 
            class="col-sm-2 col-form-label"
        >
            Email
        </label>
        <div class="col-sm-10">
            <input 
                type="email" 
                class="form-control" 
                id="email"
            >
        </div>
    </div>
</form>
```

### Inline Form

```html
<form class="form-inline">
    <div class="form-group">
        <label for="username" class="sr-only">
            Username
        </label>
        <input 
            type="text" 
            class="form-control" 
            id="username"
            placeholder="Username"
        >
    </div>
    <div class="form-group">
        <label for="password" class="sr-only">
            Password
        </label>
        <input 
            type="password" 
            class="form-control" 
            id="password"
            placeholder="Password"
        >
    </div>
    <button type="submit" class="btn btn-primary">
        Sign in
    </button>
</form>
```

## Input Groups

```html
<div class="input-group">
    <span class="input-group-text">$</span>
    <input 
        type="text" 
        class="form-control" 
        aria-label="Amount"
    >
    <span class="input-group-text">.00</span>
</div>
```

## Form Utilities

### Floating Labels

```html
<div class="form-floating">
    <input 
        type="email" 
        class="form-control" 
        id="floatingEmail" 
        placeholder="name@example.com"
    >
    <label for="floatingEmail">Email address</label>
</div>
```

### Input Sizes

```html
<input 
    type="text" 
    class="form-control form-control-lg" 
    placeholder="Large input"
>
<input 
    type="text" 
    class="form-control" 
    placeholder="Default input"
>
<input 
    type="text" 
    class="form-control form-control-sm" 
    placeholder="Small input"
>
```

## Accessibility

### Labels and ARIA

- Always use labels with form controls
- Use aria-describedby for hints and errors
- Use aria-invalid for invalid fields
- Use fieldset and legend for grouped controls

```html
<div class="form-group">
    <label for="name">Name</label>
    <input 
        type="text" 
        id="name" 
        class="form-control"
        aria-describedby="name-hint"
        aria-invalid="true"
    >
    <div 
        id="name-hint" 
        class="form-hint"
    >
        Enter your full name
    </div>
</div>
```

### Keyboard Navigation

- Ensure proper tab order
- Support keyboard interaction for custom controls
- Provide clear focus states

## CSS Variables

```scss
// Form variables
--form-control-padding-x: 0.75rem;
--form-control-padding-y: 0.5rem;
--form-control-font-size: 1rem;
--form-control-line-height: 1.5;
--form-control-border-width: 1px;
--form-control-border-radius: 0.25rem;
--form-control-transition: border-color 0.15s ease-in-out;

// Form colors
--form-control-bg: var(--color-white);
--form-control-border-color: var(--color-gray-300);
--form-control-focus-border-color: var(--color-primary-500);
--form-control-focus-box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);

// Form validation colors
--form-feedback-valid-color: var(--color-success-500);
--form-feedback-invalid-color: var(--color-error-500);
```

## Implementation Details

### SCSS Structure

```scss
.form-control {
    display: block;
    width: 100%;
    padding: var(--form-control-padding-y) var(--form-control-padding-x);
    font-size: var(--form-control-font-size);
    line-height: var(--form-control-line-height);
    color: var(--form-control-color);
    background-color: var(--form-control-bg);
    border: var(--form-control-border-width) solid var(--form-control-border-color);
    border-radius: var(--form-control-border-radius);
    transition: var(--form-control-transition);
    
    &:focus {
        border-color: var(--form-control-focus-border-color);
        box-shadow: var(--form-control-focus-box-shadow);
        outline: 0;
    }
    
    &.is-valid {
        border-color: var(--form-feedback-valid-color);
    }
    
    &.is-invalid {
        border-color: var(--form-feedback-invalid-color);
    }
}
```

### JavaScript Validation

```javascript
class FormValidator {
    constructor(form) {
        this.form = form;
        this.init();
    }
    
    init() {
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.form.addEventListener('input', this.handleInput.bind(this));
    }
    
    handleSubmit(event) {
        if (!this.validateForm()) {
            event.preventDefault();
        }
    }
    
    handleInput(event) {
        const input = event.target;
        this.validateField(input);
    }
    
    validateField(input) {
        const value = input.value;
        const rules = input.dataset.rules;
        
        const isValid = this.validate(value, rules);
        this.showFeedback(input, isValid);
    }
    
    showFeedback(input, isValid) {
        input.classList.toggle('is-valid', isValid);
        input.classList.toggle('is-invalid', !isValid);
        
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('form-feedback')) {
            feedback.textContent = isValid ? 
                'Looks good!' : 
                input.dataset.errorMessage || 'This field is invalid';
        }
    }
}
```

## Browser Support

The form components are supported in all modern browsers:
- Chrome (last 2 versions)
- Firefox (last 2 versions)
- Safari (last 2 versions)
- Edge (last 2 versions)

## Related Components

- [Buttons](./buttons.md) - For form submission
- [Validation](./validation.md) - For form validation patterns
- [Tooltips](./tooltips.md) - For form hints and errors 