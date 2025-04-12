const puppeteer = require('puppeteer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Device configurations
const devices = {
    ios: [
        { name: 'iPhone 14 Pro Max', width: 1290, height: 2796 },
        { name: 'iPhone 14 Plus', width: 1284, height: 2778 },
        { name: 'iPad Pro', width: 2048, height: 2732 },
        { name: 'iPad Air', width: 1640, height: 2360 }
    ],
    android: [
        { name: 'Pixel 7 Pro', width: 1440, height: 3120 },
        { name: 'Samsung S23 Ultra', width: 1440, height: 3088 },
        { name: 'Pixel Tablet', width: 2560, height: 1600 }
    ]
};

// Screenshot scenarios
const scenarios = [
    {
        name: 'game-analysis',
        title: 'AI-Powered Game Analysis',
        description: 'Get instant feedback on your gameplay',
        mockupContent: `
            <div style="background: #1a1a1a; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                <div style="background: #2a2a2a; width: 90%; height: 200px; border-radius: 10px; margin-bottom: 20px;"></div>
                <div style="background: #2a2a2a; width: 90%; height: 100px; border-radius: 10px;"></div>
            </div>
        `
    },
    {
        name: 'tournament',
        title: 'Live Tournaments',
        description: 'Compete in real-time tournaments',
        mockupContent: `
            <div style="background: #1a1a1a; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                <div style="background: #2a2a2a; width: 90%; height: 150px; border-radius: 10px; margin-bottom: 20px;"></div>
                <div style="background: #2a2a2a; width: 90%; height: 150px; border-radius: 10px;"></div>
            </div>
        `
    },
    {
        name: 'training',
        title: 'Interactive Training',
        description: 'Learn from AI-powered coaching',
        mockupContent: `
            <div style="background: #1a1a1a; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                <div style="background: #2a2a2a; width: 90%; height: 250px; border-radius: 10px;"></div>
            </div>
        `
    },
    {
        name: 'social',
        title: 'Social Features',
        description: 'Connect with players worldwide',
        mockupContent: `
            <div style="background: #1a1a1a; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 20px;">
                <div style="background: #2a2a2a; width: 90%; height: 100px; border-radius: 10px; margin-bottom: 20px;"></div>
                <div style="background: #2a2a2a; width: 90%; height: 100px; border-radius: 10px; margin-bottom: 20px;"></div>
                <div style="background: #2a2a2a; width: 90%; height: 100px; border-radius: 10px;"></div>
            </div>
        `
    }
];

// Ensure output directories exist
const ensureDirectories = () => {
    const platforms = ['ios', 'android'];
    platforms.forEach(platform => {
        const dir = path.join(__dirname, 'app-store', platform);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
};

// Generate screenshots for a specific platform
const generateScreenshots = async (browser, platform) => {
    console.log(`Generating ${platform} screenshots...`);

    for (const device of devices[platform]) {
        const page = await browser.newPage();
        await page.setViewport({
            width: device.width,
            height: device.height,
            deviceScaleFactor: 2
        });

        for (const scenario of scenarios) {
            // Read and modify the template
            const templatePath = path.join(__dirname, 'templates', 'screenshot-template.html');
            let template = fs.readFileSync(templatePath, 'utf8');
            
            // Replace placeholders
            template = template.replace('{{title}}', scenario.title);
            template = template.replace('{{description}}', scenario.description);
            
            // Set the content
            await page.setContent(template);
            
            // Inject the mockup content
            await page.evaluate((content) => {
                document.getElementById('app-content').innerHTML = content;
            }, scenario.mockupContent);

            const screenshotPath = path.join(
                __dirname,
                'app-store',
                platform,
                `${device.name}-${scenario.name}.png`
            );

            await page.screenshot({
                path: screenshotPath,
                fullPage: true
            });

            console.log(`✓ Generated ${device.name} - ${scenario.name}`);
        }

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

        // Generate iOS screenshots
        await generateScreenshots(browser, 'ios');

        // Generate Android screenshots
        await generateScreenshots(browser, 'android');

        await browser.close();
        console.log('\nAll screenshots generated successfully!');
    } catch (error) {
        console.error('Error generating screenshots:', error);
        process.exit(1);
    }
};

main(); 