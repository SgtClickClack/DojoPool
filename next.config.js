const { cdnConfig } = require('./src/config/cdn');

/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        loader: 'custom',
        loaderFile: './src/config/cdn.ts',
        domains: [
            'cdn.dojopool.com',
            'assets.dojopool.com',
            new URL(process.env.NEXT_PUBLIC_CDN_URL || 'https://cdn.dojopool.com').hostname,
        ],
        formats: ['image/avif', 'image/webp'],
        minimumCacheTTL: 60,
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    },
    
    // Asset optimization
    compress: true,
    poweredByHeader: false,
    generateEtags: true,
    
    // Cache optimization
    onDemandEntries: {
        maxInactiveAge: 60 * 60 * 1000, // 1 hour
        pagesBufferLength: 5,
    },
    
    // Bundle optimization
    experimental: {
        optimizeCss: true,
        optimizePackageImports: [
            '@mui/material',
            '@mui/icons-material',
            'date-fns',
            'lodash',
        ],
        webpackBuildWorker: true,
    },
    
    webpack: (config, { dev, isServer }) => {
        // Optimize images
        config.module.rules.push({
            test: /\.(jpe?g|png|svg|gif|ico|webp|avif)$/,
            use: [
                {
                    loader: 'image-webpack-loader',
                    options: {
                        mozjpeg: {
                            progressive: true,
                            quality: 80,
                        },
                        optipng: {
                            enabled: true,
                            optimizationLevel: 7,
                        },
                        pngquant: {
                            quality: [0.7, 0.9],
                            speed: 4,
                        },
                        gifsicle: {
                            interlaced: false,
                        },
                        webp: {
                            quality: 80,
                            lossless: false,
                            nearLossless: 60,
                        },
                    },
                },
            ],
        });

        // Bundle optimization
        if (!dev && !isServer) {
            config.optimization = {
                ...config.optimization,
                splitChunks: {
                    chunks: 'all',
                    minSize: 20000,
                    maxSize: 244000,
                    minChunks: 1,
                    maxAsyncRequests: 30,
                    maxInitialRequests: 30,
                    cacheGroups: {
                        default: false,
                        vendors: false,
                        framework: {
                            chunks: 'all',
                            name: 'framework',
                            test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
                            priority: 40,
                            enforce: true,
                        },
                        lib: {
                            test(module) {
                                return module.size() > 160000 &&
                                    /node_modules[/\\]/.test(module.identifier());
                            },
                            name(module) {
                                const hash = crypto.createHash('sha1');
                                hash.update(module.identifier());
                                return hash.digest('hex').substring(0, 8);
                            },
                            priority: 30,
                            minChunks: 1,
                            reuseExistingChunk: true,
                        },
                        commons: {
                            name: 'commons',
                            minChunks: 2,
                            priority: 20,
                        },
                        shared: {
                            name(module, chunks) {
                                return crypto
                                    .createHash('sha1')
                                    .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                                    .digest('hex') + '-shared';
                            },
                            priority: 10,
                            minChunks: 2,
                            reuseExistingChunk: true,
                        },
                    },
                },
            };
        }

        return config;
    },

    // Headers for static assets
    async headers() {
        return [
            {
                source: '/images/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: cdnConfig.assetTypes.images.maxAge.toString(),
                    },
                ],
            },
            {
                source: '/static/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: cdnConfig.assetTypes.static.maxAge.toString(),
                    },
                ],
            },
            {
                source: '/fonts/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: cdnConfig.assetTypes.fonts.maxAge.toString(),
                    },
                ],
            },
        ];
    },

    // Environment variables that will be exposed to the browser
    env: {
        NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    },
    api: {
        bodyParser: {
            sizeLimit: '10mb',
        },
    },
};

module.exports = nextConfig; 