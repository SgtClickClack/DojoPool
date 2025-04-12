const fs = require('fs');
const path = require('path');
const { generateScreenshots } = require('../generate-screenshots');

jest.mock('puppeteer', () => ({
    launch: jest.fn().mockResolvedValue({
        newPage: jest.fn().mockResolvedValue({
            setViewport: jest.fn().mockResolvedValue(),
            setContent: jest.fn().mockResolvedValue(),
            evaluate: jest.fn().mockResolvedValue(),
            screenshot: jest.fn().mockResolvedValue(),
            close: jest.fn().mockResolvedValue()
        }),
        close: jest.fn().mockResolvedValue()
    })
}));

describe('Screenshot Generation', () => {
    beforeEach(() => {
        // Mock fs functions
        jest.spyOn(fs, 'existsSync').mockReturnValue(false);
        jest.spyOn(fs, 'mkdirSync').mockImplementation();
        jest.spyOn(fs, 'readFileSync').mockReturnValue('template content');
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    test('should generate screenshots for iOS devices', async () => {
        const browser = { newPage: jest.fn() };
        await generateScreenshots(browser, 'ios');
        
        expect(browser.newPage).toHaveBeenCalledTimes(4); // 4 iOS devices
    });

    test('should generate screenshots for Android devices', async () => {
        const browser = { newPage: jest.fn() };
        await generateScreenshots(browser, 'android');
        
        expect(browser.newPage).toHaveBeenCalledTimes(3); // 3 Android devices
    });

    test('should create output directories if they dont exist', async () => {
        const browser = { newPage: jest.fn() };
        await generateScreenshots(browser, 'ios');
        
        expect(fs.mkdirSync).toHaveBeenCalled();
    });

    test('should handle template file reading', async () => {
        const browser = { newPage: jest.fn() };
        await generateScreenshots(browser, 'ios');
        
        expect(fs.readFileSync).toHaveBeenCalledWith(
            expect.stringContaining('screenshot-template.html'),
            'utf8'
        );
    });
}); 