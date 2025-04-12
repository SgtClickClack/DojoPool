import React from 'react';
import ReactDOMServer from 'react-dom/server';
import puppeteer from 'puppeteer';
import { join } from 'path';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import ScreenshotTemplate from '../components/app-store/ScreenshotTemplate';

interface ScreenshotConfig {
  name: string;
  deviceType: 'iphone' | 'ipad';
  content: React.ReactNode;
}

const TEMP_DIR = join(process.cwd(), 'temp');
const OUTPUT_DIR = join(process.cwd(), 'public', 'app-store-assets');

const SCREENSHOTS: ScreenshotConfig[] = [
  {
    name: 'home-screen',
    deviceType: 'iphone',
    content: (
      <div style={{ padding: '20px' }}>
        <h1>Welcome to DojoPool</h1>
        <p>Transform your pool game with AI-powered analysis</p>
      </div>
    )
  },
  {
    name: 'game-analysis',
    deviceType: 'iphone',
    content: (
      <div style={{ padding: '20px' }}>
        <h1>Real-time Game Analysis</h1>
        <p>Get instant feedback on your shots and strategy</p>
      </div>
    )
  },
  // Add more screenshots as needed
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
      // Render component to HTML
      const html = ReactDOMServer.renderToString(
        <ScreenshotTemplate deviceType={screenshot.deviceType}>
          {screenshot.content}
        </ScreenshotTemplate>
      );

      // Write HTML to temp file
      const tempFile = join(TEMP_DIR, `${screenshot.name}.html`);
      const fullHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; }
              * { font-family: -apple-system, system-ui, BlinkMacSystemFont; }
            </style>
          </head>
          <body>${html}</body>
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