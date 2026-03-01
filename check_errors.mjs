const puppeteer = require('puppeteer');

(async () => {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Catch console errors and logs
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('PAGE ERROR:', msg.text());
        } else {
            console.log('PAGE LOG:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.error('PAGE UNCAUGHT ERROR:', err.message);
    });

    console.log("Navigating to local production build...");
    try {
        await page.goto('http://localhost:4173/', { waitUntil: 'networkidle2' });
        console.log("Navigation complete. Waiting a few seconds...");
        await new Promise(r => setTimeout(r, 6000));
        console.log("Done checking.");
    } catch (e) {
        console.error("Navigation failed:", e);
    }

    await browser.close();
})();
