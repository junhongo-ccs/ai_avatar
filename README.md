# AI Avatar PoC For Recruitment Events

2028年度入社候補の学生向け採用イベントでの活用を想定した、Dify連携AIアバターPoCです。

このPoCは、学生がその場で気になったことを自然に質問でき、NTTデータCCSの採用情報を根拠ベースでわかりやすく返せるかを検証するためのものです。単にテキストで回答するだけでなく、表情切替、会話ログ表示、読み上げまで含めて、イベントでの対話体験として成立することを目指しています。

## このPoCで実現したいこと

- 採用イベントで、学生が会社情報や働き方、選考に関する疑問をその場で聞ける
- 採用ナレッジに基づく範囲で、根拠のある回答を返せる
- 回答をテキストだけでなく、表情と読み上げでも伝えられる
- 会話を続けながら、学生が知りたい情報に近づける

## 想定する利用シーン

- 会社説明会や採用イベントの展示・体験ブース
- 2028年度入社候補の学生に向けた案内補助
- 採用担当者の説明前後に、学生が気軽に質問できる入口

## 提供する体験

- 学生はチャット形式で自然文のまま質問できます
- 回答は画面上の会話ログに表示されます
- 回答内容に応じてアバターの表情が切り替わります
- 回答文はブラウザTTSで読み上げられます
- 会話を継続しながら、前の文脈を踏まえたやり取りができます
- 採用ナレッジにない質問でも、会話を止めずに答えられる質問の方向へ案内できます

初期案内文では、勤務地、在宅勤務、残業時間、新人研修、福利厚生など、学生が聞きやすい質問の入口も示しています。

## 何をどう実現しているか

### 1. 採用ナレッジに基づく回答

回答の中核はDifyです。Dify側で採用ナレッジと回答ルールを持ち、フロントエンドはその応答を受け取って体験に変換します。

- 採用ナレッジは `docs/rag/recruit_ccs_refined` に整理
- 会社概要、募集条件、選考導線、待遇、働き方、研修、福利厚生、採用実績などを対象化
- 回答ルールでは、ナレッジに明記された事実を優先し、未記載事項は推測しない方針
- 採用・新卒に関する質問は採用ナレッジを優先し、技術・ソリューション系は別ナレッジを優先する運用

関連資料:

- `docs/rag/recruit_ccs_refined/01_overview.md`
- `docs/rag/recruit_ccs_refined/03_current_spec.md`
- `docs/rag/recruit_ccs_refined/04_decision_rules.md`
- `docs/rag/recruit_ccs_refined/05_faq.md`

この構成により、採用イベントで重要な `正確さ` と `答え方の一貫性` を担保しやすくしています。

### 1.5. 答えられない質問でも会話を止めない

現行プロンプトでは、ナレッジに明記されていない内容を推測して埋めるのではなく、対象外であることを伝えたうえで、`答えられる質問例を3件だけ返す` ルールを入れています。

- 未記載事項は断定しない
- ただ「分かりません」で終わらせない
- あらかじめ定義した質問例候補から案内する
- 毎回まったく同じ誘導になりにくいよう、組み合わせを固定しすぎない

これにより、学生が最初に少しずれた質問をしても、会話を切らずに `会社のこと` `働き方` `選考` など、答えられる話題へ自然に寄せられます。

採用イベントでは、最初から適切な聞き方ができる学生ばかりではありません。このPoCでは、`答えを返す` だけでなく、`質問の方向づけを支援する` ところまで体験設計に含めています。

### 2. Dify応答をUI向け形式へ正規化

Difyの生レスポンスをそのまま画面で扱わず、いったん `AvatarResponse` に正規化しています。

- Dify API: `POST /chat-messages`
- 応答の想定形式:

```json
{"face":"joy","text":"こんにちは！"}
```

- フォールバック形式:

```text
[face:joy] こんにちは！
```

- 対応表情: `normal`, `joy`, `sad`, `angry`, `surprised`

主な実装:

- `src/services/difyClient.ts`: Difyとの通信
- `src/adapters/difyResponseAdapter.ts`: rawレスポンスを `AvatarResponse` へ変換
- `src/utils/parseAvatarResponse.ts`: JSONまたはタグ付きテキストを解析
- `src/utils/extractFaceTag.ts`: `[face:xxx]` を抽出

このレイヤ分離により、Dify側のレスポンス差異をUIへ漏らさず、画面側は一貫した型だけを扱えます。

### 3. 会話継続と状態制御

イベントで触ってもらう以上、1問ごとに不安定な挙動になるのを避けるため、会話状態とUI状態を分けて管理しています。

- `conversation_id` を保持し、複数ターンの会話を継続
- loading中の二重送信を防止
- `connected / misconfigured / error` を画面表示
- API失敗時も画面を壊さず、再送できる状態へ復帰
- 不正な表情値やタグなし応答は `normal` にフォールバック

主な実装:

- `src/features/chat/useChatController.ts`
- `src/types/status.ts`

### 4. 見た目と音声で伝える体験

このPoCは、採用FAQを返すだけではなく、イベントで足を止めてもらえる体験も重視しています。

- 左側にアバター、右側に会話ログ、下部に入力欄を配置
- 回答ごとにアバター表情を切り替え
- `speaking` 状態を表示
- ブラウザのSpeechSynthesisで回答を読み上げ
- 音声利用不可でもテキスト表示は継続

主な実装:

- `src/components/AvatarDisplay.tsx`
- `src/components/ChatLog.tsx`
- `src/components/ChatInput.tsx`
- `src/services/speechService.ts`

表情の使い分けも、単なる演出ではなく案内体験の一部です。

- `joy`: あいさつ、前向きな案内、励まし
- `normal`: 通常の説明、落ち着いた返答
- `sad`: 不安や困りごとへの共感、うまく案内できないとき
- `angry`: 不満や理不尽さへの共感
- `surprised`: 意外な聞かれ方や、少し軽く案内したいとき

これにより、学生にとって `無機質なFAQ` ではなく、`反応してくれる案内役` として受け取られやすくなっています。

## このPoCの特長

### 採用情報に寄せたナレッジ設計

RAG用資料を、学生が知りやすい論点に寄せて整理しています。

- 会社概要
- 募集条件
- 選考フロー
- 勤務地、勤務時間、在宅勤務
- 残業、有休、育休、定着率
- 研修、メンター、資格支援、福利厚生

### 答えられる範囲を明確にしやすい

採用情報は年度差分や条件差分が大きいため、何でも断定するより、ナレッジにある情報へ寄せて答える設計にしています。

- 根拠のある範囲は明確に答える
- 未記載事項は推測しない
- 年度付きの数値は年度を添えて答える前提

### 学生が質問を始めやすい

初期メッセージで質問例を見せることで、学生が何を聞いてよいか迷いにくくしています。

現状の初期案内例:

- 勤務地について
- 在宅勤務について
- 残業時間について
- 新人研修について
- 福利厚生について

### 会話をファネルのように正しい方向へ寄せられる

このPoCは、最初からユーザーが正しい聞き方をする前提にはしていません。

- 曖昧な質問には、分かる範囲を整理して返す
- 対象外の質問には、答えられる質問例を返す
- 深掘り質問には、条件や数値を補いながら具体化する

この設計により、やり取りを重ねながら `答えられる問い` や `意思決定に必要な情報` へ近づけていけます。採用イベントでの短時間の対話と相性がよい点が、このPoCの大きな特長です。

## 現在の制約

- 外部のリアルタイムデータは参照しません
- 最新ニュース、天気、市況のような情報には向いていません
- 回答品質はDify側のナレッジ登録とプロンプト設計に依存します
- Firefox / Safari / モバイルブラウザは初期PoCの動作保証対象外です

採用イベント用途としては、`リアルタイム性` よりも `採用情報を安心して聞けること` を優先した構成です。

## セットアップ

1. 依存関係をインストール

```bash
npm install
```

2. `.env` を作成

```bash
cp .env.example .env
```

例:

```env
VITE_DIFY_API_URL=https://api.dify.ai/v1
VITE_DIFY_API_KEY=
VITE_DIFY_USER_ID=local-user-001
VITE_TTS_PROVIDER=browser
```

`VITE_TTS_PROVIDER`:

- `browser`: Browser SpeechSynthesis

3. 開発サーバ起動

```bash
npm run dev
```

## Render公開

Render公開版では Browser TTS を使用します。

公開URL:

- https://ai-avatar-foas.onrender.com/

手順:

1. Renderで `Web Service` を作成し、このリポジトリを接続
2. ルートの `render.yaml` を利用
3. Render Environment Variables を設定
4. デプロイ後に動作確認

設定項目:

- `VITE_TTS_PROVIDER=browser`
- `VITE_DIFY_API_URL`
- `VITE_DIFY_API_KEY`
- `VITE_DIFY_USER_ID`
- 必要なら `BASIC_AUTH_USER`
- 必要なら `BASIC_AUTH_PASSWORD`

### Basic認証

- `BASIC_AUTH_USER` と `BASIC_AUTH_PASSWORD` の両方を設定すると、サイト全体と `/api` にBasic認証をかけます
- 少人数向けの検証やイベント前確認時の簡易保護に向いています
- 認証をかけると、TeamsなどでOGPプレビューが出にくくなることがあります

## Dify設定

最小構成は `docs/dify-setup.md` を参照してください。

要点:

- App type は `Chatflow`
- `answer` は JSONのみを返すよう指示
- `conversation_id` が返ることを確認
- 採用ナレッジと回答ルールをDify側へ登録

## テストとビルド

```bash
npm run test
npm run build
```

## 関連ドキュメント

- `docs/architecture.md`
- `docs/dify-setup.md`
- `docs/demo-script.md`
- `specs/001-dify-poc/spec.md`
- `specs/001-dify-poc/tasks.md`

## 補足

- `.env` はGit管理しません
- APIキーはREADMEやソースへ直接書きません
- UI層はDify rawを直接扱わず、adapter経由で正規化済みデータのみ扱います
