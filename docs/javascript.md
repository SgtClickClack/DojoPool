# JavaScript Documentation

## Table of Contents

- [Event Handling](#event-handling)
- [Component Initialization](#component-initialization)
- [Form Validation](#form-validation)
- [Modal Management](#modal-management)
- [Theme Management](#theme-management)
- [Utilities](#utilities)

## Event Handling

### Event Delegation

```javascript
// Event delegation helper
function delegate(element, eventType, selector, handler) {
  element.addEventListener(eventType, (event) => {
    const target = event.target.closest(selector);
    if (target && element.contains(target)) {
      handler.call(target, event);
    }
  });
}

// Usage
delegate(document.body, 'click', '.btn', function (event) {
  // Handle button click
});
```

### Custom Events

```javascript
// Dispatch custom event
function emit(element, eventName, detail = {}) {
  const event = new CustomEvent(eventName, {
    bubbles: true,
    cancelable: true,
    detail,
  });
  element.dispatchEvent(event);
}

// Listen for custom event
element.addEventListener('custom:event', (event) => {
  const detail = event.detail;
  // Handle event
});
```

## Component Initialization

### Component Base Class

```javascript
class Component {
  constructor(element, options = {}) {
    this.element = element;
    this.options = { ...this.defaults, ...options };
    this.init();
  }

  init() {
    // Initialize component
  }

  destroy() {
    // Cleanup
  }
}
```

### Auto-Initialization

```javascript
function initComponents() {
  document.querySelectorAll('[data-component]').forEach((element) => {
    const name = element.dataset.component;
    const Component = componentRegistry[name];
    if (Component && !element._instance) {
      element._instance = new Component(element);
    }
  });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initComponents);
```

## Form Validation

### Input Validation

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

    // Validate and show feedback
    const isValid = this.validate(value, rules);
    this.showFeedback(input, isValid);
  }

  showFeedback(input, isValid) {
    const feedback = input.nextElementSibling;
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid);

    if (feedback) {
      feedback.textContent = isValid
        ? ''
        : input.dataset.errorMessage || 'Invalid input';
    }
  }
}
```

## Modal Management

### Modal Controller

```javascript
class Modal {
  constructor(element) {
    this.element = element;
    this.init();
  }

  init() {
    this.handleKeyboard = this.handleKeyboard.bind(this);
    this.setupCloseTriggers();
  }

  open() {
    this.element.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', this.handleKeyboard);
    this.trapFocus();
  }

  close() {
    this.element.classList.remove('is-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', this.handleKeyboard);
    this.restoreFocus();
  }

  handleKeyboard(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  trapFocus() {
    const focusableElements = this.element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    this.element.addEventListener('keydown', (event) => {
      if (event.key === 'Tab') {
        if (event.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            event.preventDefault();
          }
        }
      }
    });

    firstFocusable.focus();
  }
}
```

## Theme Management

### Theme Controller

```javascript
class ThemeController {
  constructor() {
    this.theme = localStorage.getItem('theme') || 'light';
    this.init();
  }

  init() {
    this.applyTheme();
    this.setupToggle();
    this.listenForSystemChanges();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    localStorage.setItem('theme', this.theme);
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme();
  }

  listenForSystemChanges() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.theme = e.matches ? 'dark' : 'light';
        this.applyTheme();
      }
    });
  }
}
```

## Utilities

### DOM Manipulation

```javascript
const dom = {
    // Create element with attributes and children
    createElement(tag, attrs = {}, ...children) {
        const element = document.createElement(tag);

        Object.entries(attrs).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'dataset') {
                Object.entries(value).forEach(([dataKey, dataValue]) => {
                    element.dataset[dataKey] = dataValue;
                });
            } else {
                element.setAttribute(key, value);
            }
        });

        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else {
                element.appendChild(child);
            }
        });

        return element;
    },

    // Remove element
    remove(element) {
        element && element.parentNode && element.parentNode.removeChild(element);
    },

    // Add/remove classes
    addClass(element, ...classes) {
        element.classList.add(...classes);
    },

    removeClass(element, ...classes) {
        element.classList.remove(...classes);
    },

    toggleClass(element, class, force) {
        element.classList.toggle(class, force);
    }
};
```

### Animation Utilities

```javascript
const animate = {
  // Fade in element
  fadeIn(element, duration = 300) {
    element.style.opacity = 0;
    element.style.display = '';

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        element.style.transition = `opacity ${duration}ms`;
        element.style.opacity = 1;

        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, duration);
      });
    });
  },

  // Fade out element
  fadeOut(element, duration = 300) {
    element.style.opacity = 1;

    return new Promise((resolve) => {
      element.style.transition = `opacity ${duration}ms`;
      element.style.opacity = 0;

      setTimeout(() => {
        element.style.display = 'none';
        element.style.transition = '';
        resolve();
      }, duration);
    });
  },

  // Slide down element
  slideDown(element, duration = 300) {
    element.style.display = '';
    const height = element.offsetHeight;
    element.style.overflow = 'hidden';
    element.style.height = 0;
    element.style.paddingTop = 0;
    element.style.paddingBottom = 0;
    element.style.marginTop = 0;
    element.style.marginBottom = 0;

    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        element.style.transition = `all ${duration}ms`;
        element.style.height = height + 'px';
        element.style.paddingTop = '';
        element.style.paddingBottom = '';
        element.style.marginTop = '';
        element.style.marginBottom = '';

        setTimeout(() => {
          element.style.height = '';
          element.style.overflow = '';
          element.style.transition = '';
          resolve();
        }, duration);
      });
    });
  },
};
```

### Form Utilities

```javascript
const form = {
  // Serialize form data
  serialize(form) {
    const formData = new FormData(form);
    const data = {};

    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        if (!Array.isArray(data[key])) {
          data[key] = [data[key]];
        }
        data[key].push(value);
      } else {
        data[key] = value;
      }
    }

    return data;
  },

  // Reset form with optional default values
  reset(form, defaults = {}) {
    form.reset();

    Object.entries(defaults).forEach(([name, value]) => {
      const field = form.elements[name];
      if (field) {
        field.value = value;
      }
    });
  },

  // Disable/enable form
  disable(form) {
    Array.from(form.elements).forEach((element) => {
      element.disabled = true;
    });
  },

  enable(form) {
    Array.from(form.elements).forEach((element) => {
      element.disabled = false;
    });
  },
};
```

### HTTP Utilities

```javascript
const http = {
  // Fetch wrapper with defaults
  async request(url, options = {}) {
    const defaults = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
    };

    const config = {
      ...defaults,
      ...options,
      headers: {
        ...defaults.headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        throw new Error(response.statusText);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      }

      return response.text();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  },

  // Convenience methods
  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  },

  post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  },
};
```

## Best Practices

1. **Event Handling**
   - Use event delegation for dynamic content
   - Clean up event listeners
   - Prevent memory leaks
   - Handle errors gracefully

2. **Component Design**
   - Follow single responsibility principle
   - Make components reusable
   - Document public APIs
   - Use TypeScript for better type safety

3. **Performance**
   - Debounce/throttle expensive operations
   - Use requestAnimationFrame for animations
   - Optimize DOM operations
   - Cache frequently accessed elements

4. **Accessibility**
   - Support keyboard navigation
   - Manage focus appropriately
   - Use ARIA attributes correctly
   - Test with screen readers

5. **Error Handling**
   - Use try-catch blocks
   - Provide meaningful error messages
   - Log errors appropriately
   - Gracefully degrade functionality
