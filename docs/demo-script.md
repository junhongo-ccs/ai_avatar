# Demo Script (社内デモ台本)

## 0. 目的（30秒）

- このPoCは、Difyを対話エンジンとして使い、AIアバターとして会話体験を提供するデモです。
- 応答は `face + text` へ正規化し、表情切替・会話ログ表示・読み上げまで一貫して行います。

## 1. 構成説明（1分）

- フロントエンド: React + Vite
- 対話: Dify `/chat-messages`
- TTS（Render公開版）: Browser SpeechSynthesis
- TTS（ローカル開発のみ）: VOICEVOX（backend経由）

補足:
- Render公開版では VOICEVOX は利用しません（Engineを同梱しないため）。

## 2. 画面の見方（1分）

- `mode: dify` / `status: connected` でDify接続中
- `face` は現在表情
- `speaking` は読み上げ状態
- `tts: browser` はRender公開版のTTS経路

## 3. デモ実演（3分）

1. あいさつ入力
- 例: 「こんにちは」
- 期待: `joy` など前向き表情 + 自然な返答

2. 共感系入力
- 例: 「今日は少し疲れています」
- 期待: `sad` 系表情 + 寄り添い返答

3. 状況整理入力
- 例: 「それはちょっと理不尽ですね」
- 期待: `angry` でも攻撃的でない整理誘導

4. 驚き入力
- 例: 「びっくりするニュースを聞きました」
- 期待: `surprised` 表情

5. 読み上げ確認
- 返答表示後に speaking がON/OFFすることを確認

## 4. 制約説明（1分）

- リアルタイム情報（天気、株価、最新ニュース等）は、現在のPoC単体では参照できません。
- 理由: Difyプロンプトのみでは外部データソースにアクセスしないため。
- 拡張案:
  - API連携（Weather/業務API）
  - RAG連携（社内文書検索）

## 5. まとめ（30秒）

- Render公開版として、Dify会話・表情制御・Browser TTSまで安定動作を確認済み。
- 次段階で、API/RAG連携により情報鮮度と業務適用範囲を拡張可能。
