// Automation script for adding products to cart with stealth, proxies, and human-like behavior
// Requirements: playwright-extra, puppeteer-extra-plugin-stealth, fs-extra, axios
// To debug stealth: set DEBUG=playwright-extra*,puppeteer-extra* && node scripts/automation.js

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

// Add the stealth plugin BEFORE any browser launch
chromium.use(stealth);

// Screenshots folder
const screenshotsDir = path.join(__dirname, '../screenshots');
fs.ensureDirSync(screenshotsDir);

// Helper: sleep for human-like delays
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

// Fetch a single message from the fetch-sqs API
async function fetchNextProduct() {
  try {
    const res = await axios.get('http://localhost:3000/api/fetch-sqs'); // Update with your actual API endpoint
    if (res.data && res.data.messages && res.data.messages.length > 0) {
      return res.data.messages[0];
    }
    return null;
  } catch (err) {
    console.error('Error fetching from SQS API:', err.message);
    return null;
  }
}

// Main automation function for a single product
async function automateProduct(product) {
  const { url, vendor_name, id, name, quantity } = product;
  console.log('url', url)
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  try {
    // Human-like viewport
    await page.setViewportSize({ width: 1280 + Math.floor(Math.random()*100), height: 800 + Math.floor(Math.random()*100) });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(2000 + Math.random()*2000);

    // Site-specific logic
    switch ((vendor_name || '').toLowerCase()) {
      case 'asda':
        await automateAsda(page, product);
        break;
      case "sainsbury's":
        await automateSainsburys(page, product);
        break;
      case 'amazon uk':
        await automateAmazon(page, product);
        break;
      // Add more cases for other vendors as needed
      default:
        console.log(`No automation implemented for vendor: ${vendor_name}`);
    }
  } catch (err) {
    console.error(`Error processing ${url}:`, err);
  } finally {
    await browser.close();
  }
}

// Example: ASDA automation (demonstration only)
async function automateAsda(page, product) {
  const screenshotPath = path.join(screenshotsDir, `${product.id}_Asda.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('ASDA screenshot saved:', screenshotPath);
}

// Example: Sainsbury's automation (demonstration only)
async function automateSainsburys(page, product) {
  const screenshotPath = path.join(screenshotsDir, `${product.id}_Sainsburys.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Sainsbury's screenshot saved:", screenshotPath);
}

// Example: Amazon UK automation (demonstration only)
async function automateAmazon(page, product) {
  const screenshotPath = path.join(screenshotsDir, `${product.id}_AmazonUK.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Amazon UK screenshot saved:', screenshotPath);
}

// Main loop: fetch and process one product at a time
(async () => {
  let product;
  while ((product = await fetchNextProduct())) {
    console.log('product', product);
    await automateProduct(product);
    // TODO: Optionally call API to delete message from SQS after processing
    // await axios.post('http://localhost:3000/api/delete-sqs', { MessageId: product.MessageId });
    await sleep(2000 + Math.random()*2000); // Human-like delay between products
  }
  console.log('Automation complete. No more products in queue.');
})();

// Note: To fully automate login, quantity update, and add-to-cart, you must implement site-specific logic for each vendor.
// This script provides the structure and stealth/proxy/human-like foundation. 