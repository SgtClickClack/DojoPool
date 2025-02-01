import { AxeConfiguration } from 'axe-core';

export const axeConfig: AxeConfiguration = {
    rules: [
        // Critical accessibility rules
        { id: 'aria-hidden-focus', enabled: true },
        { id: 'aria-input-field-name', enabled: true },
        { id: 'aria-toggle-field-name', enabled: true },
        { id: 'button-name', enabled: true },
        { id: 'color-contrast', enabled: true },
        { id: 'document-title', enabled: true },
        { id: 'form-field-multiple-labels', enabled: true },
        { id: 'frame-title', enabled: true },
        { id: 'html-has-lang', enabled: true },
        { id: 'image-alt', enabled: true },
        { id: 'input-button-name', enabled: true },
        { id: 'label', enabled: true },
        { id: 'link-name', enabled: true },
        { id: 'list', enabled: true },
        { id: 'listitem', enabled: true },
        { id: 'meta-viewport', enabled: true },

        // WCAG 2.1 Level A
        { id: 'nested-interactive', enabled: true },
        { id: 'role-img-alt', enabled: true },
        { id: 'scrollable-region-focusable', enabled: true },
        { id: 'valid-lang', enabled: true },

        // WCAG 2.1 Level AA
        { id: 'focus-order-semantics', enabled: true },
        { id: 'frame-tested', enabled: true },
        { id: 'landmark-banner-is-top-level', enabled: true },
        { id: 'landmark-complementary-is-top-level', enabled: true },
        { id: 'landmark-contentinfo-is-top-level', enabled: true },
        { id: 'landmark-main-is-top-level', enabled: true },
        { id: 'landmark-no-duplicate-banner', enabled: true },
        { id: 'landmark-no-duplicate-contentinfo', enabled: true },
        { id: 'landmark-no-duplicate-main', enabled: true },
        { id: 'landmark-one-main', enabled: true },
        { id: 'landmark-unique', enabled: true },
        { id: 'meta-refresh', enabled: true },
        { id: 'region', enabled: true },

        // Mobile-specific rules
        { id: 'target-size', enabled: true },
        { id: 'touch-target-spacing', enabled: true }
    ],
    checks: [
        // Color contrast
        {
            id: 'color-contrast',
            options: {
                noScroll: false,
                ignoreUnicode: true,
                ignoreLength: false
            }
        },
        // Touch target size
        {
            id: 'target-size',
            options: {
                minSize: 44 // Minimum size in pixels
            }
        }
    ],
    resultTypes: ['violations', 'incomplete', 'inapplicable'],
    reporter: 'v2',
    runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']
    }
};

export const testPaths = [
    '/',
    '/tournaments',
    '/analysis',
    '/social',
    '/profile',
    '/settings'
];

export const viewports = {
    mobile: {
        width: 375,
        height: 667
    },
    tablet: {
        width: 768,
        height: 1024
    },
    desktop: {
        width: 1280,
        height: 800
    }
};

export const testCases = [
    {
        name: 'Login Form',
        selector: '#login-form',
        interactions: [
            { action: 'click', target: 'input[type="email"]' },
            { action: 'type', target: 'input[type="email"]', value: 'test@example.com' },
            { action: 'click', target: 'input[type="password"]' },
            { action: 'type', target: 'input[type="password"]', value: 'password123' }
        ]
    },
    {
        name: 'Tournament Creation',
        selector: '#tournament-form',
        interactions: [
            { action: 'click', target: 'input[name="tournamentName"]' },
            { action: 'type', target: 'input[name="tournamentName"]', value: 'Test Tournament' },
            { action: 'click', target: 'select[name="tournamentType"]' },
            { action: 'select', target: 'select[name="tournamentType"]', value: 'single-elimination' }
        ]
    },
    {
        name: 'Game Analysis',
        selector: '#analysis-view',
        interactions: [
            { action: 'click', target: '.shot-selector' },
            { action: 'click', target: '.ball-selector' },
            { action: 'click', target: '.analyze-button' }
        ]
    }
];

export const customRules = {
    'touch-target-spacing': {
        id: 'touch-target-spacing',
        selector: 'button, a, input, select, textarea',
        any: ['touch-target-spacing'],
        metadata: {
            description: 'Ensures touch targets have adequate spacing',
            help: 'Touch targets should have adequate spacing between them'
        }
    },
    'motion-reduction': {
        id: 'motion-reduction',
        selector: '*',
        any: ['prefers-reduced-motion'],
        metadata: {
            description: 'Ensures motion can be disabled',
            help: 'Users should be able to disable motion effects'
        }
    },
    'color-scheme-preference': {
        id: 'color-scheme-preference',
        selector: ':root',
        any: ['color-scheme-preference'],
        metadata: {
            description: 'Ensures color scheme preferences are respected',
            help: 'Site should respect user color scheme preferences'
        }
    }
}; 