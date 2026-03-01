import puppeteer from 'puppeteer';

(async () => {
    console.log("Launching Puppeteer...");
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Disable cache
    await page.setCacheEnabled(false);

    // Catch console errors and logs
    page.on('console', msg => {
        if (msg.type() === 'error') {
            console.error('PAGE ERROR:', msg.text());
        }
    });

    page.on('pageerror', err => {
        console.error('PAGE UNCAUGHT ERROR:', err.message);
    });

    page.on('requestfailed', request => {
        console.error('REQUEST FAILED:', request.url(), request.failure().errorText);
    });

    console.log("Navigating to production vercel site with cache disabled...");
    try {
        // Add random query param to bust cache
        const cacheBuster = Date.now();
        await page.goto(`https://task-manager-supabase-mkxx.vercel.app/?cb=${cacheBuster}`, { waitUntil: 'networkidle0' });
        console.log("On Login page. Entering credentials...");

        await page.type('input[type="email"]', 'minh@dqh.vn');
        await page.type('input[type="password"]', 'NewPass456!@#');

        console.log("Clicking Login...");
        await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle0' }),
            page.click('button[type="submit"]')
        ]);

        console.log("Logged in. Waiting 5s to see if Dashboard crashes...");
        await new Promise(r => setTimeout(r, 5000));

        const html = await page.content();
        if (html.includes('id="root"')) {
            const rootHTML = await page.$eval('#root', el => el.innerHTML);
            if (!rootHTML || rootHTML.trim() === '') {
                console.error("PAGE IS BLANK! #root is empty.");
            } else {
                console.log("Page rendered content inside #root successfully!");
            }
        }

    } catch (e) {
        console.error("Navigation/Test failed:", e);
    }

    await browser.close();
})();
