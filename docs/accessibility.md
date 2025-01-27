# Accessibility Guidelines

## Table of Contents
- [ARIA Roles and Attributes](#aria-roles-and-attributes)
- [Keyboard Navigation](#keyboard-navigation)
- [Focus Management](#focus-management)
- [Screen Readers](#screen-readers)
- [Color and Contrast](#color-and-contrast)
- [Forms](#forms)
- [Media](#media)
- [Best Practices](#best-practices)

## ARIA Roles and Attributes

### Landmark Roles

Use landmark roles to define page structure:

```html
<header role="banner">
    <!-- Site header content -->
</header>

<nav role="navigation">
    <!-- Navigation content -->
</nav>

<main role="main">
    <!-- Main content -->
</main>

<aside role="complementary">
    <!-- Sidebar content -->
</aside>

<footer role="contentinfo">
    <!-- Footer content -->
</footer>
```

### Interactive Elements

Add ARIA attributes to interactive elements:

```html
<!-- Button with loading state -->
<button 
    aria-busy="true"
    aria-label="Loading..."
>
    <span class="spinner"></span>
    Loading
</button>

<!-- Expandable section -->
<button 
    aria-expanded="false"
    aria-controls="content-1"
>
    Show more
</button>
<div 
    id="content-1" 
    hidden
>
    <!-- Expandable content -->
</div>

<!-- Custom checkbox -->
<div 
    role="checkbox"
    aria-checked="false"
    tabindex="0"
>
    Accept terms
</div>
```

### Live Regions

Use live regions for dynamic content:

```html
<!-- Polite announcement -->
<div 
    role="status"
    aria-live="polite"
>
    <!-- Status messages -->
</div>

<!-- Assertive announcement -->
<div 
    role="alert"
    aria-live="assertive"
>
    <!-- Important alerts -->
</div>

<!-- Live region for results -->
<div 
    aria-live="polite"
    aria-atomic="true"
>
    <p>Found <span id="count">0</span> results</p>
</div>
```

## Keyboard Navigation

### Focus Management

Implement proper focus management:

```javascript
class FocusTrap {
    constructor(element) {
        this.element = element;
        this.focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        this.firstFocusable = this.focusableElements[0];
        this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    }
    
    trapFocus(e) {
        const isTabPressed = e.key === 'Tab';
        
        if (!isTabPressed) return;
        
        if (e.shiftKey) {
            if (document.activeElement === this.firstFocusable) {
                this.lastFocusable.focus();
                e.preventDefault();
            }
        } else {
            if (document.activeElement === this.lastFocusable) {
                this.firstFocusable.focus();
                e.preventDefault();
            }
        }
    }
    
    enable() {
        this.element.addEventListener('keydown', this.trapFocus.bind(this));
    }
    
    disable() {
        this.element.removeEventListener('keydown', this.trapFocus.bind(this));
    }
}
```

### Skip Links

Add skip links for keyboard users:

```html
<body>
    <a 
        href="#main-content"
        class="skip-link"
    >
        Skip to main content
    </a>
    
    <!-- Navigation -->
    
    <main id="main-content">
        <!-- Main content -->
    </main>
</body>

<style>
.skip-link {
    position: absolute;
    top: -40px;
    left: 0;
    padding: 8px;
    background: #000;
    color: #fff;
    z-index: 100;
    
    &:focus {
        top: 0;
    }
}
</style>
```

## Focus Management

### Focus Styles

Implement visible focus styles:

```scss
// Base focus styles
:focus {
    outline: 2px solid var(--color-focus);
    outline-offset: 2px;
}

// Custom focus styles
.custom-focus {
    &:focus {
        outline: none;
        box-shadow: 0 0 0 2px var(--color-focus);
    }
    
    &:focus:not(:focus-visible) {
        outline: none;
        box-shadow: none;
    }
    
    &:focus-visible {
        outline: none;
        box-shadow: 0 0 0 2px var(--color-focus);
    }
}
```

### Focus Order

Ensure logical focus order:

```html
<div class="modal" role="dialog">
    <button class="modal-close">Close</button>
    <h2 id="modal-title">Modal Title</h2>
    <div class="modal-content">
        <!-- Modal content -->
    </div>
    <div class="modal-footer">
        <button>Cancel</button>
        <button>Confirm</button>
    </div>
</div>

<style>
.modal-close {
    position: absolute;
    top: 1rem;
    right: 1rem;
}
</style>
```

## Screen Readers

### Alternative Text

Provide descriptive alternative text:

```html
<!-- Image with alt text -->
<img 
    src="chart.png" 
    alt="Bar chart showing sales data for Q1 2023"
>

<!-- Decorative image -->
<img 
    src="decoration.png" 
    alt=""
    role="presentation"
>

<!-- Complex image -->
<figure>
    <img 
        src="data-visualization.png" 
        alt="Complex data visualization"
    >
    <figcaption>
        Detailed description of the data visualization...
    </figcaption>
</figure>
```

### Hidden Content

Hide content properly:

```html
<!-- Visually hidden but available to screen readers -->
<span class="sr-only">
    Additional information for screen readers
</span>

<!-- Hidden from all users -->
<div hidden>
    This content is completely hidden
</div>

<style>
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
}
</style>
```

### Audio Content

We provide audio content with transcripts for accessibility:

```html
<figure>
    <audio controls>
        <source src="../src/dojopool/static/audio/checkingoutdojopool.mp3" type="audio/mpeg">
        Your browser does not support the audio element.
    </audio>
    <figcaption>
        <a href="transcripts/checkingoutdojopool.html">
            View transcript
        </a>
    </figcaption>
</figure>
```

### Transcripts

All audio content must have an accompanying transcript. Transcripts should:
- Be placed in the `docs/transcripts` directory
- Use clear, semantic HTML markup
- Include speaker identification when applicable
- Provide timestamps for longer content
- Include relevant non-speech audio information

Example transcript structure:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Transcript - Checking Out DojoPool</title>
</head>
<body>
    <main>
        <h1>Transcript: Checking Out DojoPool</h1>
        <article>
            <h2>Introduction</h2>
            <p><time>0:00</time> [Background music starts]</p>
            <p><time>0:05</time> <strong>Host:</strong> Welcome to DojoPool...</p>
            <!-- Additional transcript content -->
        </article>
    </main>
</body>
</html>
```

## Color and Contrast

### Contrast Ratios

Ensure sufficient color contrast:

```scss
:root {
    // Text colors with sufficient contrast
    --color-text: #222;          // Against light background
    --color-text-light: #fff;    // Against dark background
    
    // Interactive element colors
    --color-primary: #0066cc;    // Meets AA contrast
    --color-error: #d32f2f;      // Meets AA contrast
    --color-success: #2e7d32;    // Meets AA contrast
}

// Example usage
.button {
    background-color: var(--color-primary);
    color: var(--color-text-light);
    
    &:hover {
        background-color: darken(var(--color-primary), 10%);
    }
}
```

### Color Independence

Don't rely solely on color:

```html
<!-- Form validation -->
<div class="form-group">
    <input 
        type="text"
        class="is-invalid"
        aria-invalid="true"
    >
    <div class="error-message">
        <svg aria-hidden="true"><!-- Error icon --></svg>
        This field is required
    </div>
</div>

<style>
.is-invalid {
    border-color: var(--color-error);
}

.error-message {
    color: var(--color-error);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}
</style>
```

## Forms

### Form Labels

Label form controls properly:

```html
<!-- Standard label -->
<div class="form-group">
    <label for="username">Username</label>
    <input 
        type="text"
        id="username"
        name="username"
    >
</div>

<!-- Hidden label -->
<div class="form-group">
    <label for="search" class="sr-only">
        Search
    </label>
    <input 
        type="search"
        id="search"
        name="search"
        placeholder="Search..."
    >
</div>

<!-- Grouped controls -->
<fieldset>
    <legend>Notification Preferences</legend>
    
    <div class="checkbox-group">
        <input 
            type="checkbox"
            id="email-notifications"
            name="notifications"
            value="email"
        >
        <label for="email-notifications">
            Email notifications
        </label>
    </div>
</fieldset>
```

### Error Messages

Provide clear error messages:

```html
<div class="form-group">
    <label for="password">Password</label>
    <input 
        type="password"
        id="password"
        aria-describedby="password-error"
        aria-invalid="true"
    >
    <div 
        id="password-error"
        class="error-message"
        role="alert"
    >
        Password must be at least 8 characters
    </div>
</div>
```

## Media

### Video Captions

Provide captions for videos:

```html
<video controls>
    <source src="video.mp4" type="video/mp4">
    <track 
        kind="captions"
        src="captions.vtt"
        srclang="en"
        label="English"
        default
    >
</video>
```

### Audio Transcripts

Provide transcripts for audio content:

```html
<figure>
    <audio controls>
        <source src="../src/dojopool/static/media/podcast.mp3" type="audio/mpeg">
    </audio>
    <figcaption>
        <a href="../src/dojopool/static/media/transcript.html">
            View transcript
        </a>
    </figcaption>
</figure>
```