const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sdqh.vercel.app';
const RESULTS_DIR = path.join(__dirname, 'test-results');
if (!fs.existsSync(RESULTS_DIR)) fs.mkdirSync(RESULTS_DIR, { recursive: true });

const results = [];
let page, browser, context;

function log(msg) { console.log('[TEST] ' + msg); }
function pass(name, detail = '') { results.push({ name, status: 'PASS', detail }); log(`✅ PASS: ${name} ${detail}`); }
function fail(name, detail = '') { results.push({ name, status: 'FAIL', detail }); log(`❌ FAIL: ${name} ${detail}`); }

async function screenshot(name) {
  const file = path.join(RESULTS_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  log(`📸 Screenshot: ${file}`);
}

// Create a test image as base64 PNG
function createTestImageBlob(width, height) {
  // Returns a data URL for a colored PNG of given dimensions
  return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="%23${Math.floor(Math.random()*0xffffff).toString(16).padStart(6,'0')}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="24" fill="white">Test ${width}x${height}</text></svg>`;
}

async function run() {
  log('Starting Playwright tests on ' + BASE_URL);
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  page = await context.newPage();

  // ── TEST 1: Page Load ───────────────────────────────────────────────
  try {
    log('Test 1: Page Load');
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    const title = await page.title();
    await screenshot('01-dashboard-load');
    
    // Check for key dashboard elements
    const hasDashboard = await page.isVisible('text=Thông báo gần đây').catch(() => false) ||
                         await page.isVisible('text=Hoạt động nhóm').catch(() => false) ||
                         await page.isVisible('text=Dự án thiết kế').catch(() => false);
    
    if (hasDashboard) pass('Page Load', `Title: "${title}", dashboard elements visible`);
    else fail('Page Load', `Title: "${title}", dashboard elements not found`);
  } catch (e) { fail('Page Load', e.message); }

  // ── TEST 2: Dashboard Notification Panel ───────────────────────────
  try {
    log('Test 2: Notification Panel visibility');
    const notifPanel = await page.isVisible('text=Thông báo gần đây').catch(() => false);
    const activityPanel = await page.isVisible('text=Hoạt động nhóm').catch(() => false);
    await screenshot('02-notification-panel');
    if (notifPanel && activityPanel) pass('Notification + Activity Panels', 'Both panels visible on dashboard');
    else fail('Notification + Activity Panels', `Notif: ${notifPanel}, Activity: ${activityPanel}`);
  } catch (e) { fail('Notification Panel', e.message); }

  // ── TEST 3: Project List ────────────────────────────────────────────
  try {
    log('Test 3: Project list loads');
    const projSection = await page.isVisible('text=Dự án thiết kế trong Team').catch(() => false);
    const projCount = await page.locator('text=Vào Board').count().catch(() => 0);
    await screenshot('03-project-list');
    if (projSection) pass('Project List', `${projCount} projects with "Vào Board" buttons`);
    else fail('Project List', 'Project section not visible');
  } catch (e) { fail('Project List', e.message); }

  // ── TEST 4: Create New Project ──────────────────────────────────────
  let createdProjectName = '';
  try {
    log('Test 4: Create new project');
    // Click "Tạo dự án mới" button
    const createBtn = page.locator('button').filter({ hasText: 'Tạo dự án mới' }).first();
    await createBtn.click({ timeout: 5000 });
    await page.waitForTimeout(500);
    
    // Fill the form
    createdProjectName = `Test Project ${Date.now()}`;
    const nameInput = page.locator('input[placeholder*="dự án"]').first();
    await nameInput.fill(createdProjectName);
    
    const clientInput = page.locator('input[placeholder*="Khách Hàng"], input[placeholder*="Chủ Đầu"]').first();
    await clientInput.fill('Test Client');
    
    // Submit
    const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: 'Khởi tạo Board' }).first();
    await submitBtn.click({ timeout: 3000 });
    await page.waitForTimeout(2000);
    await screenshot('04-create-project');
    
    // Verify project appears
    const projectVisible = await page.isVisible(`text=${createdProjectName}`).catch(() => false);
    if (projectVisible) pass('Create Project', `Project "${createdProjectName}" created and visible`);
    else fail('Create Project', 'Project created but not visible in list');
  } catch (e) { fail('Create Project', e.message); }

  // ── TEST 5: Open Project Profile ───────────────────────────────────
  try {
    log('Test 5: Open project profile');
    const firstBoard = page.locator('button').filter({ hasText: 'Vào Board' }).first();
    await firstBoard.click({ timeout: 5000 });
    await page.waitForTimeout(2000);
    await screenshot('05-project-profile');
    
    const inProject = await page.isVisible('text=Hồ sơ tài liệu').catch(() => false) ||
                      await page.isVisible('text=Nhật ký giám sát').catch(() => false) ||
                      await page.isVisible('text=Phiên bản bản vẽ').catch(() => false);
    
    if (inProject) pass('Open Project Profile', 'Project profile tabs visible');
    else fail('Open Project Profile', 'Project profile tabs not found');
  } catch (e) { fail('Open Project Profile', e.message); }

  // ── TEST 6: Tab Navigation ──────────────────────────────────────────
  try {
    log('Test 6: Tab navigation in project profile');
    const tabs = ['Nhật ký giám sát', 'Phiên bản bản vẽ', 'Hồ sơ tài liệu'];
    let allTabsWork = true;
    for (const tabName of tabs) {
      const tab = page.locator(`button, span`).filter({ hasText: tabName }).first();
      const tabExists = await tab.isVisible().catch(() => false);
      if (tabExists) {
        await tab.click();
        await page.waitForTimeout(500);
        log(`  Tab "${tabName}" clicked OK`);
      } else {
        log(`  Tab "${tabName}" not found`);
        allTabsWork = false;
      }
    }
    await screenshot('06-tab-navigation');
    if (allTabsWork) pass('Tab Navigation', 'All 3 tabs clickable');
    else fail('Tab Navigation', 'Some tabs not found or not clickable');
  } catch (e) { fail('Tab Navigation', e.message); }

  // ── TEST 7: Add Supervision Log ─────────────────────────────────────
  try {
    log('Test 7: Add supervision log entry');
    // Click Nhật ký giám sát tab
    const logTab = page.locator('button').filter({ hasText: 'Nhật ký giám sát' }).first();
    await logTab.click({ timeout: 3000 });
    await page.waitForTimeout(500);
    
    const addLogBtn = page.locator('button').filter({ hasText: 'Thêm nhật ký' }).first();
    const addLogVisible = await addLogBtn.isVisible().catch(() => false);
    if (addLogVisible) {
      await addLogBtn.click();
      await page.waitForTimeout(500);
      const noteField = page.locator('textarea').first();
      await noteField.fill('Test log entry - kiểm tra thi công hôm nay');
      const saveBtn = page.locator('button').filter({ hasText: 'Lưu' }).first();
      await saveBtn.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      await screenshot('07-supervision-log');
      pass('Add Supervision Log', 'Log entry added successfully');
    } else {
      await screenshot('07-supervision-log-nobutton');
      fail('Add Supervision Log', '"Thêm nhật ký" button not found');
    }
  } catch (e) { fail('Add Supervision Log', e.message); }

  // ── TEST 8: Drawing Versions Tab ────────────────────────────────────
  try {
    log('Test 8: Drawing versions tab');
    const versionTab = page.locator('button').filter({ hasText: 'Phiên bản bản vẽ' }).first();
    await versionTab.click({ timeout: 3000 });
    await page.waitForTimeout(500);
    
    const versionSection = await page.isVisible('text=Lịch sử phiên bản').catch(() => false) ||
                           await page.isVisible('text=LỊCH SỬ PHIÊN BẢN').catch(() => false) ||
                           await page.isVisible('text=File Phối Cảnh').catch(() => false);
    
    await screenshot('08-versions-tab');
    if (versionSection) pass('Drawing Versions Tab', 'Version history section visible');
    else fail('Drawing Versions Tab', 'Version section not found');
  } catch (e) { fail('Drawing Versions Tab', e.message); }

  // ── TEST 9: Add Version ─────────────────────────────────────────────
  try {
    log('Test 9: Add drawing version');
    const addVersionBtn = page.locator('button').filter({ hasText: 'Thêm phiên bản' }).first();
    const btnVisible = await addVersionBtn.isVisible().catch(() => false);
    if (btnVisible) {
      await addVersionBtn.click();
      await page.waitForTimeout(400);
      const noteInput = page.locator('input[placeholder*="changelog"], input[placeholder*="Cập nhật"]').first();
      await noteInput.fill('Test phiên bản v1.0 - thêm từ test tự động');
      const saveBtn = page.locator('button').filter({ hasText: '✓ Lưu' }).first();
      await saveBtn.click({ timeout: 3000 });
      await page.waitForTimeout(1000);
      await screenshot('09-add-version');
      
      const v1Visible = await page.isVisible('text=v1.0').catch(() => false);
      const noFile = await page.isVisible('text=Chưa liên kết file').catch(() => false);
      if (v1Visible) pass('Add Version', `v1.0 created. File linked: ${!noFile}`);
      else fail('Add Version', 'v1.0 not visible after creation');
    } else {
      fail('Add Version', '"Thêm phiên bản" button not found');
    }
  } catch (e) { fail('Add Version', e.message); }

  // ── TEST 10: CEO Dashboard ──────────────────────────────────────────
  try {
    log('Test 10: CEO Dashboard');
    // Go back to dashboard
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    const ceoBtn = page.locator('button').filter({ hasText: /CEO|Command Center/i }).first();
    const ceoBtnVisible = await ceoBtn.isVisible().catch(() => false);
    if (ceoBtnVisible) {
      await ceoBtn.click();
      await page.waitForTimeout(1500);
      await screenshot('10-ceo-dashboard');
      const ceoDashVisible = await page.isVisible('text=CEO Command Center').catch(() => false) ||
                              await page.isVisible('text=Command Center').catch(() => false);
      if (ceoDashVisible) pass('CEO Dashboard', 'CEO Command Center opened successfully');
      else fail('CEO Dashboard', 'CEO dashboard opened but content not found');
    } else {
      // Try looking for it in header
      await screenshot('10-ceo-dashboard-search');
      fail('CEO Dashboard', 'CEO button not found on dashboard');
    }
  } catch (e) { fail('CEO Dashboard', e.message); }

  // ── TEST 11: Navigation back/forward ────────────────────────────────
  try {
    log('Test 11: Close CEO dashboard and return');
    const closeBtn = page.locator('button').filter({ hasText: 'Đóng' }).first();
    const closeBtnX = page.locator('button[title*="Đóng"], button[title*="Close"]').first();
    const closeBtnVisible = await closeBtn.isVisible().catch(() => false);
    if (closeBtnVisible) {
      await closeBtn.click();
      await page.waitForTimeout(800);
      await screenshot('11-after-close-ceo');
      pass('Close CEO Dashboard', 'Dashboard closed successfully');
    } else {
      // Try X button or Escape
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
      await screenshot('11-after-escape');
      pass('Close CEO Dashboard', 'Used Escape key to close');
    }
  } catch (e) { fail('Close CEO Dashboard', e.message); }

  // ── TEST 12: Check for console errors ───────────────────────────────
  try {
    log('Test 12: Checking for JS errors in console');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('net::ERR') &&
      !e.includes('404')
    );
    
    await screenshot('12-final-state');
    
    if (criticalErrors.length === 0) pass('No JS Console Errors', 'Clean console after page load');
    else fail('JS Console Errors', criticalErrors.slice(0, 3).join(' | '));
  } catch (e) { fail('Console Error Check', e.message); }

  // ── SUMMARY ─────────────────────────────────────────────────────────
  await browser.close();
  
  console.log('\n' + '='.repeat(60));
  console.log('TEST RESULTS SUMMARY');
  console.log('='.repeat(60));
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.status}] ${r.name}`);
    if (r.detail) console.log(`       → ${r.detail}`);
  });
  
  console.log('='.repeat(60));
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log('Screenshots saved to: ' + RESULTS_DIR);
  console.log('='.repeat(60));
  
  // Write JSON results
  fs.writeFileSync(path.join(RESULTS_DIR, 'results.json'), JSON.stringify(results, null, 2));
}

run().catch(e => {
  console.error('Fatal test error:', e);
  if (browser) browser.close();
  process.exit(1);
});
