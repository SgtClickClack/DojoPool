const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// App store icon sizes (in pixels)
const iconSizes = {
  ios: [
    1024, // App Store
    180, // iPhone 6/7/8 Plus
    167, // iPad Pro
    152, // iPad
    120, // iPhone 6/7/8
    87, // iPhone 5/SE
    80, // iPhone 4
    76, // iPad
    60, // iPhone 3
    58, // iPhone 2
    40, // iPhone 1
    29, // Settings
  ],
  android: [
    1024, // Play Store
    512, // Feature Graphic
    192, // Launcher Icon
    144, // Play Store
    96, // Launcher Icon
    72, // Launcher Icon
    48, // Launcher Icon
  ],
};

// Ensure output directories exist
const ensureDirectories = () => {
  const directories = ["app-store/ios", "app-store/android"];

  directories.forEach((dir) => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
};

// Generate icons for a specific platform
const generateIcons = async (platform, sizes) => {
  const inputPath = path.join(__dirname, "logo.svg");
  const outputDir = path.join(__dirname, "app-store", platform);

  console.log(`Generating ${platform} icons...`);

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);

    try {
      await sharp(inputPath).resize(size, size).png().toFile(outputPath);

      console.log(`✓ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(`✗ Failed to generate ${size}x${size} icon:`, error);
    }
  }
};

// Main function
const main = async () => {
  try {
    ensureDirectories();

    // Generate iOS icons
    await generateIcons("ios", iconSizes.ios);

    // Generate Android icons
    await generateIcons("android", iconSizes.android);

    console.log("\nAll icons generated successfully!");
  } catch (error) {
    console.error("Error generating icons:", error);
    process.exit(1);
  }
};

main();
