# v8.9.9 ユーザー管理更新

## 変更内容
- 管理画面のユーザー管理で、権限変更を入力式から選択式に変更。
- 現在の管理者が変更可能なロールだけをプルダウンに表示。
- 自分自身・自分以上の権限を持つユーザーは変更不可。
- ユーザーごとにアバター、表示名、メールアドレス、MCID、登録日時、アカウントIDを表示。
- MCIDは `mcid` / `minecraft_id` / `minecraftId` / `minecraft_username` / `minecraftUsername` / `minecraft_name` / `minecraftName` / `mc_name` / `minecraft` のいずれかのプロフィール列に入っていれば自動表示。

## Supabaseで必要な作業

このZIPには `supabase/roles-and-command-visibility.sql` にユーザー管理用RPCの更新を含めています。
Supabase SQL EditorでこのSQLを実行してください。

既存の `admin_update_role` も同じファイルに含まれているため、ファイル全体を上から順に実行できます。

MCIDの実際のプロフィール列名が上記に含まれていない場合は、UIは「未登録」と表示します。その場合は実際の列名に合わせてRPCのCOALESCE部分へ追加できます。
