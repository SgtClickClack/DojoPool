// Generated type definitions

class ResponsiveManager {
    // Properties and methods
}

// Type imports


class ResponsiveManager {
  constructor() {
    this.breakpoints = {
      mobile: 576,
      tablet: 768,
      desktop: 1024,
    };
    this.currentBreakpoint = this.getCurrentBreakpoint();
    this.setupEventListeners();
    this.initializeResponsiveElements();
  }

  getCurrentBreakpoint() {
    const width: any = window.innerWidth;
    if (width <= this.breakpoints.mobile) return 'mobile';
    if (width <= this.breakpoints.tablet) return 'tablet';
    if (width <= this.breakpoints.desktop) return 'desktop';
    return 'large';
  }

  setupEventListeners() {
    // Handle window resize
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const newBreakpoint: any = this.getCurrentBreakpoint();
        if (newBreakpoint !== this.currentBreakpoint) {
          this.currentBreakpoint = newBreakpoint;
          this.handleBreakpointChange(newBreakpoint);
        }
      }, 250);
    });

    // Handle orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.handleOrientationChange();
      }, 100);
    });

    // Handle navigation menu
    const navToggle: any = document.querySelector('.nav-toggle');
    const sidebar: any = document.querySelector('.sidebar');
    if (navToggle && sidebar) {
      navToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        navToggle.setAttribute(
          'aria-expanded',
          sidebar.classList.contains('active')
        );
      });

      // Close sidebar when clicking outside
      document.addEventListener('click', (e) => {
        if (
          sidebar.classList.contains('active') &&
          !sidebar.contains(e.target) &&
          !navToggle.contains(e.target)
        ) {
          sidebar.classList.remove('active');
          navToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  initializeResponsiveElements() {
    // Initialize responsive tables
    this.initializeResponsiveTables();

    // Initialize responsive images
    this.initializeResponsiveImages();

    // Initialize touch interactions
    this.initializeTouchInteractions();

    // Set initial ARIA attributes
    this.updateAriaAttributes();
  }

  initializeResponsiveTables() {
    const tables: any = document.querySelectorAll('table:not(.no-responsive)');
    tables.forEach((table) => {
      const wrapper: any = document.createElement('div');
      wrapper.className = 'responsive-table';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  }

  initializeResponsiveImages() {
    const images: any = document.querySelectorAll('img:not(.no-responsive)');
    images.forEach((img) => {
      img.classList.add('responsive-image');
      if (img.hasAttribute('data-src')) {
        this.lazyLoadImage(img);
      }
    });
  }

  initializeTouchInteractions() {
    if ('ontouchstart' in window) {
      document.documentElement.classList.add('touch-device');
      this.setupTouchNavigation();
    }
  }

  setupTouchNavigation() {
    const dropdowns: any = document.querySelectorAll('.dropdown');
    dropdowns.forEach((dropdown) => {
      const trigger: any = dropdown.querySelector('.dropdown-trigger');
      if (trigger) {
        trigger.addEventListener('touchstart', (e) => {
          e.preventDefault();
          dropdowns.forEach((d) => {
            if (d !== dropdown) {
              d.classList.remove('active');
            }
          });
          dropdown.classList.toggle('active');
        });
      }
    });
  }

  handleBreakpointChange(breakpoint) {
    // Update layout classes
    document.body.className = document.body.className
      .replace(/breakpoint-\w+/, '')
      .trim();
    document.body.classList.add(`breakpoint-${breakpoint}`);

    // Reset mobile menu
    const sidebar: any = document.querySelector('.sidebar');
    const navToggle: any = document.querySelector('.nav-toggle');
    if (sidebar && breakpoint !== 'mobile') {
      sidebar.classList.remove('active');
      if (navToggle) {
        navToggle.setAttribute('aria-expanded', 'false');
      }
    }

    // Adjust grid layouts
    this.updateGridLayouts(breakpoint);

    // Emit custom event
    window.dispatchEvent(
      new CustomEvent('breakpointChange', {
        detail: { breakpoint },
      })
    );
  }

  handleOrientationChange() {
    // Update viewport height for mobile browsers
    const vh: any = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    // Recalculate and update layouts
    this.updateGridLayouts(this.getCurrentBreakpoint());
  }

  updateGridLayouts(breakpoint) {
    const grids: any = document.querySelectorAll('.auto-grid');
    grids.forEach((grid) => {
      const minWidth: any = grid.dataset.minWidth || '250px';
      grid.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}, 1fr))`;
    });
  }

  updateAriaAttributes() {
    // Update navigation ARIA attributes
    const navToggle: any = document.querySelector('.nav-toggle');
    const sidebar: any = document.querySelector('.sidebar');
    if (navToggle && sidebar) {
      navToggle.setAttribute('aria-controls', 'navigation');
      navToggle.setAttribute('aria-expanded', 'false');
      sidebar.id = 'navigation';
      sidebar.setAttribute('aria-label', 'Main navigation');
    }

    // Update other ARIA attributes based on viewport
    const breakpoint: any = this.getCurrentBreakpoint();
    document.querySelectorAll('[data-aria-mobile]').forEach((el) => {
      if (breakpoint === 'mobile') {
        el.setAttribute('aria-label', el.dataset.ariaMobile);
      } else {
        el.setAttribute('aria-label', el.dataset.ariaDesktop || '');
      }
    });
  }

  lazyLoadImage(img) {
    const observer: any = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      });
    });
    observer.observe(img);
  }
}

// Initialize responsive manager
const responsiveManager: any = new ResponsiveManager();
