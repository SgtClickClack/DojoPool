/**
 * Security utilities for safe HTML handling and XSS prevention
 */

/**
 * Escapes HTML entities to prevent XSS
 * @param text - Text to escape
 * @returns Escaped text
 */
export function escapeHTML(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Safely sets text content (for non-HTML content)
 * @param element - DOM element to update
 * @param text - Text content to set
 */
export function safeSetTextContent(element: HTMLElement, text: string): void {
  if (!element) {
    console.warn('safeSetTextContent: element is null or undefined');
    return;
  }
  
  element.textContent = text;
}

/**
 * Safely sets innerHTML with basic sanitization (strips script tags and dangerous attributes)
 * @param element - DOM element to update
 * @param html - HTML content to set
 */
export function safeSetInnerHTML(element: HTMLElement, html: string): void {
  if (!element) {
    console.warn('safeSetInnerHTML: element is null or undefined');
    return;
  }
  
  // Basic HTML sanitization - remove dangerous elements and attributes
  const sanitized = basicSanitizeHTML(html);
  element.innerHTML = sanitized;
}

/**
 * Basic HTML sanitization - removes dangerous elements and attributes
 * @param html - HTML to sanitize
 * @returns Sanitized HTML
 */
function basicSanitizeHTML(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove dangerous event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: URLs
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  
  // Remove data: URLs for security
  sanitized = sanitized.replace(/data\s*:/gi, '');
  
  // Remove dangerous attributes
  sanitized = sanitized.replace(/\s*(src|href|action)\s*=\s*["']javascript[^"']*["']/gi, '');
  
  return sanitized;
}

/**
 * Creates a safe HTML template with parameter substitution
 * @param template - HTML template string with ${param} placeholders
 * @param params - Object with parameter values
 * @returns Sanitized HTML string
 */
export function createSafeTemplate(template: string, params: Record<string, any>): string {
  let result = template;
  
  // Replace parameters in template
  Object.entries(params).forEach(([key, value]) => {
    const placeholder = new RegExp(`\\$\\{${key}\\}`, 'g');
    // Escape HTML entities in parameter values to prevent XSS
    const escapedValue = typeof value === 'string' ? escapeHTML(value) : String(value);
    result = result.replace(placeholder, escapedValue);
  });
  
  return basicSanitizeHTML(result);
}

/**
 * Validates and sanitizes URLs to prevent javascript: and data: URIs
 * @param url - URL to validate
 * @returns Safe URL or empty string if invalid
 */
export function validateURL(url: string): string {
  try {
    const parsedUrl = new URL(url);
    // Only allow http, https, and mailto protocols
    if (['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
      return url;
    }
  } catch (e) {
    // Invalid URL
  }
  return '';
}

/**
 * Security configuration for different content types
 */
export const SECURITY_CONFIG = {
  // Allowlist for safe HTML tags in user content
  SAFE_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span'],
  
  // Allowlist for safe HTML tags in admin content
  ADMIN_SAFE_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a'],
  
  // Safe attributes
  SAFE_ATTRIBUTES: ['class', 'id'],
  
  // Admin safe attributes
  ADMIN_SAFE_ATTRIBUTES: ['class', 'id', 'href', 'target', 'rel']
} as const;

/**
 * Advanced HTML sanitization with tag and attribute filtering
 * @param html - HTML to sanitize
 * @param allowedTags - Array of allowed HTML tags
 * @param allowedAttrs - Array of allowed attributes
 * @returns Sanitized HTML
 */
export function advancedSanitizeHTML(html: string, allowedTags: readonly string[] = SECURITY_CONFIG.SAFE_TAGS, allowedAttrs: readonly string[] = SECURITY_CONFIG.SAFE_ATTRIBUTES): string {
  // First do basic sanitization
  let sanitized = basicSanitizeHTML(html);
  
  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = sanitized;
  
  // Filter elements recursively
  function filterElement(element: Element): Element | null {
    const tagName = element.tagName.toLowerCase();
    
    // If tag is not allowed, return its content
    if (!allowedTags.includes(tagName)) {
      const span = document.createElement('span');
      span.textContent = element.textContent || '';
      return span;
    }
    
    // Create clean element
    const clean = document.createElement(tagName);
    
    // Copy allowed attributes
    Array.from(element.attributes).forEach(attr => {
      if (allowedAttrs.includes(attr.name.toLowerCase())) {
        clean.setAttribute(attr.name, attr.value);
      }
    });
    
    // Process all child nodes in order to preserve mixed content structure
    Array.from(element.childNodes).forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        // Process element children
        const cleanChild = filterElement(node as Element);
        if (cleanChild) {
          clean.appendChild(cleanChild);
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        // Add text nodes
        clean.appendChild(document.createTextNode(node.textContent || ''));
      }
    });
    
    return clean;
  }
  
  // Process all child nodes in order to preserve mixed content structure
  const cleanDiv = document.createElement('div');
  Array.from(temp.childNodes).forEach(node => {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const cleanChild = filterElement(node as Element);
      if (cleanChild) {
        cleanDiv.appendChild(cleanChild);
      }
    } else if (node.nodeType === Node.TEXT_NODE) {
      cleanDiv.appendChild(document.createTextNode(node.textContent || ''));
    }
  });
  
  return cleanDiv.innerHTML;
}