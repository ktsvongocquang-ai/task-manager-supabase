const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on('pageerror', error => {
    console.log(`PAGE ERROR: ${error.message}`);
  });
  
  page.on('console', msg => {
    if (msg.type() === 'error')
      console.log(`CONSOLE ERROR: ${msg.text()}`);
  });

  console.log('Navigating to http://localhost:4173 ...');
  try {
    await page.goto('http://localhost:4173', { waitUntil: 'networkidle' });
    console.log('Page loaded successfully.');
  } catch (e) {
    console.error(`Navigation failed: ${e}`);
  }
  
  await browser.close();
})();
