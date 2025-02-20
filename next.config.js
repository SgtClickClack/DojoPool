/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    swcMinify: true,
    // Ensure proper handling of server-side rendering
    poweredByHeader: false,
    compress: true,
    eslint: {
        ignoreDuringBuilds: true
    },
    compiler: {
        styledComponents: true,
        removeConsole: process.env.NODE_ENV === 'production',
        emotion: true
    },
    generateEtags: false,
    experimental: {
        serverActions: true
    }
};

module.exports = nextConfig;