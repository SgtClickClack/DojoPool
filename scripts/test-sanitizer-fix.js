#!/usr/bin/env node

/**
 * Test script to verify HTML sanitizer mixed content ordering fix
 */

const { JSDOM } = require('jsdom');

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.Node = dom.window.Node;

// Import the fixed function (assuming it's transpiled or using a loader)
const {
  advancedSanitizeHTML,
  SECURITY_CONFIG,
} = require('../src/utils/securityUtils');

console.log('🧪 Testing HTML Sanitizer Mixed Content Fix\n');

// Test cases
const testCases = [
  {
    name: 'Basic mixed content',
    input: '<div>Hello <span>world</span> and <em>goodbye</em>!</div>',
    expected: 'Hello [span] and [em]!',
  },
  {
    name: 'Nested mixed content',
    input: '<p>Start <strong>bold <em>italic</em> text</strong> end</p>',
    expected: 'Start [strong with nested em] end',
  },
  {
    name: 'Root level mixed content',
    input: 'Text before <span>element</span> text after',
    expected: 'Text before [span] text after',
  },
  {
    name: 'Multiple levels',
    input:
      '<div>Level 1 <p>Level 2 <span>Level 3</span> back to 2</p> back to 1</div>',
    expected: 'Level 1 [p] back to 1',
  },
];

// Run tests
testCases.forEach((test, index) => {
  console.log(`Test ${index + 1}: ${test.name}`);
  console.log(`Input:  ${test.input}`);

  try {
    const result = advancedSanitizeHTML(test.input, SECURITY_CONFIG.SAFE_TAGS);
    console.log(`Output: ${result}`);

    // Check if elements and text maintain relative positions
    const hasCorrectOrder = checkContentOrder(test.input, result);
    console.log(`✅ Order preserved: ${hasCorrectOrder ? 'YES' : 'NO'}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('');
});

/**
 * Simple check to verify content order is preserved
 */
function checkContentOrder(input, output) {
  // Extract text content in order from input
  const inputTextNodes = extractTextOrder(input);
  const outputTextNodes = extractTextOrder(output);

  console.log(`  Input text order:  [${inputTextNodes.join(', ')}]`);
  console.log(`  Output text order: [${outputTextNodes.join(', ')}]`);

  // Check if text appears in the same relative order
  return JSON.stringify(inputTextNodes) === JSON.stringify(outputTextNodes);
}

/**
 * Extract text content in order for comparison
 */
function extractTextOrder(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  const textNodes = [];

  function walkNodes(node) {
    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE && child.textContent.trim()) {
        textNodes.push(child.textContent.trim());
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        walkNodes(child);
      }
    }
  }

  walkNodes(tempDiv);
  return textNodes;
}

console.log(
  '🎉 Test completed. Mixed content ordering should now be preserved!'
);
