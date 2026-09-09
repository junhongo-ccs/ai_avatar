# recruit_ccs_refined RAG Markdown Index

このフォルダは、`docs/rag/recruit_ccs` の既存MDを元に、RAG向けに再構成した版です。  
「採用情報TOP」「社員インタビュー」「キャリアプラン」など、明らかにページナビゲーション由来で重複する文言は除外し、チャンク単位で意味が完結する構成にしています。  
特に新卒応募者が知りたい質問スコープ（応募可否、選考準備、待遇、働き方、成長環境、福利厚生）を厚めにカバーしています。

## 推奨アップロード

- Dify Knowledgeへは以下の6ファイルをアップロードしてください。
- 特に住所、株主構成、学校実績、待遇詳細の厳密回答が必要な場合は `06_mynavi_master_fulltext.md` を必ず含めてください。
- Parent-child Modeまたは同等のチャンク設定を使用し、H2/H3単位で分割されるようにしてください。

## ファイル一覧

- [01_overview.md](01_overview.md): 全体像、目的、対象範囲、企業概要
- [02_mynavi_company_overview.md](02_mynavi_company_overview.md): 会社概要（必須基本情報）
- [03_current_spec.md](03_current_spec.md): 現在仕様（選考、待遇、勤務、研修、福利厚生）
- [04_decision_rules.md](04_decision_rules.md): 回答方針、判断ルール、回答禁止事項
- [05_faq.md](05_faq.md): 自然文質問向けFAQ
- [06_mynavi_master_fulltext.md](06_mynavi_master_fulltext.md): 提供テキスト原文（省略なし）

## 元データ

- `docs/rag/recruit_ccs/01_recruit_top.md`
- `docs/rag/recruit_ccs/02_recruit_interview.md`
- `docs/rag/recruit_ccs/03_recruit_career_plan.md`
- `docs/rag/recruit_ccs/04_recruit_in_house_system.md`
- `docs/rag/recruit_ccs/05_recruit_corporate_culture.md`
- `docs/rag/recruit_ccs/06_recruit_news.md`
- `docs/rag/recruit_ccs/07_mynavi_outline.md`
- `docs/rag/recruit_ccs/08_mynavi_employment.md`

