import alertSystem from "./alertSystem.js";
import { safeSetInnerHTML, createSafeTemplate } from '../utils/securityUtils.js';

class AlertConfig {
  constructor() {
    this.container = null;
    this.activeTab = "thresholds";
    this.init();
  }

  init() {
    this.createConfigPanel();
    this.bindEvents();
  }

  createConfigPanel() {
    this.container = document.createElement("div");
    this.container.className = "alert-config";

    // Create tabs
    const tabs = document.createElement("div");
    tabs.className = "config-tabs";
    const tabsHTML = `
            <button class="tab-btn active" data-tab="thresholds">Thresholds</button>
            <button class="tab-btn" data-tab="history">Alert History</button>
        `;
    safeSetInnerHTML(tabs, tabsHTML);

    // Create content container
    const content = document.createElement("div");
    content.className = "config-content";

    // Create threshold configuration
    const thresholds = document.createElement("div");
    thresholds.className = "config-section thresholds active";
    const thresholdConfigHTML = this.createThresholdConfig();
    safeSetInnerHTML(thresholds, thresholdConfigHTML);

    // Create history view
    const history = document.createElement("div");
    history.className = "config-section history";
    const historyViewHTML = this.createHistoryView();
    safeSetInnerHTML(history, historyViewHTML);

    content.appendChild(thresholds);
    content.appendChild(history);

    this.container.appendChild(tabs);
    this.container.appendChild(content);
    document.body.appendChild(this.container);
  }

  createThresholdConfig() {
    const thresholds = alertSystem.thresholds;
    let html = '<div class="threshold-groups">';

    for (const [category, config] of Object.entries(thresholds)) {
      html += `
                <div class="threshold-group">
                    <div class="group-header">
                        <h4>${category.replace(/([A-Z])/g, " $1").toUpperCase()}</h4>
                        <label class="toggle">
                            <input type="checkbox" class="threshold-toggle" 
                                data-category="${category}" 
                                ${config.enabled ? "checked" : ""}>
                            <span class="toggle-slider"></span>
                        </label>
                    </div>
                    <div class="threshold-inputs">
                        <div class="input-group">
                            <label>Warning</label>
                            <input type="number" class="threshold-input" 
                                data-category="${category}" 
                                data-level="warning" 
                                value="${config.warning}">
                        </div>
                        <div class="input-group">
                            <label>Error</label>
                            <input type="number" class="threshold-input" 
                                data-category="${category}" 
                                data-level="error" 
                                value="${config.error}">
                        </div>
                    </div>
                </div>
            `;
    }

    html += `
            </div>
            <div class="threshold-actions">
                <button class="reset-btn">Reset to Defaults</button>
            </div>
        `;

    return html;
  }

  createHistoryView() {
    return `
            <div class="history-controls">
                <button class="clear-history-btn">Clear History</button>
                <select class="history-filter">
                    <option value="all">All Categories</option>
                    <option value="loadTime">Load Time</option>
                    <option value="bandwidth">Bandwidth</option>
                    <option value="memory">Memory</option>
                </select>
            </div>
            <div class="history-list"></div>
        `;
  }

  updateHistoryView() {
    const history = alertSystem.getAlertHistory();
    const filter = this.container.querySelector(".history-filter").value;
    const listContainer = this.container.querySelector(".history-list");

    const filteredHistory =
      filter === "all"
        ? history
        : history.filter(
            (alert) => alert.category.toLowerCase().replace(" ", "") === filter,
          );

    if (filteredHistory.length) {
      const historyItemsHTML = filteredHistory
        .reverse()
        .map(
          (alert) => `
                <div class="history-item alert-${alert.severity}">
                    <div class="alert-info">
                        <span class="alert-category">${alert.category}</span>
                        <span class="alert-time">
                            ${new Date(alert.timestamp).toLocaleString()}
                        </span>
                    </div>
                    <div class="alert-message">${alert.message}</div>
                </div>
            `,
        )
        .join("");
      safeSetInnerHTML(listContainer, historyItemsHTML);
    } else {
      safeSetInnerHTML(listContainer, '<div class="no-history">No alerts in history</div>');
    }
  }

  bindEvents() {
    // Tab switching
    this.container.addEventListener("click", (e) => {
      if (e.target.classList.contains("tab-btn")) {
        this.switchTab(e.target.dataset.tab);
      }
    });

    // Threshold updates
    this.container.addEventListener("change", (e) => {
      if (e.target.classList.contains("threshold-toggle")) {
        const { category } = e.target.dataset;
        alertSystem.setThresholdEnabled(category, e.target.checked);
      }
    });

    this.container.addEventListener("input", (e) => {
      if (e.target.classList.contains("threshold-input")) {
        const { category, level } = e.target.dataset;
        alertSystem.updateThreshold(category, level, Number(e.target.value));
      }
    });

    // Reset thresholds
    this.container.querySelector(".reset-btn").addEventListener("click", () => {
      alertSystem.resetThresholds();
      this.updateThresholdInputs();
    });

    // Clear history
    this.container
      .querySelector(".clear-history-btn")
      .addEventListener("click", () => {
        alertSystem.clearHistory();
        this.updateHistoryView();
      });

    // History filter
    this.container
      .querySelector(".history-filter")
      .addEventListener("change", () => {
        this.updateHistoryView();
      });

    // Listen for alert updates
    window.addEventListener("alertUpdate", () => {
      this.updateHistoryView();
    });
  }

  switchTab(tab) {
    this.activeTab = tab;

    // Update tab buttons
    this.container.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tab === tab);
    });

    // Update content sections
    this.container.querySelectorAll(".config-section").forEach((section) => {
      section.classList.toggle("active", section.classList.contains(tab));
    });

    if (tab === "history") {
      this.updateHistoryView();
    }
  }

  updateThresholdInputs() {
    const thresholds = alertSystem.thresholds;
    for (const [category, config] of Object.entries(thresholds)) {
      const toggle = this.container.querySelector(
        `.threshold-toggle[data-category="${category}"]`,
      );
      const warningInput = this.container.querySelector(
        `.threshold-input[data-category="${category}"][data-level="warning"]`,
      );
      const errorInput = this.container.querySelector(
        `.threshold-input[data-category="${category}"][data-level="error"]`,
      );

      if (toggle) toggle.checked = config.enabled;
      if (warningInput) warningInput.value = config.warning;
      if (errorInput) errorInput.value = config.error;
    }
  }
}

// Initialize and export instance
const alertConfig = new AlertConfig();
export default alertConfig;
