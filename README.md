# 配信カレンダー（自動取得版）

仕組み: GitHub Actions が6時間ごとに YouTube Data API で配信予定を取得 → `schedules.json` を更新 → GitHub Pages の `index.html` がそれを表示。

## セットアップ
1. このフォルダをそのまま GitHub の新しいリポジトリに push
2. YouTube Data API v3 の APIキーを取得（Google Cloud Console → APIとサービス → YouTube Data API v3 を有効化 → 認証情報 → APIキー）
3. リポジトリの Settings → Secrets and variables → Actions に `YT_API_KEY` として登録
4. Settings → Pages → Source を「Deploy from a branch」→ `main` / `/(root)` に設定
5. Actions タブ → update-schedule → Run workflow で初回実行（以降は6時間ごと自動）

## チャンネルの追加
`channels.json` に `{ "handle": "@○○", "color": "#e5334b" }` を足して push するだけ。
（ハンドルが分からない場合は `{ "id": "UC..." }` でもOK）

## APIの消費量
1チャンネル1回あたり約3 units。10チャンネル×1日4回＝約120 units（無料枠は1日10,000）。
