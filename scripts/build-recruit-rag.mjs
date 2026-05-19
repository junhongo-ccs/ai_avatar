import fs from 'node:fs/promises';
import path from 'node:path';
import { JSDOM } from 'jsdom';

const targets = [
  { id: '01_recruit_top', category: '採用トップ', title: 'NTTデータCCS 採用トップ', url: 'https://www.nttdata-ccs.co.jp/recruit/index.html' },
  { id: '02_recruit_interview', category: '社員インタビュー', title: 'NTTデータCCS 社員インタビュー', url: 'https://www.nttdata-ccs.co.jp/recruit/#interview' },
  { id: '03_recruit_career_plan', category: 'キャリアプラン', title: 'NTTデータCCS キャリアプラン', url: 'https://www.nttdata-ccs.co.jp/recruit/career_plan/' },
  { id: '04_recruit_in_house_system', category: '社内制度', title: 'NTTデータCCS 社内制度', url: 'https://www.nttdata-ccs.co.jp/recruit/in-house_system/' },
  { id: '05_recruit_corporate_culture', category: '企業文化', title: 'NTTデータCCS 企業文化', url: 'https://www.nttdata-ccs.co.jp/recruit/corporate_culture/' },
  { id: '06_recruit_news', category: '採用ニュース', title: 'NTTデータCCS 採用ニュース', url: 'https://www.nttdata-ccs.co.jp/recruit/news/' },
  { id: '07_mynavi_outline', category: '募集要項（マイナビ）', title: 'マイナビ 企業概要', url: 'https://job.mynavi.jp/27/pc/search/corp73343/outline.html' },
  { id: '08_mynavi_employment', category: '募集要項（雇用条件）', title: 'マイナビ 雇用条件', url: 'https://job.mynavi.jp/27/pc/corpinfo/displayEmployment/index?corpId=73343&recruitingCourseId=27024568' }
];

const outputDir = path.resolve('docs/rag/recruit_ccs');

const normalizeText = (input) => input
  .replace(/\u00A0/g, ' ')
  .replace(/[\t\r]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .replace(/[ ]{2,}/g, ' ')
  .replace(/\n +/g, '\n')
  .trim();

function extractBodyText(html) {
  const dom = new JSDOM(html);
  const { document } = dom.window;
  ['script','style','noscript','svg','header','footer','nav','form','.breadcrumb','.pankuzu','.gnav','.snav','#gnav','#snav'].forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => node.remove());
  });

  const root = document.querySelector('main') || document.querySelector('article') || document.body;
  return root ? normalizeText(root.textContent || '') : '';
}

function makeKeywords(text) {
  const uniq = [];
  const seen = new Set();
  for (const token of text.split(/[\s、。・,\n]+/).map((s) => s.trim())) {
    if (token.length < 2 || token.length > 30 || seen.has(token)) continue;
    seen.add(token);
    uniq.push(token);
    if (uniq.length >= 80) break;
  }
  return uniq.join(', ');
}

function toMarkdown(item, titleInPage, text) {
  const excerpt = text.slice(0, 700);
  return `---\nsource_url: ${item.url}\ncategory: ${item.category}\nretrieved_at: ${new Date().toISOString()}\n---\n\n# ${titleInPage}\n\n## 概要\n\n${excerpt}${text.length > excerpt.length ? '...' : ''}\n\n## 想定質問\n\n- ${item.category}について教えてください。\n- ${titleInPage}の要点を教えてください。\n- ${item.title}に掲載されている内容を要約してください。\n\n## 回答方針\n\n質問が${item.category}に関する場合は、以下の本文を根拠に回答する。制度名・条件・数字がある場合は優先して引用し、断定できない点はその旨を明示する。\n\n## 本文（抽出テキスト）\n\n${text}\n\n## 横断キーワード\n\n${makeKeywords(text)}\n`;
}

async function fetchHtml(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; RAG-MD-Builder/1.0)' } });
  if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
  return response.text();
}

async function run() {
  await fs.mkdir(outputDir, { recursive: true });
  const index = [];

  for (const item of targets) {
    try {
      const html = await fetchHtml(item.url);
      const dom = new JSDOM(html);
      const titleInPage = normalizeText(dom.window.document.title || item.title);
      const text = extractBodyText(html);
      if (!text) throw new Error('本文抽出に失敗しました');

      const fileName = `${item.id}.md`;
      await fs.writeFile(path.join(outputDir, fileName), toMarkdown(item, titleInPage, text), 'utf8');
      index.push(`- [${item.category}](${fileName}) - ${item.url}`);
      console.log(`OK: ${fileName}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      index.push(`- [ERROR] ${item.category} - ${item.url} - ${message}`);
      console.error(`NG: ${item.url} -> ${message}`);
    }
  }

  const readme = `# recruit_ccs RAG Markdown Index\n\n指定URLをクロールし、Dify RAG向けにカテゴリ別Markdownへ整形したファイル群です。\n\n## 推奨アップロード\n\n- Dify Knowledgeへは \`01_*.md\` 〜 \`08_*.md\` をそのままアップロード\n- 先にこのREADMEを読み込ませるとカテゴリ絞り込み精度が上がります\n\n## ファイル一覧\n\n${index.join('\n')}\n`;

  await fs.writeFile(path.join(outputDir, 'README.md'), readme, 'utf8');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
