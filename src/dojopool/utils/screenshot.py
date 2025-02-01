import os
from datetime import datetime

from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def take_screenshot(url, filename):
    """Take a screenshot of the specified URL using headless Chrome"""
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument("--window-size=1920,1080")

    driver = webdriver.Chrome(options=chrome_options)
    try:
        driver.get(url)
        # Wait for page to load
        driver.implicitly_wait(5)

        # Create screenshots directory if it doesn't exist
        os.makedirs("static/screenshots", exist_ok=True)

        # Take screenshot
        filepath = f'static/screenshots/{filename}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.png'
        driver.save_screenshot(filepath)
        return filepath
    finally:
        driver.quit()
