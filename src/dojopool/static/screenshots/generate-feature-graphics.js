const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Feature graphic configurations
const featureGraphics = {
    ios: [
        { name: 'iPhone', width: 1242, height: 2688 },
        { name: 'iPad', width: 2048, height: 2732 }
    ],
    android: [
        { name: 'Phone', width: 1024, height: 500 },
        { name: 'Tablet', width: 1800, height: 1200 }
    ]
};

// Feature content
const features = [
    {
        title: 'AI-Powered Game Analysis',
        description: 'Get instant feedback on your gameplay with advanced AI analysis',
        icon: '🎯',
        color: '#00c6ff'
    },
    {
        title: 'Live Tournaments',
        description: 'Compete in real-time tournaments with players worldwide',
        icon: '🏆',
        color: '#ff6b6b'
    },
    {
        title: 'Interactive Training',
        description: 'Learn from AI-powered coaching and improve your skills',
        icon: '🎓',
        color: '#4facfe'
    },
    {
        title: 'Social Features',
        description: 'Connect with players, share achievements, and build your community',
        icon: '👥',
        color: '#a18cd1'
    }
];

// Ensure output directories exist
const ensureDirectories = () => {
    const platforms = ['ios', 'android'];
    platforms.forEach(platform => {
        const dir = path.join(__dirname, 'app-store', platform, 'feature-graphics');
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Generate feature graphics for a specific platform
const generateFeatureGraphics = async (browser, platform) => {
    console.log(`Generating ${platform} feature graphics...`);

    for (const device of featureGraphics[platform]) {
        const page = await browser.newPage();
        await page.setViewport({
            width: device.width,
            height: device.height,
            deviceScaleFactor: 2
        });

        // Create HTML content for the feature graphic
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {
                        margin: 0;
                        padding: 0;
                        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                        background: linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%);
                        color: white;
                        height: 100vh;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                    }
                    .container {
                        width: 90%;
                        max-width: 1200px;
                        text-align: center;
                    }
                    .logo {
                        font-size: 72px;
                        margin-bottom: 40px;
                    }
                    .features {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 40px;
                        margin-top: 40px;
                    }
                    .feature {
                        background: rgba(255, 255, 255, 0.1);
                        padding: 30px;
                        border-radius: 20px;
                        text-align: center;
                    }
                    .feature-icon {
                        font-size: 48px;
                        margin-bottom: 20px;
                    }
                    .feature-title {
                        font-size: 24px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .feature-description {
                        font-size: 16px;
                        opacity: 0.8;
                    }
                    .app-name {
                        font-size: 48px;
                        font-weight: bold;
                        margin-bottom: 20px;
                        background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">🎱</div>
                    <h1 class="app-name">DojoPool</h1>
                    <div class="features">
                        ${features.map(feature => `
                            <div class="feature">
                                <div class="feature-icon">${feature.icon}</div>
                                <h2 class="feature-title">${feature.title}</h2>
                                <p class="feature-description">${feature.description}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </body>
            </html>
        `;

        await page.setContent(htmlContent);
        await page.evaluateHandle('document.fonts.ready');

        const screenshotPath = path.join(
            __dirname,
            'app-store',
            platform,
            'feature-graphics',
            `${device.name}-feature-graphic.png`
        );

        await page.screenshot({
            path: screenshotPath,
            fullPage: true
        });

        console.log(`✓ Generated ${device.name} feature graphic`);
        await page.close();
    }
};

// Main function
const main = async () => {
    try {
        ensureDirectories();

        const browser = await puppeteer.launch({
            headless: true,
            defaultViewport: null
        });

        // Generate iOS feature graphics
        await generateFeatureGraphics(browser, 'ios');

        // Generate Android feature graphics
        await generateFeatureGraphics(browser, 'android');

        await browser.close();
        console.log('\nAll feature graphics generated successfully!');
    } catch (error) {
        console.error('Error generating feature graphics:', error);
        process.exit(1);
    }
};

main(); 