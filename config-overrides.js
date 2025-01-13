const { override, addWebpackPlugin, addWebpackModuleRule, addWebpackAlias } = require('customize-cra');
const path = require('path');

module.exports = override(
    // Override SVG handling to use latest secure version
    addWebpackModuleRule({
        test: /\.svg$/,
        use: ['@svgr/webpack']
    }),

    // Add aliases for vulnerable dependencies
    addWebpackAlias({
        'nth-check': path.resolve(__dirname, 'node_modules/nth-check'),
        'css-select': path.resolve(__dirname, 'node_modules/css-select'),
        'svgo': path.resolve(__dirname, 'node_modules/svgo'),
        'postcss': path.resolve(__dirname, 'node_modules/postcss'),
        'resolve-url-loader': path.resolve(__dirname, 'node_modules/resolve-url-loader')
    }),

    // Add any additional webpack configurations here
    function (config) {
        // Update PostCSS configuration
        const postCssRule = config.module.rules.find(rule => rule.oneOf).oneOf.find(
            r => r.test && r.test.toString().includes('css')
        );
        if (postCssRule) {
            postCssRule.use = postCssRule.use.map(loader => {
                if (loader.loader && loader.loader.includes('postcss-loader')) {
                    return {
                        ...loader,
                        options: {
                            ...loader.options,
                            postcssOptions: {
                                ...loader.options.postcssOptions,
                                plugins: [
                                    require('postcss-flexbugs-fixes'),
                                    require('postcss-preset-env')({
                                        autoprefixer: {
                                            flexbox: 'no-2009',
                                        },
                                        stage: 3,
                                    }),
                                    require('postcss-normalize'),
                                ],
                            },
                        },
                    };
                }
                return loader;
            });
        }

        // Force use of secure versions for specific modules
        config.resolve = config.resolve || {};
        config.resolve.alias = {
            ...config.resolve.alias,
            'nth-check': path.resolve(__dirname, 'node_modules/nth-check'),
            'css-select': path.resolve(__dirname, 'node_modules/css-select'),
            'svgo': path.resolve(__dirname, 'node_modules/svgo'),
            'postcss': path.resolve(__dirname, 'node_modules/postcss'),
            'resolve-url-loader': path.resolve(__dirname, 'node_modules/resolve-url-loader')
        };

        return config;
    }
); 