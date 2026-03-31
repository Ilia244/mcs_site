"use client"

export default function YouTubePage() {
  return (
    <div className="mc-bg min-h-screen text-white">

      <div className="max-w-6xl mx-auto px-6 py-20 space-y-24">

        {/* ===== ヒーロー ===== */}
        <section className="hud-panel scan-lines p-12">

          <h1 className="text-5xl font-extrabold tracking-wider text-orange-500">
            GAME STREAM HUB
          </h1>

          <p className="mt-6 text-gray-300 max-w-2xl">
            Minecraft建築・サバイバル・参加型配信。
            Apexではランク・カジュアル参加型。
          </p>

          <div className="mt-8">
            <a
              href="https://www.youtube.com/@YOUR_CHANNEL"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-10 py-4
              bg-orange-600 hover:bg-orange-500
              transition
              font-bold tracking-wide
              clip-path-[polygon(0_10px,10px_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]"
            >
              ▶ SUBSCRIBE
            </a>
          </div>

        </section>


        {/* ===== 動画カード ===== */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">

          {["VIDEO_ID_1","VIDEO_ID_2","VIDEO_ID_3"].map((id) => (

            <div
              key={id}
              className="hud-panel scan-lines overflow-hidden transition
              hover:shadow-[0_0_20px_rgba(255,72,0,0.4)]"
            >
              <a
                href={`https://www.youtube.com/watch?v=${id}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
                  className="w-full"
                />

                <div className="p-5">
                  <h3 className="font-bold text-orange-400 tracking-wide">
                    STREAM ARCHIVE
                  </h3>
                </div>
              </a>
            </div>

          ))}

        </section>


        {/* ===== 参加型導線 ===== */}
        <section className="hud-panel scan-lines p-12 text-center">

          <h2 className="text-3xl font-bold text-green-400 tracking-wider">
            PARTICIPATION MODE
          </h2>

          <p className="mt-4 text-gray-300">
            視聴者参加型配信あり。
            ルールを守れば誰でも参加可能。
          </p>

          <a
            href="/join"
            className="mt-8 inline-block px-12 py-4
            bg-green-600 hover:bg-green-500
            transition font-bold"
          >
            JOIN DETAILS
          </a>

        </section>

      </div>
    </div>
  )
}