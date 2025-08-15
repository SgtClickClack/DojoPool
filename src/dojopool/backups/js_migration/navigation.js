import { $ } from "./utils.js";

class MobileNavigation {
  constructor() {
    this.nav = $(".nav");
    this.navLinks = $(".nav-links");
    this.navToggle = $(".nav-toggle");
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toggle mobile menu
    this.navToggle.addEventListener("click", () => this.toggleMenu());

    // Close menu on window resize (if switching to desktop view)
    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        this.closeMenu();
      }
    });

    // Close menu when clicking outside
    document.addEventListener("click", (e) => {
      if (!this.nav.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Close menu when pressing escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        this.closeMenu();
      }
    });
  }

  toggleMenu() {
    this.navToggle.classList.toggle("active");
    this.navLinks.classList.toggle("show");

    // Toggle aria-expanded
    const isExpanded = this.navLinks.classList.contains("show");
    this.navToggle.setAttribute("aria-expanded", isExpanded);

    // Toggle body scroll
    document.body.style.overflow = isExpanded ? "hidden" : "";
  }

  closeMenu() {
    this.navToggle.classList.remove("active");
    this.navLinks.classList.remove("show");
    this.navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }
}

// Initialize mobile navigation
document.addEventListener("DOMContentLoaded", () => {
  new MobileNavigation();
});
