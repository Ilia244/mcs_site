"use client"

import Link from "next/link"
import { useAuth } from "@/app/providers/AuthProvider"
import { hasPermission } from "@/lib/role"

const publicTopics = [
  ["#start", "まずはここから"],
  ["#java", "Java版の参加方法"],
  ["#bedrock", "Bedrock版の参加方法"],
  ["#friend", "Bedrockのフレンド参加"],
  ["#copy", "アドレス・ポートのコピー"],
  ["#trouble", "接続できないとき"],
  ["#rules", "ルール・困ったとき"],
]

const adminTopics = [
  ["#server-add", "管理者：サーバーの追加方法"],
]

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/10 p-5">
      <div className="flex gap-4">
        <span className="shrink-0 grid place-items-center w-9 h-9 rounded-full bg-cyan-400/10 border border-cyan-300/20 text-cyan-300 font-bold text-sm">
          {n}
        </span>
        <div className="min-w-0">
          <h3 className="font-bold text-lg">{title}</h3>
          <div className="text-gray-300 text-sm leading-7 mt-2">{children}</div>
        </div>
      </div>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <div className="mt-4 rounded-xl border border-cyan-400/15 bg-cyan-400/5 p-4 text-sm text-gray-300 leading-7">💡 {children}</div>
}

export default function HelpPage() {
  const { profile, loading: authLoading, profileLoading } = useAuth()
  const isAdmin = !authLoading && !profileLoading && hasPermission(profile?.role, 80)

  return (
    <div className="portal-bg min-h-screen text-white">
      <main className="relative z-10 max-w-5xl mx-auto px-5 py-14">
        <Link href="/join" className="text-cyan-300 text-sm hover:underline">← 参加方法へ戻る</Link>

        <header className="mt-6 mb-10">
          <p className="section-kicker">MCS / HELP</p>
          <h1 className="text-4xl md:text-5xl font-bold">Minecraft参加・操作ヘルプ</h1>
          <p className="text-gray-400 mt-4 max-w-3xl leading-7">
            サーバーへの参加方法や接続情報の見方、Bedrock版のフレンド参加、サーバー追加の設定などをまとめています。
            わからないことがあったときは、まずここを確認してください。
          </p>
        </header>

        <nav className="portal-panel mb-6">
          <p className="section-kicker">HELP MENU</p>
          <h2 className="text-xl font-bold mt-1">知りたい項目を選ぶ</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 mt-5">
            {publicTopics.map(([href, label]) => (
              <a key={href} href={href} className="rounded-xl border border-white/10 bg-white/[.02] px-4 py-3 text-sm text-gray-300 hover:border-cyan-400/30 hover:text-cyan-200 transition">
                {label} →
              </a>
            ))}
          </div>
          {isAdmin && (
            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {adminTopics.map(([href, label]) => (
                <a key={href} href={href} className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3 text-sm text-amber-200/90 hover:border-amber-300/40 hover:text-amber-100 transition">
                  🛡️ {label} →
                </a>
              ))}
            </div>
          )}
        </nav>

        <section id="start" className="portal-panel mb-5 scroll-mt-24">
          <p className="section-kicker">START</p>
          <h2 className="text-2xl font-bold mt-1">まずはここから</h2>
          <p className="text-gray-300 mt-4 leading-7">
            通常は「参加方法」ページで遊びたいサーバーを選び、表示された接続情報を使ってMinecraftから接続します。
          </p>
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <Link href="/join" className="portal-card block-hover">
              <span className="text-2xl">🎮</span>
              <b className="block mt-2">参加方法を開く</b>
              <p className="text-gray-500 text-sm mt-1">サーバー選択・アドレス・ポートを確認します。</p>
            </Link>
            <Link href="/rules" className="portal-card block-hover">
              <span className="text-2xl">📜</span>
              <b className="block mt-2">ルールを確認</b>
              <p className="text-gray-500 text-sm mt-1">参加前にサーバーのルールを確認してください。</p>
            </Link>
          </div>
        </section>

        <section id="java" className="portal-panel mb-5 scroll-mt-24">
          <p className="section-kicker">JAVA EDITION</p>
          <h2 className="text-2xl font-bold mt-1">Java版の参加方法</h2>
          <div className="space-y-3 mt-5">
            <Step n="1" title="参加するサーバーを選択">
              <Link href="/join" className="text-cyan-300 hover:underline">参加方法ページ</Link>を開き、遊びたいサーバーを選択します。
            </Step>
            <Step n="2" title="Java版の接続情報を確認">
              「Java版で参加」の欄にあるサーバーアドレスとポートを確認します。通常のMinecraft Java版では、サーバーアドレスとポートを「アドレス:ポート」の形で入力できます。
            </Step>
            <Step n="3" title="Minecraft Java版を開く">
              「マルチプレイ」→「サーバーを追加」または「ダイレクト接続」を開きます。
            </Step>
            <Step n="4" title="接続情報を入力して参加">
              サーバーアドレスを入力し、必要な場合はポートも指定して接続します。参加方法ページの「接続情報をコピー」を使うと入力ミスを減らせます。
            </Step>
          </div>
          <Note>サーバーアドレスに <code className="text-cyan-200">:25565</code> のようなポート番号が付いている場合は、そのまま入力できます。ポートが別に表示されている場合は、Minecraft側の入力欄に合わせて設定してください。</Note>
        </section>

        <section id="bedrock" className="portal-panel mb-5 scroll-mt-24">
          <p className="section-kicker">BEDROCK EDITION</p>
          <h2 className="text-2xl font-bold mt-1">Bedrock版の参加方法</h2>
          <div className="space-y-3 mt-5">
            <Step n="1" title="参加するサーバーを選択">
              <Link href="/join" className="text-cyan-300 hover:underline">参加方法ページ</Link>でサーバーを選びます。
            </Step>
            <Step n="2" title="Bedrock版の接続情報を確認">
              「Bedrock版で参加」の欄にあるアドレスとポートを確認します。Bedrock版はJava版とポートが異なる場合があるため、Bedrock欄の情報を使用してください。
            </Step>
            <Step n="3" title="Minecraft Bedrock版を開く">
              「サーバー」タブからサーバー一覧を開きます。
            </Step>
            <Step n="4" title="サーバーを追加">
              「サーバーを追加」からサーバー名、サーバーアドレス、ポートを入力して保存します。
            </Step>
            <Step n="5" title="保存したサーバーへ参加">
              追加したサーバーを選択して「サーバーに参加」を実行します。
            </Step>
          </div>
          <Note>Switchなど、環境によっては外部サーバーへアドレス・ポートで直接参加できない場合があります。その場合は、下の「Bedrockのフレンド参加」を確認してください。</Note>
        </section>

        <section id="friend" className="portal-panel mb-5 scroll-mt-24">
          <p className="section-kicker">BEDROCK FRIEND JOIN</p>
          <h2 className="text-2xl font-bold mt-1">Bedrockのフレンド参加</h2>
          <p className="text-gray-300 mt-4 leading-7">
            サーバーによっては、Bedrock版でアドレスやポートを入力する代わりに、Minecraftの「フレンド」一覧から参加できる案内を表示しています。
          </p>
          <div className="space-y-3 mt-5">
            <Step n="1" title="Minecraftのフレンド画面を開く">「プレイ」から「フレンド」一覧を開きます。</Step>
            <Step n="2" title="案内されているフレンド名を探す">参加方法ページの「フレンド参加」に表示されている名前と同じものを探します。</Step>
            <Step n="3" title="参加する">対象のフレンドを選択して、表示される参加ボタンからサーバーへ入ります。</Step>
          </div>
          <Note>フレンド参加はサーバーごとに有効・無効が設定されています。参加方法ページにフレンド参加の案内がないサーバーは、表示されているアドレス・ポートを使用してください。</Note>
        </section>

        <section id="copy" className="portal-panel mb-5 scroll-mt-24">
          <p className="section-kicker">COPY</p>
          <h2 className="text-2xl font-bold mt-1">アドレス・ポートのコピー</h2>
          <p className="text-gray-300 mt-4 leading-7">参加方法ページの接続情報には、入力ミスを防ぐためのコピー機能があります。</p>
          <div className="grid md:grid-cols-3 gap-3 mt-5">
            <div className="info-box"><b>接続情報をコピー</b><p className="text-gray-500 text-sm mt-2">アドレスとポートをまとめてコピーします。</p></div>
            <div className="info-box"><b>アドレスをコピー</b><p className="text-gray-500 text-sm mt-2">サーバーアドレスだけをコピーします。</p></div>
            <div className="info-box"><b>ポートをコピー</b><p className="text-gray-500 text-sm mt-2">ポート番号だけをコピーします。</p></div>
          </div>
        </section>

        {isAdmin && (
          <section id="server-add" className="portal-panel mb-5 scroll-mt-24">
          <p className="section-kicker">ADMIN / SERVER MANAGEMENT</p>
          <h2 className="text-2xl font-bold mt-1">管理者：サーバーの追加方法</h2>
          <p className="text-gray-300 mt-4 leading-7">
            管理者は管理画面の「参加方法」から、参加方法ページに表示するサーバーを追加・編集・並べ替えできます。
          </p>
          <div className="space-y-3 mt-5">
            <Step n="1" title="管理画面を開く">管理者アカウントでログインし、管理画面を開きます。</Step>
            <Step n="2" title="「参加方法」を開く">管理画面の「参加方法」タブからサーバー管理を開きます。</Step>
            <Step n="3" title="基本情報を入力">
              内部ID、表示名、サーバー名、説明、対応エディションを設定します。内部IDはサーバーを識別するための値なので、他のサーバーと重複しないようにします。
            </Step>
            <Step n="4" title="Java / Bedrockの接続情報を入力">Javaアドレス・ポート、Bedrockアドレス・ポートをそれぞれ入力します。JavaとBedrockで異なる接続先を使う場合も、それぞれ個別に設定できます。</Step>
            <Step n="5" title="Bedrockフレンド参加を設定">フレンド参加に対応するサーバーでは「Bedrockのフレンド参加を案内する」を有効にし、フレンド一覧に表示される名前を入力します。</Step>
            <Step n="6" title="保存・並べ替え">保存後、サーバー一覧の「↑」「↓」で表示順を変更できます。不要なサーバーは削除できます。</Step>
          </div>
          <Note>サーバーを追加すると、参加方法ページのサーバー選択欄と接続情報カードに反映されます。実際に接続できるかは、入力したアドレス・ポートとMinecraftサーバー側の公開設定にも左右されます。</Note>
          </section>
        )}

        <section id="trouble" className="portal-panel mb-5 scroll-mt-24">
          <p className="section-kicker">TROUBLESHOOTING</p>
          <h2 className="text-2xl font-bold mt-1">接続できないとき</h2>
          <div className="space-y-3 mt-5">
            <div className="info-box"><b>「サーバーが見つからない」</b><p className="text-gray-500 text-sm mt-2">アドレスの入力ミスがないか、Java版とBedrock版を間違えていないか確認してください。</p></div>
            <div className="info-box"><b>「接続できない / タイムアウトする」</b><p className="text-gray-500 text-sm mt-2">サーバーが起動中か、公開状態か、指定されたポートが正しいかを確認してください。メンテナンス中の場合は終了を待ってください。</p></div>
            <div className="info-box"><b>「バージョンが違う」と表示される</b><p className="text-gray-500 text-sm mt-2">サーバーが対応しているMinecraftのバージョンを確認し、必要に応じてクライアント側のバージョンを合わせてください。</p></div>
            <div className="info-box"><b>Bedrock版で参加先が表示されない</b><p className="text-gray-500 text-sm mt-2">フレンド参加方式の場合は、案内されているフレンド名を確認してください。アドレス参加方式の場合は、Bedrock欄のアドレスとポートを確認してください。</p></div>
            <div className="info-box"><b>それでも参加できない</b><p className="text-gray-500 text-sm mt-2">現在の障害・メンテナンスのお知らせを確認し、解決しない場合は運営へ状況を伝えてください。</p></div>
          </div>
        </section>

        <section id="rules" className="portal-panel scroll-mt-24">
          <p className="section-kicker">RULES & SUPPORT</p>
          <h2 className="text-2xl font-bold mt-1">ルール・困ったとき</h2>
          <div className="grid md:grid-cols-2 gap-4 mt-5">
            <Link href="/rules" className="portal-card block-hover"><span className="text-2xl">📜</span><b className="block mt-2">サーバールール</b><p className="text-gray-500 text-sm mt-1">参加前に確認してください。</p></Link>
            <Link href="/notifications" className="portal-card block-hover"><span className="text-2xl">🔔</span><b className="block mt-2">お知らせ</b><p className="text-gray-500 text-sm mt-1">メンテナンスや重要なお知らせを確認します。</p></Link>
          </div>
          <div className="mt-6 text-center"><Link href="/join" className="text-cyan-300 hover:underline">← 参加方法へ戻る</Link></div>
        </section>
      </main>
    </div>
  )
}
