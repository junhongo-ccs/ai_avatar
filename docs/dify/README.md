# Dify 関連資料

Difyアプリ `ai-avatar-poc` を作る・移す・更新するための資料をまとめたフォルダです。

| ファイル | 内容 |
|---|---|
| [migration.md](migration.md) | 個人の無料版から会社のアカウントへの引っ越し手順。**まずこれを読む** |
| [setup.md](setup.md) | アプリの最小構成と、フロントの `.env` 設定 |
| [ai-avatar-poc.yml](ai-avatar-poc.yml) | 旧環境からエクスポートしたDSL（2026-10-13取得）。新環境にはこれをインポートする |
| [prompt.md](prompt.md) | LLMノードのプロンプトの控え（DSLから抜き出したもの） |
| [rag/README.md](rag/README.md) | ナレッジに登録するファイルと、チャンク・検索の推奨設定 |
| [rag/recruit_ccs_refined/](rag/recruit_ccs_refined/) | 採用ナレッジのファイル |
| [rag/ccs_solutions/](rag/ccs_solutions/) | ソリューション資料ナレッジのファイル |
| `rag/archive/` | Difyに登録していない元データや旧版 |

## DSL（yml）を更新するとき

Difyでプロンプトやフローを変えたら、DSLをエクスポートし直して `ai-avatar-poc.yml` を上書きし、`prompt.md` も合わせて更新します。
秘密の環境変数を含めてエクスポートした場合は、リポジトリに入れないでください。
