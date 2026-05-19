import fs from 'node:fs/promises';
import path from 'node:path';
import { createWorker } from 'tesseract.js';

const targetDir = path.resolve('docs/rag/recruit_ccs');
const maxPerFile = 8;

function getFrontmatterSource(md) {
  const m = md.match(/source_url:\s*(.+)/);
  return m ? m[1].trim() : null;
}

function extractImageBlocks(md) {
  const lines = md.split(/\r?\n/);
  const blocks = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\- src:\s*(.+)$/);
    if (!m) continue;
    const src = m[1].trim();
    let hintLine = -1;
    for (let j = i + 1; j <= i + 3 && j < lines.length; j++) {
      if (/^\s*hint:\s*/.test(lines[j])) {
        hintLine = j;
        break;
      }
    }
    if (hintLine !== -1) blocks.push({ src, hintLine });
  }
  return { lines, blocks };
}

function resolveUrl(base, src) {
  try {
    return new URL(src, base).toString();
  } catch {
    return null;
  }
}

function cleanOcrText(text) {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[|¦]/g, 'I')
    .trim()
    .slice(0, 120);
}

async function recognizeWithFallback(worker, imgUrl) {
  let out = '';
  try {
    const r = await worker.recognize(imgUrl, {}, { text: true });
    out = cleanOcrText(r?.data?.text || '');
  } catch {
    out = '';
  }
  return out;
}

async function run() {
  const files = (await fs.readdir(targetDir))
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => path.join(targetDir, f));

  const worker = await createWorker('eng+jpn', 1, {
    langPath: path.resolve('scripts/tessdata'),
    gzip: true,
    cacheMethod: 'none'
  });

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const sourceUrl = getFrontmatterSource(raw);
    if (!sourceUrl) continue;

    const { lines, blocks } = extractImageBlocks(raw);
    let changed = 0;

    for (const b of blocks) {
      if (changed >= maxPerFile) break;
      const hintText = lines[b.hintLine].replace(/^\s*hint:\s*/, '').trim();
      if (hintText.includes('OCR=')) continue;

      const imgUrl = resolveUrl(sourceUrl, b.src);
      if (!imgUrl) continue;

      let ocr = '';
      try {
        const res = await fetch(imgUrl, { headers: { 'user-agent': 'Mozilla/5.0 OCR Bot' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const arr = await res.arrayBuffer();
        ocr = await recognizeWithFallback(worker, Buffer.from(arr));
      } catch {
        ocr = '';
      }
      if (!ocr) continue;
      if (!hintText || hintText === '画像内テキストは未取得（OCR未実行）' || hintText === 'no_text_hint_ocr_not_run') {
        lines[b.hintLine] = '  hint: OCR=' + ocr;
      } else {
        lines[b.hintLine] = `  hint: ${hintText} / OCR=${ocr}`;
      }
      changed++;
    }

    if (changed > 0) {
      await fs.writeFile(filePath, lines.join('\n'), 'utf8');
      console.log(`OK: ${path.basename(filePath)} ocr_added=${changed}`);
    } else {
      console.log(`SKIP: ${path.basename(filePath)}`);
    }
  }

  await worker.terminate();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
