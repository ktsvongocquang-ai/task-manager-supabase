const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('https://sdqh.vercel.app');
  // wait for it to load
  await page.waitForTimeout(3000);
  
  // Try drawing outside
  await page.mouse.move(500, 500);
  await page.mouse.down();
  await page.mouse.move(600, 600, { steps: 10 });
  await page.mouse.up();
  
  await page.waitForTimeout(1000);
  
  // Find SVG paths
  const paths = await page.locator('svg path').elementHandles();
  console.log(`Found ${paths.length} SVG paths.`);
  for (const p of paths) {
    const d = await p.getAttribute('d');
    const color = await p.getAttribute('stroke');
    const w = await p.getAttribute('stroke-width');
    const parentClass = await p.evaluate(node => node.parentElement?.className?.baseVal);
    console.log(`Path: d="${d?.substring(0, 30)}...", stroke="${color}", width="${w}", parentClass="${parentClass}"`);
  }
  
  await browser.close();
})();
