// To debug stealth: set DEBUG=playwright-extra*,puppeteer-extra* && node scripts/automation.js

const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealth);

const screenshotsDir = path.join(__dirname, '../screenshots');
fs.ensureDirSync(screenshotsDir);

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function autoAcceptCookies(page) {
  const selectors = [
    'button[aria-label*="accept"]',
    'button[aria-label*="cookie"]',
    'button[title*="Accept"]',
    'button:has-text("Accept")',
    'button:has-text("I agree")',
    'button:has-text("Got it")',
    'button:has-text("Allow all")',
    'button:has-text("Accept all")',
    'button:has-text("OK")',
    '[id*="accept"]',
    '[id*="cookie"]',
    '[class*="accept"]',
    '[class*="cookie"]'
  ];

  for (const selector of selectors) {
    try {
      const el = await page.$(selector);
      if (el) {
        await el.click();
        console.log(`Clicked cookie banner with selector: ${selector}`);
        return true;
      }
    } catch (e) {
      console.log("🚀 ~ autoAcceptCookies ~ e:", e)
      // Ignore errors and try next selector
    }
  }

  // Try by visible text (Playwright 1.17+ supports :has-text)
  const texts = [
    'Accept', 'I agree', 'Got it', 'Allow all', 'Accept all', 'OK'
  ];
  for (const text of texts) {
    try {
      const el = await page.$(`button:has-text(\"${text}\")`);
      if (el) {
        await el.click();
        console.log(`Clicked cookie banner with text: ${text}`);
        return true;
      }
    } catch (ex) {
      console.log("🚀 ~ autoAcceptCookies ~ ex:", ex)
    }
  }
  console.log('No cookie banner found or auto-accept failed.');
  return false;
}

async function fetchNextProduct() {
  try {
    const res = await axios.get('http://localhost:3000/api/fetch-sqs-messages'); // Update with your actual API endpoint
    if (res.data && res.data.messages && res.data.messages.length > 0) {
      return res.data.messages;
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
    await page.setViewportSize({ width: 1280 + Math.floor(Math.random()*100), height: 800 + Math.floor(Math.random()*100) });
    await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    await sleep(2000 + Math.random()*2000);
    await autoAcceptCookies(page);

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
      default:
        console.log(`No automation implemented for vendor: ${vendor_name}`);
    }
  } catch (err) {
    console.error(`Error processing ${url}:`, err);
  } finally {
    await browser.close();
  }
}

async function automateAsda(page, product) {
  const screenshotPath = path.join(screenshotsDir, `${product.id}_Asda.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('ASDA screenshot saved:', screenshotPath);
}

async function automateSainsburys(page, product) {
  const screenshotPath = path.join(screenshotsDir, `${product.id}_Sainsburys.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Sainsbury's screenshot saved:", screenshotPath);
}

async function automateAmazon(page, product) {
  const screenshotPath = path.join(screenshotsDir, `${product.id}_AmazonUK.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Amazon UK screenshot saved:', screenshotPath);
}

(async () => {
  let products;
  while ((products = await fetchNextProducts()).length > 0) {
    for (const product of products) {
      console.log('product', product);
      await automateProduct(product);
      // await axios.post('http://localhost:3000/api/delete-sqs', { ReceiptHandle : product.ReceiptHandle });
      await sleep(2000 + Math.random() * 2000);
    }
  }
  console.log('Automation complete. No more products in queue.');
})();