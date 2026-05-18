# Feature Specification: Dify-Centered AI Avatar PoC

**Feature Branch**: `001-dify-poc`  
**Created**: 2026-05-18  
**Status**: Draft  
**Input**: User description: "Difyを活用したAIアバターPoCを作りたい"

## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - モックで会話と表情切替を検証する (Priority: P1)

ユーザーとして、Web画面でテキスト送信した結果が会話ログに表示され、表情タグに応じてアバター画像が切り替わり、回答が読み上げられることを確認したい。

**Why this priority**: Dify未接続でもPoCの中核パイプラインを先に成立させ、最小構成で価値を検証できるため。

**Independent Test**: `VITE_USE_MOCK=true` で起動し、送信操作のみでログ表示・表情変更・音声読み上げが成立することを確認できる。

**Acceptance Scenarios**:

1. **Given** モックモードでアプリが起動している, **When** ユーザーがテキストを送信する, **Then** ユーザーメッセージとAI応答が会話ログに追加される
2. **Given** モック応答に `[face:joy]` または `{"face":"joy","text":"..."}` が含まれる, **When** 応答を処理する, **Then** アバター画像が `joy.png` に切り替わる
3. **Given** モック応答が表示された, **When** 音声読み上げが有効, **Then** 応答テキストが SpeechSynthesis API で読み上げられる

---

### User Story 2 - Dify連携で実応答を表示する (Priority: P2)

ユーザーとして、Dify設定済み環境で送信したテキストに対し、Difyが返した応答本文と表情情報を画面で確認したい。

**Why this priority**: PoCの主目的である「Difyを頭脳として使う」検証を達成するため。

**Independent Test**: `.env` にDify接続情報を設定し、送信でDify応答が表示されること、表情抽出が機能することを確認できる。

**Acceptance Scenarios**:

1. **Given** `VITE_USE_MOCK=false` かつDify接続情報が設定済み, **When** ユーザーがテキストを送信する, **Then** フロントエンドがDify APIへリクエストを送信する
2. **Given** DifyがJSON形式またはタグ付きテキストで応答する, **When** 応答を解析する, **Then** `face` と `text` を分離してUI反映できる

---

### User Story 3 - 接続状態とエラーを可視化する (Priority: P3)

ユーザーとして、Dify接続状態や処理中状態、エラー内容をUIで把握し、失敗時も画面が壊れずに再試行したい。

**Why this priority**: PoC検証でAPI遅延・失敗時挙動の把握が必要であり、運用上の基本的な観測性を確保するため。

**Independent Test**: API失敗やタイムアウトを擬似的に発生させ、ステータス表示・ローディング表示・エラーメッセージ表示を確認できる。

**Acceptance Scenarios**:

1. **Given** Dify呼び出し処理中, **When** レスポンス待機中, **Then** ローディング表示が出る
2. **Given** Dify APIエラーが発生, **When** エラーハンドリング処理が走る, **Then** UIは継続表示され、ユーザー向けエラーメッセージが表示される

---

### Edge Cases
- Difyが `face` を返さない場合は `normal` を適用する
- 未知の表情値が来た場合は `normal` にフォールバックする
- 表情画像ファイルが存在しない場合は `public/avatar/normal.png` を使用する
- タグ付き形式でタグが不正な場合は本文を優先し、表情は `normal` にする
- 空文字送信は無効化し、送信を行わない
- SpeechSynthesis API が利用不可または拒否された場合でもテキスト表示は継続する
- Dify未接続または設定不足時はモックモードへ切り替えるか、明示エラーを表示する
- 連続送信時に前回応答待ちがある場合は送信制御（無効化またはキュー）を行う

## Requirements *(mandatory)*

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: システムはWebブラウザで動作するAIアバター画面を提供し、左にアバター、右に会話ログ、下部に入力欄と送信ボタンを表示しなければならない
- **FR-002**: システムはテキスト入力メッセージを送信し、ユーザー発話を会話ログに表示しなければならない
- **FR-003**: システムは `VITE_USE_MOCK` によりモック応答モードとDify APIモードを切り替えられなければならない
- **FR-004**: システムはDify API呼び出し処理を `sendMessageToDify` として専用モジュールに分離しなければならない
- **FR-005**: システムはDify応答のJSON形式（`face` + `text`）とタグ付きテキスト形式（`[face:xxx]...`）を解析しなければならない
- **FR-006**: システムは応答解析処理を `parseAvatarResponse` と `extractFaceTag` として分離しなければならない
- **FR-007**: システムは対応表情（`normal`/`joy`/`sad`/`angry`/`surprised`）に応じて `public/avatar/*.png` を切り替え表示しなければならない
- **FR-008**: システムは画像未存在または不正表情時に `normal.png` へフォールバックしなければならない
- **FR-009**: システムは応答テキストを会話ログに表示し、`speakText` 経由でSpeechSynthesis APIにより読み上げなければならない
- **FR-010**: システムは将来の外部TTS置換を想定し、音声読み上げ処理をUIから分離しなければならない
- **FR-011**: システムはDify API接続状態、現在の表情状態、ローディング状態をUIで表示しなければならない
- **FR-012**: システムはAPI失敗時にユーザー向けエラーメッセージを表示し、UIを継続利用可能に保たなければならない
- **FR-013**: システムは `.env` で `VITE_DIFY_API_URL`、`VITE_DIFY_API_KEY`、`VITE_DIFY_USER_ID`、`VITE_USE_MOCK` を読み込まなければならない
- **FR-014**: システムはREADMEに起動手順、`.env.example`、Dify応答形式、画像配置ルール、モックモード手順、拡張候補を記載しなければならない
- **FR-015**: システムは音声認識、外部TTS、Live2D、Realtime API、認証、課金、管理画面、履歴永続化を初期PoCの対象外とし、実装しない
- **FR-016**: システムはDify APIの実レスポンス構造に依存しすぎないよう、Difyレスポンスを `AvatarResponse` へ変換するadapter層を持たなければならない
  - 初期実装時にDify APIの実レスポンス形式を確認し、adapter層で `AvatarResponse` 形式へ正規化する

### Key Entities *(include if feature involves data)*

- **UserMessage**: ユーザー入力テキスト。属性: `id`, `role=user`, `text`, `timestamp`
- **AvatarResponse**: 表情と発話本文を持つAI応答。属性: `face`, `text`, `raw`, `source(mock|dify)`
- **ChatEntry**: 会話ログの1行。属性: `id`, `role(user|assistant|system)`, `text`, `face?`, `timestamp`
- **AppStatus**: 画面状態。属性: `difyConnectionStatus`, `isLoading`, `errorMessage?`, `currentFace`
- **DifyConfig**: 実行時設定。属性: `apiUrl`, `apiKey`, `userId`, `useMock`

## Success Criteria *(mandatory)*

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: ローカル環境でセットアップ手順に従い、初回起動が10分以内に完了する
- **SC-002**: モックモードで5種類の表情タグを入力したとき、全て正しい画像切替または `normal` フォールバックで表示される
- **SC-003**: Dify接続時にユーザー送信から応答表示までの一連フロー（送信→応答表示→表情切替→読み上げ）が成功する
- **SC-004**: APIエラー発生時に画面クラッシュせず、ユーザーが再送信操作を継続できる
- **SC-005**: READMEと`.env.example`のみで、第三者がDify接続・モック切替の両方を再現できる

## Assumptions

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right assumptions based on reasonable defaults
  chosen when the feature description did not specify certain details.
-->

- 利用者はWindowsまたはMac上でNode.js開発環境を利用できる
- Dify側でキャラクター設定と応答方針、表情タグ方針が事前設定されている
- Dify APIの認証情報はローカル `.env` でのみ管理し、Gitに含めない
- 初期PoCでは会話履歴を永続化せず、メモリ上の一時表示のみを行う
- UIはデスクトップブラウザを第一対象とし、厳密なモバイル最適化は必須要件外とする
