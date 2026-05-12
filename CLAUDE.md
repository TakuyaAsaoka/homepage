# プロジェクトルール

## コーディング規約

[`docs/coding-standards.md`](docs/coding-standards.md) を参照。

## ローカライゼーション

- **コードコメント**: すべてのコードコメントとdocstringは**日本語**で記述する（例: `// ユーザー情報を取得する`）
- **ファイル/ディレクトリ名**: ドメイン要件で明示的に日本語が求められない限り、英語のままにする

## コミットメッセージガイドライン

- コミットメッセージは日本語で短く明確にする
- ファイルやディレクトリ名は、ドメイン要件で明示的に日本語が求められない限り、英語のままにする
- 各タスクの終了時に、変更がコミットに値するかを評価し、該当する場合は簡潔な日本語メッセージでコミットを提案または実行する

## 開発プロセス

> **重要**: このプロセスは最上位のフローである。スキル（`/plan`、`/implement`等）の手順よりもこのプロセスが優先される。ステップを飛ばさず、必ず順番に実行すること。

1. **Issue作成**（`/create-issue`）— バグは原因特定・修正提案まで。その他は実装者の判断に委ねる旨を記載することも検討
2. **Worktree作成**（Issueごと）— 以下のルールを厳守すること:
   - **作成場所**: 必ず `.claude/worktrees/` 配下に作成する（例: `git worktree add .claude/worktrees/feature-123 -b feature/123-description`）
   - **ブランチ名**: `feature/<issue番号>-<簡潔な説明>` または `fix/<issue番号>-<簡潔な説明>` の形式にする
   - **環境変数**: 作成後、メインリポジトリから `.env.local` をWorktreeにコピーすること（`.env.local` は `.gitignore` 対象のため自動では含まれない。コピーしないとビルドエラーになる）
3. **最新mainの取り込み** — `git fetch origin main && git merge origin/main` でWorktree作成後にmainの最新を取り込む。PR作成前にも再度実行し、コンフリクトを事前に解消する
4. **設計・実装**（`/superpowers:brainstorming`）
5. **PR作成**（作成前にステップ3を再実行）
6. **コードレビュー**（`/superpowers:requesting-code-review`）→ PRにコメント
7. **レビュー対応**（スコープ外は別Issue）→ マージ
8. **Worktreeクリーンアップ** — マージ完了後、以下を必ず実行する:
   - `git worktree remove .claude/worktrees/<worktree名>` でWorktreeを削除
   - `git branch -d <ブランチ名>` でローカルブランチを削除
   - メインリポジトリで `git pull` を実行し、mainを最新化
