// 사용: node scripts/shot.mjs <url-hash-path> <out.png> [width] [height] [fullPage]
// 예: node scripts/shot.mjs /home shots/home.png 393 852
import { chromium } from 'playwright';
const [, , path = '/home', out = 'shot.png', w = '393', h = '852', full = '0', base = 'http://localhost:5173/'] = process.argv;
import { existsSync } from 'node:fs';
const exec = process.env.PW_EXEC ?? (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await chromium.launch(exec ? { executablePath: exec } : {});
const page = await browser.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const sep = base.includes('?') ? '' : (+w < 520 ? '?frame=0' : '');
await page.goto(`${base}${sep}#${path}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(+process.env.WAIT || 900);
await page.screenshot({ path: out, fullPage: full === '1' });
if (errors.length) console.log('ERRORS:', errors.join('\n'));
await browser.close();
console.log('saved', out);
