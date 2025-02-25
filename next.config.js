/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    reactStrictMode: true,
    compiler: {
        emotion: true,
        styledComponents: true,
        reactRemoveProperties: process.env.NODE_ENV === 'production',
    },
    
    // Add security headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY'
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff'
                    },
                    {
                        key: 'X-XSS-Protection',
                        value: '1; mode=block'
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin'
                    }
                ]
            }
        ]
    },

    // Disable powered by header
    poweredByHeader: false,
    
    // Handle React 19 compatibility
    experimental: {
        optimizePackageImports: ['@mui/icons-material', '@mui/material'],
    },
    
    // External packages
    serverExternalPackages: [],

    webpack: (config) => {
        config.resolve.alias = {
            ...config.resolve.alias,
            '@emotion/styled': path.resolve(__dirname, 'node_modules/@emotion/styled'),
            '@emotion/react': path.resolve(__dirname, 'node_modules/@emotion/react'),
            '@mui/styled-engine': '@mui/styled-engine-sc',
            'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
            'react/jsx-dev-runtime': path.resolve(__dirname, 'node_modules/react/jsx-dev-runtime')
        };

        return config;
    }
};

module.exports = nextConfig;