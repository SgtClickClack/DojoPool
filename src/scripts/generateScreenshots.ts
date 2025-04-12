import { join } from 'path';
import { mkdirSync, existsSync, writeFileSync } from 'fs';
import puppeteer from 'puppeteer';

const TEMP_DIR = join(process.cwd(), 'temp');
const OUTPUT_DIR = join(process.cwd(), 'public', 'app-store-assets');

interface ScreenshotConfig {
  name: string;
  deviceType: 'iphone' | 'ipad';
  content: string;
}

const SCREENSHOTS: ScreenshotConfig[] = [
  {
    name: 'home-screen',
    deviceType: 'iphone',
    content: `
      <div style="padding: 20px; font-family: -apple-system, system-ui, BlinkMacSystemFont;">
        <h1 style="font-size: 48px; color: #1976d2;">Welcome to DojoPool</h1>
        <p style="font-size: 24px; color: #666;">Transform your pool game with AI-powered analysis</p>
      </div>
    `
  },
  {
    name: 'game-analysis',
    deviceType: 'iphone',
    content: `
      <div style="padding: 20px; font-family: -apple-system, system-ui, BlinkMacSystemFont;">
        <h1 style="font-size: 48px; color: #1976d2;">Real-time Game Analysis</h1>
        <p style="font-size: 24px; color: #666;">Get instant feedback on your shots and strategy</p>
      </div>
    `
  }
];

async function generateScreenshots() {
  try {
    // Create directories if they don't exist
    [TEMP_DIR, OUTPUT_DIR].forEach(dir => {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    });

    // Launch browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    for (const screenshot of SCREENSHOTS) {
      // Write HTML to temp file
      const tempFile = join(TEMP_DIR, `${screenshot.name}.html`);
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; background-color: white; }
              * { font-family: -apple-system, system-ui, BlinkMacSystemFont; }
            </style>
          </head>
          <body>${screenshot.content}</body>
        </html>
      `;
      writeFileSync(tempFile, fullHtml);

      // Set viewport size based on device type
      const viewport = screenshot.deviceType === 'iphone' 
        ? { width: 1242, height: 2688 }
        : { width: 2048, height: 2732 };
      
      await page.setViewport(viewport);
      await page.goto(`file://${tempFile}`);
      
      // Take screenshot
      await page.screenshot({
        path: join(OUTPUT_DIR, `${screenshot.name}.png`),
        fullPage: true
      });

      console.log(`Generated screenshot: ${screenshot.name}`);
    }

    await browser.close();
    console.log('All screenshots generated successfully!');
  } catch (error) {
    console.error('Error generating screenshots:', error);
    process.exit(1);
  }
}

// Run the script
generateScreenshots(); 