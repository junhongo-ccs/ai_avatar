# AI Avatar PoC Constitution

## Core Principles

### I. Specification-First Development
すべての開発は仕様駆動で進める。実装前に、目的、対象範囲、非対象範囲、成功条件を明文化する。仕様が曖昧な状態では実装を開始しない。

### II. No Assumption-Driven Features
推測で機能を追加しない。要件にない機能追加や拡張は、仕様の更新と合意を経てから行う。

### III. PoC Prioritization: Minimum Working System
初期 PoC では「最小構成で動くこと」を最優先とする。完成度よりも、検証可能なエンドツーエンド動作を重視する。

### IV. Dify-Centered Intelligence Architecture
Dify を AI の頭脳として扱う。キャラクター設定、応答方針、表情タグ出力ルールは Dify 側に集約し、フロントエンド側へロジックを分散させない。

### V. Frontend Responsibility Separation
フロントエンドは UI 表示、Dify API 呼び出し、表情制御、音声再生に専念する。将来拡張に備え、音声認識、外部 TTS、Live2D、Realtime API は分離可能な構成で設計する。

## Scope and Technical Constraints

- 本 PoC の会話入力対象はテキスト入力を第一対象とする。
- 音声認識と Live2D は後続フェーズで検討する。
- 機密情報（API キー等）は `.env` で管理し、Git 管理対象に含めない。
- 作業環境は Windows または Mac を前提とする。

## Documentation and Workflow Requirements

- README に最低限以下を記載する。
- 起動手順
- 必要な環境変数
- Dify 側の設定方針（キャラクター設定、応答方針、表情タグ方針）
- 実装は拡張容易性を担保するため、入力、応答生成、表情制御、音声処理を責務分離して構成する。

## Governance

- 本 Constitution は本プロジェクトの開発判断における最上位規約とし、他文書と矛盾する場合は本 Constitution を優先する。
- 仕様・実装・レビューでは本 Constitution への適合確認を必須とする。
- 変更は変更理由、影響範囲、移行方針を明記したうえで合意し、文書を更新する。

**Version**: 1.0.0 | **Ratified**: 2026-05-18 | **Last Amended**: 2026-05-18
