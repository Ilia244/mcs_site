export default function JoinPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-10">

        <h1 className="text-4xl font-bold">
          参加型配信の参加方法
        </h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            ✅ 参加条件
          </h2>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>配信ルールを守れる方</li>
            <li>暴言・荒らし行為をしない</li>
            <li>配信主の指示に従える</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">
            🎮 参加手順
          </h2>
          <ol className="list-decimal list-inside text-gray-400 space-y-1">
            <li>配信概要欄を確認</li>
            <li>参加希望コメントを送信</li>
            <li>順番が来たら参加</li>
          </ol>
        </section>

        <div className="bg-slate-800 p-6 rounded-xl">
          <p className="text-sm text-gray-400">
            ※配信状況により参加枠が変更される場合があります。
          </p>
        </div>

      </div>
    </div>
  )
}