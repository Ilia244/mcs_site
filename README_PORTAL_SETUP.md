# Ilia./衣李亜 Official Portal 実装セットアップ

## 1. Supabase
`supabase/portal.sql` を Supabase SQL Editor で実行してください。

既存の `profiles` / `news` / Auth は前提として維持し、既存ニュースは新しい `posts` に一度コピーされます。

## 2. Vercel環境変数
以下を設定してください。

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（サーバー専用。`NEXT_PUBLIC_` を付けない）
- `YOUTUBE_API_KEY`
- `CRON_SECRET`

YouTube Data APIキーはGoogle Cloud側でYouTube Data API v3を有効化して作成します。

## 3. YouTubeチャンネル
管理画面 → YouTube連携 から、オーナー・スタッフ・MCS/Communityのチャンネルを複数登録できます。

ハンドル（例 `@Ilia244`）を入れて同期するとチャンネルID・アイコン・説明などを取得します。チャンネルごとに以下を個別設定できます。

- ホーム掲載
- MCS掲載
- LIVE表示
- 新着動画表示
- 新着動画の自動お知らせ
- 配信開始の自動通知
- 自動公開 / 下書き

## 4. 自動同期
`/api/youtube/sync` がYouTubeの新着動画・配信状態を同期します。

Vercel HobbyではCronは1日1回までなので、`vercel.json` は毎日1回にしています。Pro以上で高頻度同期を使う場合は `schedule` を `*/5 * * * *` に変更して再デプロイしてください。

管理画面の「▶ 今すぐ同期」はプランに関係なく手動同期できます。

## 5. 通知
投稿時に「公開時に利用者へ通知」をONにすると、投稿と通知が同時に作成されます。

YouTube連携では、設定したチャンネルの新着動画・配信開始も自動通知できます。

## 6. 投稿プリセット
管理画面 → プリセットから、新サーバー開放・イベント・メンテナンス・配信告知・重要なお知らせなどのテンプレートを登録できます。

投稿画面ではプリセットを選択して、必要な部分だけ編集して公開できます。

## 7. LIVE表示
複数の配信が同時に配信中の場合、ホームとYouTubeページでは横スクロール式カルーセルで切り替えます。スマートフォンは1件ずつ、PCは大きめのカードを横方向へ切り替えるUIです。
