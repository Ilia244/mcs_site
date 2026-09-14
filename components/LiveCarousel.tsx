"use client"

import { useEffect, useRef, useState } from "react"

type LiveItem = {
  id: string
  video_id: string
  title: string
  channel_name: string
  channel_role: string
  thumbnail_url: string | null
  viewer_count: number | null
  started_at: string | null
}

export default function LiveCarousel({ items }: { items: LiveItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [index, setIndex] = useState(0)
  if (!items.length) return null
  const scrollTo = (next: number) => {
    const safe = Math.max(0, Math.min(items.length - 1, next))
    setIndex(safe)
    const el = ref.current?.children[safe] as HTMLElement | undefined
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" })
  }
  return <section>
    <div className="section-heading"><div><p className="section-kicker">LIVE NOW</p><h2>配信中</h2></div>{items.length > 1 && <div className="flex gap-2"><button onClick={()=>scrollTo(index-1)} disabled={index===0} className="carousel-btn">‹</button><button onClick={()=>scrollTo(index+1)} disabled={index===items.length-1} className="carousel-btn">›</button></div>}</div>
    <div ref={ref} className="live-carousel" onScroll={(e)=>{ const el=e.currentTarget; const card=el.children[0] as HTMLElement; if(card) setIndex(Math.round(el.scrollLeft / Math.max(card.offsetWidth+16,1))) }}>
      {items.map(item => <article key={item.id} className="live-embed-card">
        <div className="aspect-video bg-black"><iframe className="w-full h-full" src={`https://www.youtube.com/embed/${item.video_id}?autoplay=0&rel=0`} title={item.title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen /></div>
        <div className="p-4"><div className="flex items-center gap-2 text-xs text-red-300 font-bold"><span className="status-dot is-live"/>LIVE · {item.channel_name}</div><h3 className="font-bold text-lg mt-2 line-clamp-2">{item.title}</h3><div className="mt-2 text-xs text-gray-400">{item.channel_role === "owner" ? "Ilia./衣李亜" : item.channel_role === "staff" ? "STAFF" : "MCS / COMMUNITY"}{item.viewer_count != null ? ` · ${item.viewer_count.toLocaleString()}人視聴中` : ""}</div></div>
      </article>)}
    </div>
    {items.length>1 && <div className="flex justify-center gap-1.5 mt-4">{items.map((_,i)=><button key={i} aria-label={`${i+1}件目`} onClick={()=>scrollTo(i)} className={`h-1.5 rounded-full transition-all ${i===index?"w-7 bg-cyan-300":"w-2 bg-white/20"}`}/>)}</div>}
  </section>
}
