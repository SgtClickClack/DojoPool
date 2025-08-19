# Style Optimization Suggestions

## 1. CSS Variables

Consider creating a `variables.scss` file with common values:

```scss
:root {
  --color-background: value;
  --color-surface: value;
  --color-overlay: value;
  --color-text-primary: value;
  --color-text-secondary: value;
  --color-text-tertiary: value;
  --color-text-disabled: value;
  --color-border-primary: value;
  --color-border-secondary: value;
  --color-button-primary: value;
  --color-button-primary-hover: value;
  --color-button-primary-active: value;
  --color-input-background: value;
  --color-input-border: value;
  --color-input-focus: value;
  --color-card-background: value;
  --color-card-border: value;
  --color-modal-background: value;
  --color-modal-overlay: value;
  --shadow-sm: value;
  --shadow-base: value;
  --shadow-md: value;
  --shadow-lg: value;
  --shadow-xl: value;
  --color-success-background: value;
  --color-success-border: value;
  --color-success-text: value;
  --color-warning-background: value;
  --color-warning-border: value;
  --color-warning-text: value;
  --color-error-background: value;
  --color-error-border: value;
  --color-error-text: value;
  --color-primary-50: value;
  --color-primary-100: value;
  --color-primary-200: value;
  --color-primary-300: value;
  --color-primary-400: value;
  --color-primary-500: value;
  --color-primary-600: value;
  --color-primary-700: value;
  --color-primary-800: value;
  --color-primary-900: value;
  --color-secondary-50: value;
  --color-secondary-100: value;
  --color-secondary-200: value;
  --color-secondary-300: value;
  --color-secondary-400: value;
  --color-secondary-500: value;
  --color-secondary-600: value;
  --color-secondary-700: value;
  --color-secondary-800: value;
  --color-secondary-900: value;
  --color-neutral-50: value;
  --color-neutral-100: value;
  --color-neutral-200: value;
  --color-neutral-300: value;
  --color-neutral-400: value;
  --color-neutral-500: value;
  --color-neutral-600: value;
  --color-neutral-700: value;
  --color-neutral-800: value;
  --color-neutral-900: value;
  --color-success-50: value;
  --color-success-500: value;
  --color-success-900: value;
  --color-warning-50: value;
  --color-warning-500: value;
  --color-warning-900: value;
  --color-error-50: value;
  --color-error-500: value;
  --color-error-900: value;
  --radius-sm: value;
  --radius-base: value;
  --radius-md: value;
  --radius-lg: value;
  --radius-xl: value;
  --radius-2xl: value;
  --radius-full: value;
  --transition-fast: value;
  --transition-base: value;
  --transition-slow: value;
  --z-hide: value;
  --z-base: value;
  --z-dropdown: value;
  --z-sticky: value;
  --z-fixed: value;
  --z-modal-backdrop: value;
  --z-modal: value;
  --z-popover: value;
  --z-tooltip: value;
  --z-toast: value;
  --header-height: value;
  --sidebar-width: value;
  --footer-height: value;
  --grid-columns: value;
  --grid-gutter-width: value;
  --bg-opacity: value;
  --border-opacity: value;
  --gradient-from-color: value;
  --gradient-color-stops: value;
  --gradient-via-color: value;
  --gradient-to-color: value;
  --bg-dark: value;
  --text-primary: value;
  --text-secondary: value;
  --breakpoint-xs: value;
  --breakpoint-sm: value;
  --breakpoint-md: value;
  --breakpoint-lg: value;
  --breakpoint-xl: value;
  --breakpoint-xxl: value;
  --content-max-width: value;
  --spacing-unit: value;
  --border-radius: value;
  --transition-speed: value;
  --text-color: value;
  --background-color: value;
  --border-color: value;
  --primary-color: value;
  --secondary-color: value;
  --accent-color: value;
  --text-light: value;
  --background-dark: value;
  --neon-glow: value;
  --light-text: value;
  --dark-bg: value;
  --navbar-height: value;
  --touch-target-size: value;
  --touch-target-spacing: value;
  --safe-area-inset-top: value;
  --safe-area-inset-bottom: value;
  --safe-area-inset-left: value;
  --safe-area-inset-right: value;
}
```

## 2. Media Queries

Consider using mixins for common media queries:

```scss
@mixin mobile {
  @media (max-width: 768px) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: 769px) and (max-width: 1024px) {
    @content;
  }
}
```

## 3. Selector Optimization

Consider consolidating these duplicate selectors into shared style files:

- `.ant-card` (used in 2 files)
- `&.bronze` (used in 2 files)
- `.ant-tag` (used in 2 files)
- `p` (used in 3 files)
- `&-content` (used in 2 files)
- `&.silver` (used in 2 files)
- `}
  }

  .ant-modal` (used in 2 files)

- `.venue-list` (used in 2 files)
- `&:hover` (used in 4 files)
- `&:focus-visible` (used in 2 files)
- `to` (used in 10 files)
- `body` (used in 6 files)
- `h3` (used in 5 files)
- `&:disabled` (used in 3 files)
- `h6` (used in 2 files)
- `h5` (used in 2 files)
- `h2` (used in 3 files)
- `h4` (used in 3 files)
- `&::placeholder` (used in 2 files)
- `.icon` (used in 6 files)
- `&::after` (used in 2 files)
- `}

@keyframes shimmer` (used in 3 files)

- `&:active` (used in 3 files)
- `100%` (used in 11 files)
- `&:last-child` (used in 3 files)
- `&:not(:last-child)` (used in 2 files)
- `.card-title` (used in 2 files)
- `.card-body` (used in 2 files)
- `}

@keyframes spin` (used in 3 files)

- `50%` (used in 9 files)
- `}

@keyframes pulse` (used in 3 files)

- `-#` (used in 6 files)
- `.navbar-brand` (used in 3 files)
- `&.active` (used in 4 files)
- `.nav-item` (used in 3 files)
- `` (used in 8 files)
- `.empty-title` (used in 2 files)
- `.empty-description` (used in 2 files)
- `}
  }

@keyframes spin` (used in 2 files)

- `&::before` (used in 3 files)
- `.d-inline-flex` (used in 2 files)
- `-flex` (used in 2 files)
- `-center` (used in 2 files)
- `-inline-flex` (used in 2 files)
- `.d-#` (used in 2 files)
- `&.negative` (used in 2 files)
- `@include breakpoint(lg)` (used in 3 files)
- `}

@keyframes shake` (used in 2 files)

- `.stat-label` (used in 6 files)
- `.stat-item` (used in 2 files)
- `.player-info` (used in 3 files)
- `.section-title` (used in 2 files)
- `.hero-title` (used in 2 files)
- `.container` (used in 3 files)
- `.section-description` (used in 3 files)
- `.header-title` (used in 3 files)
- `.header-description` (used in 3 files)
- `.filter-group` (used in 2 files)
- `.filters-grid` (used in 2 files)
- `.header-actions` (used in 3 files)
- `.profile-bio` (used in 2 files)
- `.nav-link` (used in 3 files)
- `.section-header` (used in 2 files)
- `.item-image` (used in 2 files)
- `.filter-options` (used in 2 files)
- `.item-description` (used in 2 files)
- `.form-hint` (used in 2 files)
- `.form-label` (used in 2 files)
- `::-webkit-scrollbar-track` (used in 3 files)
- `::-webkit-scrollbar-thumb` (used in 3 files)
- `.fixed` (used in 2 files)
- `.absolute` (used in 2 files)
- `.text-right` (used in 2 files)
- `.text-center` (used in 2 files)
- `.filter-select` (used in 2 files)
- `.search-input` (used in 2 files)
- `.start-btn` (used in 2 files)
- `.nav-right a:hover` (used in 2 files)
- `.start-btn:hover` (used in 2 files)
- `.nav-right a` (used in 2 files)
- `.explore-btn` (used in 2 files)
- `.explore-btn:hover` (used in 2 files)
- `.cyber-input:focus` (used in 2 files)
- `/* Navigation */
.navbar` (used in 2 files)
- `@keyframes spin` (used in 2 files)
- `.cyber-card:hover` (used in 2 files)
- `.stat-value` (used in 2 files)
- `.btn-primary` (used in 2 files)
- `.venue-info h3` (used in 2 files)
- `.chart-container` (used in 2 files)
- `.alert` (used in 2 files)
- `.pull-to-refresh.pulling::before` (used in 2 files)
- `.notification-content h4` (used in 2 files)
- `.notification-content p` (used in 2 files)
- `.notification-content small` (used in 2 files)
- `.review-item` (used in 2 files)
- `.modal-content` (used in 2 files)
- `.review-date` (used in 2 files)
- `.review-text` (used in 2 files)
- `.navbar` (used in 2 files)
- `.navbar-brand img` (used in 2 files)
