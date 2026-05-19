import fs from 'node:fs/promises';
import path from 'node:path';

const targetDir = path.resolve('docs/rag/recruit_ccs');
const minLen = 280;
const maxLen = 480;
const maxChunks = 24;

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function splitJapaneseChunks(text) {
  const sentences = text
    .split(/(?<=[。！？!?])\s+|\s+(?=[\-•●])/)
    .map((s) => normalize(s))
    .filter(Boolean);

  const chunks = [];
  let cur = '';

  for (const s of sentences) {
    if (!cur) {
      cur = s;
      continue;
    }

    if ((cur + ' ' + s).length <= maxLen) {
      cur += ' ' + s;
      continue;
    }

    if (cur.length < minLen && s.length < maxLen) {
      cur += ' ' + s;
      continue;
    }

    chunks.push(cur);
    cur = s;
    if (chunks.length >= maxChunks) break;
  }

  if (cur && chunks.length < maxChunks) chunks.push(cur);

  if (chunks.length === 0 && text.length > 0) {
    for (let i = 0; i < text.length && chunks.length < maxChunks; i += maxLen) {
      chunks.push(text.slice(i, i + maxLen).trim());
    }
  }

  return chunks.filter((c) => c.length >= 80);
}

function upsertSection(md, title, body) {
  const re = new RegExp(`\\n## ${title}[\\s\\S]*?(?=\\n## |$)`, 'm');
  const next = `\n## ${title}\n\n${body}\n`;
  if (re.test(md)) return md.replace(re, `\n${next}`);
  return `${md.trimEnd()}\n${next}`;
}

function extractOcrBody(md) {
  const m = md.match(/## ページ全体OCR（Playwright）\n\n[\s\S]*?\n\n([\s\S]*?)(?=\n## |$)/m);
  return m ? normalize(m[1]) : '';
}

async function run() {
  const files = (await fs.readdir(targetDir))
    .filter((f) => f.endsWith('.md') && f !== 'README.md')
    .map((f) => path.join(targetDir, f));

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, 'utf8');
    const ocr = extractOcrBody(raw);

    if (!ocr || ocr.startsWith('OCR失敗')) {
      const updated = upsertSection(raw, 'OCRチャンク（RAG向け）', '（OCRテキストなし）');
      await fs.writeFile(filePath, updated, 'utf8');
      console.log(`SKIP: ${path.basename(filePath)} (no ocr)`);
      continue;
    }

    const chunks = splitJapaneseChunks(ocr);
    const lines = chunks.map((c, i) => `### OCRチャンク ${i + 1}\n\n${c}`);
    const body = `- chunk_size_target: ${minLen}-${maxLen} 文字\n- chunk_count: ${chunks.length}\n\n${lines.join('\n\n')}`;

    const updated = upsertSection(raw, 'OCRチャンク（RAG向け）', body);
    await fs.writeFile(filePath, updated, 'utf8');
    console.log(`OK: ${path.basename(filePath)} chunks=${chunks.length}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
