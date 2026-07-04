import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('PAGE ERROR:', msg.text());
    else console.log('PAGE LOG:', msg.text());
  });
  page.on('pageerror', err => console.log('UNHANDLED EXCEPTION:', err));
  try {
    console.log("Navigating to facturation...");
    await page.goto('http://127.0.0.1:3010/facturation', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const btns = await page.$$('button i.i-solar-pen-line-duotone');
    if (btns.length > 0) {
      console.log('Button found, clicking...');
      await btns[0].click();
      await page.waitForTimeout(3000);
    } else {
      console.log('Button not found');
    }
  } catch (err) {
    console.log('SCRIPT ERROR:', err);
  } finally {
    await browser.close();
  }
})();
