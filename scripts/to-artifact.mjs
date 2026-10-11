// dist-single/index.html → artifact/wivu.html (doctype/html/head/body 래퍼 제거, title·style·script만)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const html = readFileSync('dist-single/index.html', 'utf8');
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body[^>]*>([\s\S]*?)<\/body>/)[1];
const title = head.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '<title>WivU 프로토타입</title>';
const styles = [...head.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n');
const scripts = [...head.matchAll(/<script[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0]).join('\n');
const metas = [...head.matchAll(/<meta name="(theme-color|description)"[^>]*>/g)].map((m) => m[0]).join('\n');
mkdirSync('artifact', { recursive: true });
const out = `${title}\n${metas}\n${styles}\n${body.trim()}\n${scripts}\n`;
writeFileSync('artifact/wivu.html', out);
console.log(`artifact/wivu.html ${(out.length / 1024).toFixed(0)} KB`);
