# AI Avatar PoC (Dify-Centered)

Difyを頭脳として使うAIアバターPoCです。  
応答テキストを `face + text` に正規化し、会話ログ・表情切替・音声再生を行います。

## Screen Capture

![AI Avatar PoC Screen](docs/images/app-capture.png)

## Features

- Mockモード（P1/P1.5）
  - 表情順送り確認（`normal -> joy -> sad -> angry -> surprised`）
- Dify連携（P2）
  - `POST /chat-messages` 呼び出し
  - `answer` を `AvatarResponse` に正規化
  - `conversation_id` 継続
- ステータス・エラー制御（P3）
  - `mock / connected / misconfigured / error`
  - loading中の二重送信防止、再送復帰
- 体験強化（P4）
  - speaking状態表示、faceプレビュー、チャット内face表示
- 音声入力（P5）
  - Web Speech API（Edge/Chromeデスクトップ推奨）
- VOICEVOX連携（P7）
  - backend経由でVOICEVOX EngineへTTS要求
  - 失敗時はBrowser SpeechSynthesisへフォールバック

## Setup

1. Install dependencies

```bash
npm install
```

2. Frontend env

```bash
cp .env.example .env
```

`.env` example:

```env
VITE_USE_MOCK=true
VITE_DIFY_API_URL=https://api.dify.ai/v1
VITE_DIFY_API_KEY=
VITE_DIFY_USER_ID=local-user-001
VITE_TTS_PROVIDER=browser
```

`VITE_TTS_PROVIDER`:
- `browser`: Browser SpeechSynthesis
- `voicevox`: backend `/api/tts/voicevox` 経由

3. Backend env (VOICEVOX)

```bash
cp backend/.env.example backend/.env
```

`backend/.env` example:

```env
VOICEVOX_ENGINE_URL=http://127.0.0.1:50021
VOICEVOX_SPEAKER=1
PORT=8787
```

4. Start backend and frontend

```bash
npm run dev:backend
npm run dev
```

## Render Deploy

初回Renderデプロイでは、VOICEVOX Engineは載せずに Browser TTS を使用します。

1. Renderで `Web Service` を作成し、このリポジトリを接続
2. ルートの `render.yaml` を利用
3. Render Environment Variables を設定
   - `VITE_USE_MOCK=false`
   - `VITE_TTS_PROVIDER=browser`（Render既定）
   - `VITE_DIFY_API_URL`
   - `VITE_DIFY_API_KEY`
   - `VITE_DIFY_USER_ID`
4. デプロイ完了後、Render URLで動作確認

補足:
- Render上のbackendからローカル `127.0.0.1:50021` は参照できないため、VOICEVOXはRender初期対象外です。
- VOICEVOX連携はローカル開発時のみ有効化してください。

### Render公開版の動作確認結果

- Render URL上で `mode: dify` / `status: connected` を確認
- Dify応答の `face + text` 正規化、表情切替、会話継続（`conversation_id`）を確認
- Render公開版では `tts: browser` で読み上げ動作を確認
- VOICEVOXはRender公開版では使用せず、ローカル開発時のみ対象

## VOICEVOX Notes

- frontendはVOICEVOX Engineを直接呼びません。`/api/tts/voicevox` のみ呼びます。
- VOICEVOX Engineが未起動/失敗時は Browser SpeechSynthesis に自動フォールバックします。
- VOICEVOXを利用するには、別途VOICEVOX本体（VOICEVOX Engine含む）を公式サイトからダウンロードして起動する必要があります。
- `http://127.0.0.1:50021/docs` がブラウザで開ければ、VOICEVOX Engine起動確認OKです。
- VOICEVOX利用時は、使用するキャラクターの利用規約・クレジット表記を必ず確認してください。

### 現時点の確認方針（VOICEVOX未インストール環境）

- `VITE_TTS_PROVIDER=voicevox` でも、VOICEVOX接続失敗時に Browser SpeechSynthesis へフォールバックし、アプリが継続利用できることを確認対象とする
- 実機VOICEVOX再生確認は、VOICEVOXインストール後の確認項目として扱う

## Browser Notes

- 推奨ブラウザ: Microsoft Edge / Google Chrome（デスクトップ）
- Firefox / Safari / モバイルブラウザは初期PoCの動作保証対象外
- 音声認識はブラウザ実装依存のため、権限設定や環境ノイズに影響されます

## Dify Response Contract

想定する `answer`:

```json
{"face":"joy","text":"こんにちは！"}
```

またはフォールバック:

```text
[face:joy] こんにちは！
```

対応表情: `normal`, `joy`, `sad`, `angry`, `surprised`

## Real-time Information Limitation

- 現状PoCは、Difyプロンプト中心の応答であり、外部のリアルタイムデータソースを直接参照しません。
- そのため、最新ニュース・天気・市況などは正確に回答できない場合があります。
- 今後の拡張で、外部API連携やRAGを組み合わせることで対応可能です。

## Documents

- `docs/architecture.md`
- `docs/dify-setup.md`
- `docs/demo-script.md`
- `specs/001-dify-poc/p2-preflight-checklist.md`

## Test & Build

```bash
npm run test
npm run build
```

## Notes

- `.env` はGit管理しない
- APIキーはREADME/ソースに直接書かない
- UI層は Dify raw を扱わず、adapter経由で `AvatarResponse` のみ扱う
