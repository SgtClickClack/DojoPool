// Generated type definitions

class Modal {
    // Properties and methods
}

class Tabs {
    // Properties and methods
}

class Dropdown {
    // Properties and methods
}

class Toast {
    // Properties and methods
}

class FormValidator {
    // Properties and methods
}

class DataTable {
    // Properties and methods
}

// Type imports
// TODO: Import types from ./utils.js

import { $, $$, ui } from './utils.js';

// Modal Component
class Modal {
  constructor(id) {
    this.modal = $(`#${id}`);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeButtons: any = this.modal.querySelectorAll('[data-close-modal]');
    closeButtons.forEach((button) => {
      button.addEventListener('click', () => this.hide());
    });

    // Close on click outside
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.hide();
    });
  }

  show() {
    this.modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this.modal.classList.remove('show');
    document.body.style.overflow = '';
  }
}

// Tabs Component
class Tabs {
  constructor(container) {
    this.container = container;
    this.tabs = this.container.querySelectorAll('[data-tab]');
    this.panels = this.container.querySelectorAll('[data-tab-panel]');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => this.switchTab(tab));
    });
  }

  switchTab(selectedTab) {
    const targetPanel: any = selectedTab.dataset.tab;

    this.tabs.forEach((tab) => {
      tab.classList.toggle('active', tab === selectedTab);
    });

    this.panels.forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.tabPanel === targetPanel);
    });
  }
}

// Dropdown Component
class Dropdown {
  constructor(container) {
    this.container = container;
    this.button = container.querySelector('[data-dropdown-toggle]');
    this.menu = container.querySelector('[data-dropdown-menu]');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.button.addEventListener('click', () => this.toggle());

    // Close on click outside
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hide();
      }
    });
  }

  toggle() {
    this.menu.classList.toggle('show');
  }

  hide() {
    this.menu.classList.remove('show');
  }
}

// Toast Notification Component
class Toast {
  constructor(message, type = 'info', duration = 3000) {
    this.message = message;
    this.type = type;
    this.duration = duration;
    this.element = null;
    this.show();
  }

  create() {
    this.element = document.createElement('div');
    this.element.className = `toast toast-${this.type}`;
    this.element.textContent = this.message;
    document.body.appendChild(this.element);
  }

  show() {
    this.create();
    setTimeout(() => {
      this.element.classList.add('show');
    }, 100);

    if (this.duration) {
      setTimeout(() => this.hide(), this.duration);
    }
  }

  hide() {
    this.element.classList.remove('show');
    setTimeout(() => {
      this.element.remove();
    }, 300);
  }
}

// Form Validation Component
class FormValidator {
  constructor(form, rules) {
    this.form = form;
    this.rules = rules;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.form.addEventListener('submit', (e) => {
      if (!this.validateAll()) {
        e.preventDefault();
      }
    });

    // Real-time validation
    this.form.querySelectorAll('input, select, textarea').forEach((field) => {
      field.addEventListener('blur', () => {
        this.validateField(field);
      });
    });
  }

  validateField(field) {
    const rules: any = this.rules[field.name];
    if (!rules) return true;

    let isValid = true;
    let errorMessage = '';

    rules.forEach((rule) => {
      if (!rule.validate(field.value)) {
        isValid = false;
        errorMessage = rule.message;
      }
    });

    this.showFieldError(field, isValid ? '' : errorMessage);
    return isValid;
  }

  validateAll() {
    let isValid = true;
    this.form.querySelectorAll('input, select, textarea').forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });
    return isValid;
  }

  showFieldError(field, message) {
    const errorElement: any = field.parentElement.querySelector('.error-message');
    if (message) {
      if (!errorElement) {
        const error: any = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        field.parentElement.appendChild(error);
      } else {
        errorElement.textContent = message;
      }
      field.classList.add('error');
    } else {
      if (errorElement) {
        errorElement.remove();
      }
      field.classList.remove('error');
    }
  }
}

// Data Table Component
class DataTable {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      columns: [],
      data: [],
      sortable: true,
      searchable: true,
      pagination: true,
      rowsPerPage: 10,
      ...options,
    };
    this.currentPage = 1;
    this.init();
  }

  init() {
    this.render();
    if (this.options.searchable) this.setupSearch();
    if (this.options.sortable) this.setupSort();
    if (this.options.pagination) this.setupPagination();
  }

  render() {
    // Implementation details for rendering the table
  }

  setupSearch() {
    // Implementation details for search functionality
  }

  setupSort() {
    // Implementation details for sorting functionality
  }

  setupPagination() {
    // Implementation details for pagination
  }
}

// Export components
export { Modal, Tabs, Dropdown, Toast, FormValidator, DataTable };
