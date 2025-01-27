"""Script to implement style optimizations."""

import os
import re
import shutil
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Set

class StyleOptimizer:
    """Implements style optimizations."""
    
    def __init__(self, root_dir: str):
        self.root_dir = Path(root_dir)
        self.styles_dir = self.root_dir / 'frontend' / 'styles'
        self.scss_dir = self.root_dir / 'static' / 'scss'
        self.backup_dir = self.root_dir / 'backups' / 'styles'
        self.ignored_dirs = {'.git', '__pycache__', 'node_modules', 'venv', 'build', 'dist'}
        
    def create_backup(self) -> None:
        """Create backup of current styles."""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_path = self.backup_dir / timestamp
        
        # Backup frontend styles
        if self.styles_dir.exists():
            shutil.copytree(self.styles_dir, backup_path / 'frontend' / 'styles')
            
        # Backup SCSS files
        if self.scss_dir.exists():
            shutil.copytree(self.scss_dir, backup_path / 'static' / 'scss')
            
    def create_variables_file(self) -> None:
        """Create variables.scss file with common values."""
        variables_file = self.scss_dir / 'abstracts' / '_variables.scss'
        variables_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(variables_file, 'w', encoding='utf-8') as f:
            f.write("""// Colors
$color-background: #ffffff;
$color-surface: #f8f9fa;
$color-overlay: rgba(0, 0, 0, 0.5);
$color-text-primary: #212529;
$color-text-secondary: #6c757d;
$color-text-tertiary: #adb5bd;
$color-text-disabled: #ced4da;
$color-border-primary: #dee2e6;
$color-border-secondary: #e9ecef;

// Brand Colors
$color-primary-50: #e3f2fd;
$color-primary-100: #bbdefb;
$color-primary-200: #90caf9;
$color-primary-300: #64b5f6;
$color-primary-400: #42a5f5;
$color-primary-500: #2196f3;
$color-primary-600: #1e88e5;
$color-primary-700: #1976d2;
$color-primary-800: #1565c0;
$color-primary-900: #0d47a1;

$color-secondary-50: #fce4ec;
$color-secondary-100: #f8bbd0;
$color-secondary-200: #f48fb1;
$color-secondary-300: #f06292;
$color-secondary-400: #ec407a;
$color-secondary-500: #e91e63;
$color-secondary-600: #d81b60;
$color-secondary-700: #c2185b;
$color-secondary-800: #ad1457;
$color-secondary-900: #880e4f;

// Neutral Colors
$color-neutral-50: #fafafa;
$color-neutral-100: #f5f5f5;
$color-neutral-200: #eeeeee;
$color-neutral-300: #e0e0e0;
$color-neutral-400: #bdbdbd;
$color-neutral-500: #9e9e9e;
$color-neutral-600: #757575;
$color-neutral-700: #616161;
$color-neutral-800: #424242;
$color-neutral-900: #212121;

// Status Colors
$color-success-50: #e8f5e9;
$color-success-500: #4caf50;
$color-success-900: #1b5e20;

$color-warning-50: #fff3e0;
$color-warning-500: #ff9800;
$color-warning-900: #e65100;

$color-error-50: #ffebee;
$color-error-500: #f44336;
$color-error-900: #b71c1c;

// Border Radius
$radius-sm: 0.125rem;
$radius-base: 0.25rem;
$radius-md: 0.375rem;
$radius-lg: 0.5rem;
$radius-xl: 0.75rem;
$radius-2xl: 1rem;
$radius-full: 9999px;

// Transitions
$transition-fast: 150ms;
$transition-base: 250ms;
$transition-slow: 350ms;

// Z-Index
$z-hide: -1;
$z-base: 1;
$z-dropdown: 1000;
$z-sticky: 1020;
$z-fixed: 1030;
$z-modal-backdrop: 1040;
$z-modal: 1050;
$z-popover: 1060;
$z-tooltip: 1070;
$z-toast: 1080;

// Layout
$header-height: 4rem;
$sidebar-width: 16rem;
$footer-height: 3rem;
$grid-columns: 12;
$grid-gutter-width: 1.5rem;

// Breakpoints
$breakpoint-xs: 0;
$breakpoint-sm: 576px;
$breakpoint-md: 768px;
$breakpoint-lg: 992px;
$breakpoint-xl: 1200px;
$breakpoint-xxl: 1400px;

// Content
$content-max-width: 1280px;
$spacing-unit: 1rem;

// Touch
$touch-target-size: 44px;
$touch-target-spacing: 8px;

// Safe Area Insets
$safe-area-inset-top: env(safe-area-inset-top);
$safe-area-inset-bottom: env(safe-area-inset-bottom);
$safe-area-inset-left: env(safe-area-inset-left);
$safe-area-inset-right: env(safe-area-inset-right);

// Convert to CSS Variables
:root {
  // Colors
  --color-background: #{$color-background};
  --color-surface: #{$color-surface};
  --color-overlay: #{$color-overlay};
  --color-text-primary: #{$color-text-primary};
  --color-text-secondary: #{$color-text-secondary};
  --color-text-tertiary: #{$color-text-tertiary};
  --color-text-disabled: #{$color-text-disabled};
  --color-border-primary: #{$color-border-primary};
  --color-border-secondary: #{$color-border-secondary};
  
  // Brand Colors
  @each $color in (50, 100, 200, 300, 400, 500, 600, 700, 800, 900) {
    --color-primary-#{$color}: #{map-get($color-primary, $color)};
    --color-secondary-#{$color}: #{map-get($color-secondary, $color)};
    --color-neutral-#{$color}: #{map-get($color-neutral, $color)};
  }
  
  // Status Colors
  @each $color in (50, 500, 900) {
    --color-success-#{$color}: #{map-get($color-success, $color)};
    --color-warning-#{$color}: #{map-get($color-warning, $color)};
    --color-error-#{$color}: #{map-get($color-error, $color)};
  }
  
  // Border Radius
  --radius-sm: #{$radius-sm};
  --radius-base: #{$radius-base};
  --radius-md: #{$radius-md};
  --radius-lg: #{$radius-lg};
  --radius-xl: #{$radius-xl};
  --radius-2xl: #{$radius-2xl};
  --radius-full: #{$radius-full};
  
  // Transitions
  --transition-fast: #{$transition-fast};
  --transition-base: #{$transition-base};
  --transition-slow: #{$transition-slow};
  
  // Z-Index
  --z-hide: #{$z-hide};
  --z-base: #{$z-base};
  --z-dropdown: #{$z-dropdown};
  --z-sticky: #{$z-sticky};
  --z-fixed: #{$z-fixed};
  --z-modal-backdrop: #{$z-modal-backdrop};
  --z-modal: #{$z-modal};
  --z-popover: #{$z-popover};
  --z-tooltip: #{$z-tooltip};
  --z-toast: #{$z-toast};
  
  // Layout
  --header-height: #{$header-height};
  --sidebar-width: #{$sidebar-width};
  --footer-height: #{$footer-height};
  --grid-columns: #{$grid-columns};
  --grid-gutter-width: #{$grid-gutter-width};
  
  // Breakpoints
  --breakpoint-xs: #{$breakpoint-xs};
  --breakpoint-sm: #{$breakpoint-sm};
  --breakpoint-md: #{$breakpoint-md};
  --breakpoint-lg: #{$breakpoint-lg};
  --breakpoint-xl: #{$breakpoint-xl};
  --breakpoint-xxl: #{$breakpoint-xxl};
  
  // Content
  --content-max-width: #{$content-max-width};
  --spacing-unit: #{$spacing-unit};
  
  // Touch
  --touch-target-size: #{$touch-target-size};
  --touch-target-spacing: #{$touch-target-spacing};
  
  // Safe Area Insets
  --safe-area-inset-top: #{$safe-area-inset-top};
  --safe-area-inset-bottom: #{$safe-area-inset-bottom};
  --safe-area-inset-left: #{$safe-area-inset-left};
  --safe-area-inset-right: #{$safe-area-inset-right};
}
""")
            
    def create_mixins_file(self) -> None:
        """Create mixins.scss file with common mixins."""
        mixins_file = self.scss_dir / 'abstracts' / '_mixins.scss'
        mixins_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(mixins_file, 'w', encoding='utf-8') as f:
            f.write("""// Breakpoint mixins
@mixin mobile {
  @media (max-width: var(--breakpoint-sm)) {
    @content;
  }
}

@mixin tablet {
  @media (min-width: var(--breakpoint-sm)) and (max-width: var(--breakpoint-lg)) {
    @content;
  }
}

@mixin desktop {
  @media (min-width: var(--breakpoint-lg)) {
    @content;
  }
}

// Flexbox mixins
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

@mixin flex-between {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

@mixin flex-column {
  display: flex;
  flex-direction: column;
}

// Typography mixins
@mixin heading-1 {
  font-size: 2.5rem;
  line-height: 1.2;
  font-weight: 700;
}

@mixin heading-2 {
  font-size: 2rem;
  line-height: 1.3;
  font-weight: 700;
}

@mixin heading-3 {
  font-size: 1.75rem;
  line-height: 1.4;
  font-weight: 600;
}

@mixin heading-4 {
  font-size: 1.5rem;
  line-height: 1.4;
  font-weight: 600;
}

@mixin body-text {
  font-size: 1rem;
  line-height: 1.5;
}

@mixin small-text {
  font-size: 0.875rem;
  line-height: 1.5;
}

// Animation mixins
@mixin fade-in {
  animation: fadeIn var(--transition-base) ease-in;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
}

@mixin slide-in {
  animation: slideIn var(--transition-base) ease-out;
  
  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
}

// Shadow mixins
@mixin shadow-sm {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
}

@mixin shadow-md {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

@mixin shadow-lg {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

// Focus styles
@mixin focus-ring {
  outline: none;
  box-shadow: 0 0 0 3px rgba(var(--color-primary-500), 0.4);
}

// Truncate text
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// Grid mixins
@mixin grid-columns($columns: 12, $gap: var(--grid-gutter-width)) {
  display: grid;
  grid-template-columns: repeat($columns, 1fr);
  gap: $gap;
}

// Container mixins
@mixin container {
  width: 100%;
  margin-right: auto;
  margin-left: auto;
  padding-right: var(--spacing-unit);
  padding-left: var(--spacing-unit);
  max-width: var(--content-max-width);
}

// Touch target mixins
@mixin touch-target {
  min-width: var(--touch-target-size);
  min-height: var(--touch-target-size);
  padding: var(--touch-target-spacing);
}

// Safe area mixins
@mixin safe-area-insets {
  padding-top: var(--safe-area-inset-top);
  padding-bottom: var(--safe-area-inset-bottom);
  padding-left: var(--safe-area-inset-left);
  padding-right: var(--safe-area-inset-right);
}
""")
            
    def create_shared_styles_file(self) -> None:
        """Create shared.scss file for common styles."""
        shared_file = self.scss_dir / 'base' / '_shared.scss'
        shared_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(shared_file, 'w', encoding='utf-8') as f:
            f.write("""// Import variables and mixins
@use '../abstracts/variables' as *;
@use '../abstracts/mixins' as *;

// Common text styles
body {
  color: var(--color-text-primary);
  background-color: var(--color-background);
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  margin: 0;
  font-weight: 600;
  line-height: 1.2;
}

p {
  margin: 0;
  line-height: 1.5;
}

// Common component styles
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.5rem;
  height: 1.5rem;
}

.card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  
  &-title {
    @include heading-4;
    margin-bottom: 1rem;
  }
  
  &-body {
    padding: 1.5rem;
  }
}

// Common layout styles
.container {
  @include container;
}

.section {
  &-title {
    @include heading-2;
    margin-bottom: 1.5rem;
  }
  
  &-description {
    color: var(--color-text-secondary);
    margin-bottom: 2rem;
  }
  
  &-header {
    margin-bottom: 2rem;
  }
}

// Common form styles
.form {
  &-label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  &-hint {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    margin-top: 0.25rem;
  }
}

// Common navigation styles
.nav {
  &-item {
    list-style: none;
    margin: 0;
  }
  
  &-link {
    display: inline-flex;
    align-items: center;
    padding: 0.5rem 1rem;
    color: var(--color-text-primary);
    text-decoration: none;
    
    &:hover {
      color: var(--color-primary-600);
    }
    
    &.active {
      color: var(--color-primary-500);
      font-weight: 500;
    }
  }
}

// Common utility classes
.text-right {
  text-align: right;
}

.fixed {
  position: fixed;
}

.absolute {
  position: absolute;
}

// Common scrollbar styles
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background-color: var(--color-neutral-100);
}

::-webkit-scrollbar-thumb {
  background-color: var(--color-neutral-300);
  border-radius: var(--radius-full);
  
  &:hover {
    background-color: var(--color-neutral-400);
  }
}

// Common animation keyframes
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  50% {
    opacity: 0.5;
  }
}

@keyframes shimmer {
  to {
    background-position: 200% 0;
  }
}
""")
            
    def update_style_imports(self) -> None:
        """Update style imports in all SCSS files."""
        for scss_file in self.scss_dir.rglob('*.scss'):
            if scss_file.name.startswith('_'):
                continue
                
            with open(scss_file, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Add imports at the start of the file
            imports = """@use 'abstracts/variables' as *;
@use 'abstracts/mixins' as *;
@use 'base/shared' as *;

"""
            
            if not content.startswith('@use'):
                content = imports + content
                
            with open(scss_file, 'w', encoding='utf-8') as f:
                f.write(content)
                
    def optimize_styles(self) -> None:
        """Run all style optimizations."""
        # Create backup
        self.create_backup()
        
        # Create new files
        self.create_variables_file()
        self.create_mixins_file()
        self.create_shared_styles_file()
        
        # Update imports
        self.update_style_imports()
        
if __name__ == '__main__':
    optimizer = StyleOptimizer('src/dojopool')
    optimizer.optimize_styles() 