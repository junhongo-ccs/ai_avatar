# P2前確認メモ（Dify連携）

作成日: 2026-05-18  
対象: `001-dify-poc` / P2実装前の事前確認

## 目的

P2（Dify連携）実装前に、Dify側設定・API仕様・adapter境界を先に確定し、実装時の手戻りを防ぐ。

## チェックリスト

- [x] Difyアプリ種別を確定（Chatflow推奨）
  - 決定結果: Chatflow（advanced-chat）
  - 理由: `POST /chat-messages` と `conversation_id` 継続利用を前提に会話制御しやすいため

- [x] APIキー取得済み
  - 取得日: 2026-05-18
  - 管理方法（漏洩防止方針）: ローカル `.env` 管理。Git未コミット。PoC専用キー利用。

- [x] `POST /chat-messages` の実呼び出し成功
  - 実行日時: 2026-05-18
  - リクエスト条件（`response_mode` など）: `response_mode=blocking`, `inputs={}`, `user=VITE_DIFY_USER_ID`
  - 成否: 成功

- [x] `answer` の実フォーマットを採取（複数サンプル）
  - サンプル1: `{"face":"joy","text":"こんにちは！はい、元気です。あなたはどうですか？"}`
  - サンプル2: `{"face":"sad","text":"お疲れさまです。今日はゆっくり休んで、無理しないでくださいね。"}`
  - サンプル3: `{"face":"surprised","text":"えっ、それはびっくりだね。どんなニュースだったの？"}`
  - 備考: 3件とも `answer` はJSON文字列として返却

- [x] `conversation_id` の継続動作確認
  - 同一 `conversation_id` での連続呼び出し結果: 指定ID `0e95c540-fe0e-447c-9f54-784ad5732839` と返却IDが一致し継続成功
  - 新規会話開始時の結果: 新規呼び出しごとに別 `conversation_id` が発行されることを確認
  - 備考: 継続時応答もJSON文字列維持

- [x] 想定外出力パターン（JSON崩れ/タグなし）を記録
  - 発生パターン: 今回検証ではJSON崩れなし
  - 再現条件: `JSON以外で返して。説明文だけで。` と指示してもJSON返却
  - 影響: 現設定では安定。実装時は保険として不正JSONフォールバック処理を維持する

- [x] adapterの受け入れケースを定義
  - 正常系（JSON）: `answer` をJSON parseし `face`/`text` 抽出
  - フォールバック系（タグ）: parse失敗時のみ `[face:xxx]...` 解析（P1ユーティリティを再利用）
  - 失敗系（未知face/空text/不正JSON）: `face=normal` へフォールバック、`text` はtrim後空なら既定文

- [x] UI層へrawを渡さない境界を再確認
  - 境界ルール: UIは `AvatarResponse` / `ChatEntry` / `AppStatus` のみ扱う。Dify rawはadapter層で吸収。
  - 対象モジュール: `services/difyClient`（raw取得）→ `adapters/difyResponseAdapter`（正規化）→ `features/chat`（UI型へ連結）
  - レビュー観点: `App.tsx` と UIコンポーネントで Difyレスポンス型（unknown/raw）を参照していないこと

## 判定基準（P2着手可否）

- すべてのチェックが完了し、少なくとも以下が明文化されていること
  - Dify実レスポンスの代表例
  - `AvatarResponse` への変換ルール
  - UI層にrawを漏らさない実装境界

未完了項目がある場合は、P2実装に進まず本メモを先に更新する。

## 判定結果

- 判定: P2着手可能
- 根拠: API接続、`answer` 形式、`conversation_id` 継続、想定外入力時のJSON維持、adapter境界方針を確認済み
