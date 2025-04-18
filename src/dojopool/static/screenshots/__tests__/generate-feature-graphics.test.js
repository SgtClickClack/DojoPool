const fs = require("fs");
const path = require("path");
const { generateFeatureGraphics } = require("../generate-feature-graphics");

jest.mock("puppeteer", () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setViewport: jest.fn().mockResolvedValue(),
      setContent: jest.fn().mockResolvedValue(),
      evaluateHandle: jest.fn().mockResolvedValue(),
      screenshot: jest.fn().mockResolvedValue(),
      close: jest.fn().mockResolvedValue(),
    }),
    close: jest.fn().mockResolvedValue(),
  }),
}));

describe("Feature Graphics Generation", () => {
  beforeEach(() => {
    // Mock fs functions
    jest.spyOn(fs, "existsSync").mockReturnValue(false);
    jest.spyOn(fs, "mkdirSync").mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should generate feature graphics for iOS devices", async () => {
    const browser = { newPage: jest.fn() };
    await generateFeatureGraphics(browser, "ios");

    expect(browser.newPage).toHaveBeenCalledTimes(2); // iPhone and iPad
  });

  test("should generate feature graphics for Android devices", async () => {
    const browser = { newPage: jest.fn() };
    await generateFeatureGraphics(browser, "android");

    expect(browser.newPage).toHaveBeenCalledTimes(2); // Phone and Tablet
  });

  test("should create output directories if they dont exist", async () => {
    const browser = { newPage: jest.fn() };
    await generateFeatureGraphics(browser, "ios");

    expect(fs.mkdirSync).toHaveBeenCalled();
  });

  test("should handle HTML content generation", async () => {
    const browser = {
      newPage: jest.fn().mockResolvedValue({
        setViewport: jest.fn().mockResolvedValue(),
        setContent: jest.fn().mockResolvedValue(),
        evaluateHandle: jest.fn().mockResolvedValue(),
        screenshot: jest.fn().mockResolvedValue(),
        close: jest.fn().mockResolvedValue(),
      }),
    };

    await generateFeatureGraphics(browser, "ios");

    const page = await browser.newPage();
    expect(page.setContent).toHaveBeenCalledWith(
      expect.stringContaining("DojoPool"),
    );
  });
});
