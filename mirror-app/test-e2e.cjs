const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 414, height: 896 }
  });

  try {
    console.log('Navigating to app...');
    await page.goto('https://sdqh.vercel.app');
    await page.waitForLoadState('networkidle');

    // Click "Bắt đầu làm việc"
    const startBtn = await page.$('text="Bắt đầu làm việc"');
    if (startBtn) {
      await startBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.screenshot({ path: 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\72239777-76a2-485d-9b84-8700a98ea23c\\test_home.png' });

    // Click first project card
    const projectCards = await page.$$('.bg-white.rounded-3xl');
    if (projectCards.length > 0) {
      await projectCards[0].click();
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\72239777-76a2-485d-9b84-8700a98ea23c\\test_project.png' });

      // Click the first floor plan "Mặt bằng tổng thể" or similar
      const planItem = await page.$('.aspect-square.rounded-2xl');
      if (planItem) {
        await planItem.click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\72239777-76a2-485d-9b84-8700a98ea23c\\test_plan.png' });

        // Click "Chốt lỗi"
        const pinModeBtn = await page.$('text="Chốt lỗi"');
        if (pinModeBtn) {
          await pinModeBtn.click();
          await page.waitForTimeout(1000);
          await page.screenshot({ path: 'C:\\Users\\DELL\\.gemini\\antigravity\\brain\\72239777-76a2-485d-9b84-8700a98ea23c\\test_pinmode.png' });
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
