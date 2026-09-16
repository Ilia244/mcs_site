# Web Push通知セットアップ

この版では、サイト内の「お知らせ・通知」に加えて、ユーザーが許可したブラウザ/端末へWeb Push通知を送れます。

## 1. Supabase

`supabase/portal.sql` の末尾にある `push_subscriptions` テーブル作成SQLをSupabase SQL Editorで1回実行してください。

既存の `notifications` テーブルはそのまま利用します。

## 2. VAPIDキー

プロジェクトで依存関係をインストールした後、次を実行します。

```bash
npx web-push generate-vapid-keys
```

表示された Public Key / Private Key をVercelの環境変数へ登録します。

```text
NEXT_PUBLIC_VAPID_PUBLIC_KEY=Public Key
VAPID_PRIVATE_KEY=Private Key
VAPID_SUBJECT=mailto:管理者のメールアドレス
```

`VAPID_PRIVATE_KEY` は絶対にクライアントへ公開しないでください。

このプロジェクトでは `NEXT_PUBLIC_VAPID_PUBLIC_KEY` だけがブラウザへ公開されます。

## 3. Vercel

既存のSupabase/YouTube環境変数に加えて、以下をProductionへ登録します。

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

登録後に再デプロイしてください。

## 4. ユーザー側

ログイン後、プロフィールページの「🔔 サイト通知」から「通知を許可」を押します。

最初のクリックでブラウザ標準の通知許可ダイアログが表示されます。

許可されると、そのブラウザ/端末のPush SubscriptionがSupabaseへ保存されます。

## 5. 通知が送られるタイミング

現在の実装では以下がWeb Push対象です。

- YouTubeの新規動画が同期で検出されたとき
- YouTube LIVE開始が検出されたとき
- 管理画面から公開投稿に対して「通知」を作成したとき

既に存在している過去の通知を、通知許可直後にまとめてPushする仕様にはしていません。

## 6. HTTPS

Web PushはHTTPS環境で使用してください。Vercelの本番ドメインはHTTPSなので、そのまま利用できます。

## 7. ブラウザの通知拒否

ユーザーが一度ブラウザで「拒否」を選んだ場合、サイトのボタンだけでは再許可できないことがあります。その場合はブラウザのサイト権限から通知を許可してください。

## 8. npm

`package.json` に `web-push` を追加しています。既存環境でローカル開発する場合は、プロジェクトルートで一度、

```bash
npm install
```

を実行してください。
