import Link from "next/link"

export default function RulesPage() {
  return (
    <div className="portal-bg min-h-screen text-white">
      <main className="relative z-10 max-w-4xl mx-auto px-5 py-14">
        <Link href="/" className="text-cyan-300 text-sm">← ホームへ戻る</Link>
        <div className="mt-6 mb-10">
          <p className="section-kicker">COMMUNITY RULES</p>
          <h1 className="text-4xl md:text-5xl font-bold">参加ルール</h1>
          <p className="text-gray-400 mt-4">みんなが楽しく遊べる環境を維持するための基本ルールです。</p>
        </div>
        <div className="space-y-4">
          {[
            ["01", "他のプレイヤーを尊重する", "暴言、嫌がらせ、差別的な発言、意図的な迷惑行為は禁止です。"],
            ["02", "荒らし・窃盗をしない", "他人の建築物やアイテムを無断で破壊・持ち去らないでください。"],
            ["03", "配信を妨害しない", "配信の進行を意図的に妨げる行為や、配信者の指示に反する行為は禁止です。"],
            ["04", "不具合を悪用しない", "バグ、チート、外部ツール等を利用した不正な優位性の獲得は禁止です。"],
            ["05", "運営の判断に従う", "違反状況に応じて、注意・キック・一時BAN等の対応を行う場合があります。"],
          ].map(([no, title, body]) => (
            <section key={no} className="portal-panel flex gap-5">
              <span className="text-cyan-400 font-bold text-xl">{no}</span>
              <div><h2 className="font-bold text-lg">{title}</h2><p className="text-gray-400 mt-2 leading-relaxed">{body}</p></div>
            </section>
          ))}
        </div>
        <Link href="/join" className="portal-btn portal-btn-primary mt-8 inline-flex">🎮 参加方法へ</Link>
      </main>
    </div>
  )
}
