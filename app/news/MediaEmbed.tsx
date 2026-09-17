"use client"

function youtubeId(urlOrId: string | null | undefined) {
  if (!urlOrId) return null
  if (/^[A-Za-z0-9_-]{11}$/.test(urlOrId)) return urlOrId
  try {
    const u = new URL(urlOrId)
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("/")[0] || null
    if (u.searchParams.get("v")) return u.searchParams.get("v")
    const m = u.pathname.match(/\/(?:shorts|embed|live)\/([A-Za-z0-9_-]{11})/)
    return m?.[1] || null
  } catch { return null }
}

export default function MediaEmbed({ post, compact = false }: { post: any; compact?: boolean }) {
  const videoId = post?.source === "youtube" ? youtubeId(post.youtube_item_id || post.link_url) : null
  if (videoId) {
    return <div className={`overflow-hidden rounded-2xl border border-white/10 bg-black/30 ${compact ? "aspect-video" : "aspect-video"}`}><iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${videoId}`} title={post.title || "YouTube動画"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
  }
  if (post?.thumbnail_url) {
    return <div className={`overflow-hidden rounded-2xl border border-white/10 bg-black/20 ${compact ? "max-h-56" : "max-h-[520px]"}`}><img src={post.thumbnail_url} alt={post.title || "お知らせ画像"} className={`w-full object-contain ${compact ? "max-h-56" : "max-h-[520px]"}`} loading="lazy" /></div>
  }
  return null
}
