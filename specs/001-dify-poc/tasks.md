# Tasks: Dify-Centered AI Avatar PoC

## 実装方針
- 実装順は **P1 -> P2 -> P3** を厳守する
- **P1完了前にP2へ進まない**
- UI層は `AvatarResponse` / `ChatEntry` / `AppStatus` のみ扱う
- Dify rawレスポンスは adapter 層でのみ扱い、UI層に漏らさない

## P1: Mock MVP（先に完成させる）

### T001: プロジェクト土台構築（Vite + React + TypeScript + Tailwind）
- 対象ファイル:
  - `package.json`
  - `vite.config.ts`
  - `tsconfig.json`
  - `tailwind.config.ts`
  - `postcss.config.js`
  - `src/main.tsx`
  - `src/index.css`
- 実装内容:
  - Vite + React + TypeScript + Tailwind の最小起動構成を作る
  - テスト実行基盤（Vitest）を追加する
- 完了条件:
  - `npm run dev` で画面が起動する
  - `npm run test` が実行できる
- 依存タスク: なし
- フェーズ: P1

### T002: 型定義の作成（UI境界の固定）
- 対象ファイル:
  - `src/types/avatar.ts`
  - `src/types/chat.ts`
  - `src/types/status.ts`
- 実装内容:
  - `Face`, `AvatarResponse`, `ChatEntry`, `AppStatus` を定義する
- 完了条件:
  - 画面側コンポーネントは上記型のみで受け渡しできる
- 依存タスク: T001
- フェーズ: P1

### T003: ユーティリティ実装（表情タグ・応答正規化・画像パス）
- 対象ファイル:
  - `src/utils/extractFaceTag.ts`
  - `src/utils/parseAvatarResponse.ts`
  - `src/utils/getAvatarImagePath.ts`
- 実装内容:
  - `[face:xxx]` を解析する
  - JSON形式/タグ形式を `AvatarResponse` に寄せる
  - 未知表情・画像欠損時に `normal` へフォールバックする
- 完了条件:
  - 5表情と異常入力で期待どおりに正規化できる
- 依存タスク: T002
- フェーズ: P1

### T004: Mockサービス実装
- 対象ファイル:
  - `src/services/mockService.ts`
- 実装内容:
  - モック応答を返す `sendMessage` 実装を作る（戻り値は `AvatarResponse`）
- 完了条件:
  - Dify未接続でも会話フローを動かせる
- 依存タスク: T003
- フェーズ: P1

### T005: 音声読み上げサービス実装
- 対象ファイル:
  - `src/services/speechService.ts`
- 実装内容:
  - SpeechSynthesis API を使う `speakText` を作る
  - API不可時は no-op でUI表示を継続する
- 完了条件:
  - 音声不可環境でも画面が壊れない
- 依存タスク: T002
- フェーズ: P1

### T006: UIコンポーネント実装（P1範囲）
- 対象ファイル:
  - `src/components/AvatarDisplay.tsx`
  - `src/components/ChatLog.tsx`
  - `src/components/ChatInput.tsx`
  - `src/components/StatusBadge.tsx`
  - `src/components/LoadingIndicator.tsx`
- 実装内容:
  - 左: AvatarDisplay、右: ChatLog、下部: ChatInput の基本レイアウト
  - 表情状態・簡易ステータス・ローディング表示の受け口を用意
- 完了条件:
  - コンポーネント単体で描画でき、型境界を守れる
- 依存タスク: T002
- フェーズ: P1

### T007: P1結合（Mock MVP完成）
- 対象ファイル:
  - `src/App.tsx`
  - `src/features/chat/useChatController.ts`
  - `public/avatar/normal.png`
  - `public/avatar/joy.png`
  - `public/avatar/sad.png`
  - `public/avatar/angry.png`
  - `public/avatar/surprised.png`
- 実装内容:
  - `mockService` + `parseAvatarResponse` + `AvatarDisplay` + `ChatLog` を結合
  - 送信 -> ログ表示 -> 表情切替 -> （可能なら）読み上げまで通す
- 完了条件:
  - `VITE_USE_MOCK=true` でP1受け入れ条件を満たす
- 依存タスク: T004, T005, T006
- フェーズ: P1

---

## P2: Dify連携（P1完了後に着手）

### T008: Dify設定読み込み
- 対象ファイル:
  - `src/types/config.ts`
  - `src/config/env.ts`
- 実装内容:
  - `.env` から `VITE_DIFY_API_URL`, `VITE_DIFY_API_KEY`, `VITE_DIFY_USER_ID`, `VITE_USE_MOCK` を読む
  - 設定不足時は `misconfigured` 判定を返す
- 完了条件:
  - mock/dify切替条件を一意に判定できる
- 依存タスク: T007
- フェーズ: P2

### T009: Dify Client実装（raw取得のみ）
- 対象ファイル:
  - `src/services/difyClient.ts`
- 実装内容:
  - `sendMessageToDify(message, config): Promise<unknown>` を実装
  - rawレスポンスを返し、UI型への変換はしない
- 完了条件:
  - Difyレスポンスを unknown として取得できる
- 依存タスク: T008
- フェーズ: P2

### T010: Dify Response Adapter実装
- 対象ファイル:
  - `src/adapters/difyResponseAdapter.ts`
- 実装内容:
  - `adaptDifyResponse(raw): AvatarResponse` を実装
  - Dify形式差異を吸収し、`AvatarResponse` に正規化する
- 完了条件:
  - UI側がDify raw構造を参照せずに動作する
- 依存タスク: T009, T003
- フェーズ: P2

### T011: P2結合（Dify連携追加）
- 対象ファイル:
  - `src/features/chat/useChatController.ts`
  - `src/App.tsx`
- 実装内容:
  - `VITE_USE_MOCK` に応じて mock/dify 呼び出しを切替える
  - `false` かつ設定不足時は自動mockせず `misconfigured` 表示にする
- 完了条件:
  - Dify連携時もUIは `AvatarResponse` だけで描画できる
- 依存タスク: T010
- フェーズ: P2

---

## P3: ステータス表示とエラー制御強化

### T012: ステータス・エラーハンドリング強化
- 対象ファイル:
  - `src/features/chat/useChatController.ts`
  - `src/components/StatusBadge.tsx`
  - `src/components/LoadingIndicator.tsx`
- 実装内容:
  - `mock / connected / misconfigured / error` を表示
  - 失敗時も入力再送できるUI状態を維持する
- 完了条件:
  - API失敗・パース失敗時も画面クラッシュしない
- 依存タスク: T011
- フェーズ: P3

### T013: README と .env.example 整備
- 対象ファイル:
  - `README.md`
  - `.env.example`
- 実装内容:
  - 起動手順、環境変数、Dify応答形式、adapter方針、画像配置、モック運用を記載
- 完了条件:
  - 第三者がREADMEと`.env.example`だけで再現できる
- 依存タスク: T012
- フェーズ: P3

### T014: テスト観点の確認（P1/P2/P3）
- 対象ファイル:
  - `src/utils/extractFaceTag.test.ts`
  - `src/utils/parseAvatarResponse.test.ts`
  - `src/utils/getAvatarImagePath.test.ts`
  - `src/adapters/difyResponseAdapter.test.ts`
  - `src/features/chat/useChatController.test.ts`
- 実装内容:
  - 単体・結合の主要シナリオを追加して、フェーズ要件を検証する
- 完了条件:
  - P1/P2/P3の受け入れ観点を自動テストで確認できる
- 依存タスク: T013
- フェーズ: P3

