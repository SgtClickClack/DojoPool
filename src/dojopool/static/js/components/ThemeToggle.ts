// Generated type definitions

class ThemeToggle extends HTMLElement {
  // Properties and methods
}

// Type imports

import {
  toggleTheme,
  getStoredTheme,
  THEME_LIGHT,
  THEME_DARK,
} from "../theme.js";

class ThemeToggle extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.render();
    this.addEventListeners();
  }

  render() {
    const currentTheme: any = getStoredTheme() || THEME_LIGHT;
    const isDark: any = currentTheme === THEME_DARK;

    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: inline-block;
                }
                
                button {
                    background: none;
                    border: none;
                    padding: 8px;
                    cursor: pointer;
                    color: var(--color-text-primary);
                    border-radius: var(--radius-full);
                    transition: background-color var(--transition-base);
                }
                
                button:hover {
                    background-color: var(--color-neutral-100);
                }
                
                button:focus {
                    outline: none;
                    box-shadow: 0 0 0 2px var(--color-primary-500);
                }
                
                .icon {
                    width: 20px;
                    height: 20px;
                    fill: currentColor;
                }
            </style>
            
            <button aria-label="Toggle theme" title="${isDark ? "Switch to light theme" : "Switch to dark theme"}">
                ${isDark ? this.moonIcon : this.sunIcon}
            </button>
        `;
  }

  addEventListeners() {
    const button: any = this.shadowRoot.querySelector("button");
    button.addEventListener("click", () => {
      toggleTheme();
      this.render();
    });
  }

  get sunIcon() {
    return `
            <svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2v2m0 16v2M4 12H2m20 0h-2m-2.05-5.95l-1.414 1.414M5.464 5.464L4.05 4.05m14.486 14.486l1.414 1.414M5.464 18.536l-1.414 1.414M12 7a5 5 0 100 10 5 5 0 000-10z"/>
            </svg>
        `;
  }

  get moonIcon() {
    return `
            <svg class="icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
            </svg>
        `;
  }
}

customElements.define("theme-toggle", ThemeToggle);
