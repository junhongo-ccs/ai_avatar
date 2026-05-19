import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';
import { createWorker } from 'tesseract.js';

const targetDir = path.resolve('docs/rag/recruit_ccs');
const shotDir = path.resolve('docs/rag/recruit_ccs/screenshots');

function getSourceUrl(md) {
  const m = md.match(/source_url:\s*(.+)/);
  return m ? m[1].trim() : null;
}

function cleanText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[|¦]/g, 'I')
    .trim();
}

function upsertSection(md, title, body) {
  const sectionRe = new RegExp(`\\n## ${title}[\\s\\S]*?(?=\\n## |$)`, 'm');
  const next = `\n## ${title}\n\n${body}\n`;
  if (sectionRe.test(md)) return md.replace(sectionRe, `\n${next}`);
  return `${md.trimEnd()}\n${next}`;
}

async function run() {
  await fs.mkdir(shotDir, { recursive: true });

  const files = (await fs.readdir(targetDir))
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => path.join(targetDir, f));

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const worker = await createWorker('eng+jpn', 1, {
    langPath: path.resolve('scripts/tessdata'),
    gzip: true,
    cacheMethod: 'none'
  });

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const url = getSourceUrl(raw);
    if (!url) continue;

    const page = await browser.newPage({ ignoreHTTPSErrors: true, viewport: { width: 1440, height: 2200 } });

    let ocrText = '';
    let shotName = '';
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
      await page.waitForTimeout(2000);

      shotName = path.basename(filePath, '.md') + '.png';
      const shotPath = path.join(shotDir, shotName);
      await page.screenshot({ path: shotPath, fullPage: true });

      const img = await fs.readFile(shotPath);
      const r = await worker.recognize(img, {}, { text: true });
      ocrText = cleanText((r?.data?.text || '')).slice(0, 4000);
    } catch (e) {
      ocrText = `OCR失敗: ${e instanceof Error ? e.message : String(e)}`;
    } finally {
      await page.close();
    }

    const relShot = `screenshots/${shotName}`;
    const body = `- screenshot: ${relShot}\n- note: ページ全体スクリーンショットをOCRした結果\n\n${ocrText || '（OCRテキストなし）'}`;
    const updated = upsertSection(raw, 'ページ全体OCR（Playwright）', body);
    await fs.writeFile(filePath, updated, 'utf8');
    console.log(`OK: ${path.basename(filePath)}`);
  }

  await worker.terminate();
  await browser.close();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
