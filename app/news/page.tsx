"use client"
import {useEffect,useMemo,useState} from "react";
import Link from "next/link";
import {supabase} from "@/lib/supabase"
import MediaEmbed from "./MediaEmbed"

type Tag={name:string;color:string;icon:string;slug?:string}
type P={id:string;title:string;content:string;created_at:string;published_at:string;type:string;status:string;source?:string;youtube_item_id?:string|null;thumbnail_url?:string|null;link_url?:string|null;tags:Tag[]}

type SortMode="newest"|"oldest"

export default function NewsPage(){
  const[data,setData]=useState<P[]>([]);const[tags,setTags]=useState<Tag[]>([]);const[tag,setTag]=useState("all");const[sort,setSort]=useState<SortMode>("newest");const[loading,setLoading]=useState(true)
  useEffect(()=>{(async()=>{const[{data:posts},{data:allTags}]=await Promise.all([
    supabase.from("posts").select("id,title,content,created_at,published_at,type,status,source,youtube_item_id,thumbnail_url,link_url,post_tags(tags(name,color,icon,slug))").eq("status","published"),
    supabase.from("tags").select("name,color,icon,slug").order("name")
  ]);setData((posts||[]).map((x:any)=>({...x,tags:(x.post_tags||[]).map((t:any)=>t.tags).filter(Boolean)})));setTags(allTags||[]);setLoading(false)})()},[])
  const filtered=useMemo(()=>{const list=tag==="all"?data:data.filter(p=>p.tags?.some(t=>t.slug===tag||t.name===tag));return [...list].sort((a,b)=>{const ad=new Date(a.published_at||a.created_at).getTime(),bd=new Date(b.published_at||b.created_at).getTime();return sort==="newest"?bd-ad:ad-bd})},[data,tag,sort])
  return <div className="portal-bg min-h-screen text-white"><main className="relative z-10 max-w-5xl mx-auto px-5 py-14"><Link href="/" className="text-cyan-300 text-sm">← ホームへ戻る</Link><div className="mt-6 mb-8"><p className="section-kicker">INFORMATION</p><h1 className="text-4xl md:text-5xl font-bold">お知らせ</h1><p className="text-gray-400 mt-3">運営情報・イベント・MCS・配信・YouTubeなどの情報。</p></div>
    <div className="portal-panel mb-6 flex flex-col sm:flex-row gap-3 sm:items-center"><label className="flex-1"><span className="sr-only">TAGで絞り込み</span><select value={tag} onChange={e=>setTag(e.target.value)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white"><option value="all">すべてのTAG</option>{tags.map(t=><option key={t.slug||t.name} value={t.slug||t.name}>{t.icon} {t.name}</option>)}</select></label><label className="sm:w-48"><span className="sr-only">表示順</span><select value={sort} onChange={e=>setSort(e.target.value as SortMode)} className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white"><option value="newest">新しい順</option><option value="oldest">古い順</option></select></label></div>
    <p className="text-sm text-gray-500 mb-4">{filtered.length}件</p><div className="news-list space-y-4">{loading?<div className="portal-panel text-gray-400">お知らせを読み込み中...</div>:filtered.length?filtered.map(p=><div key={p.id} className="portal-panel news-item block-hover overflow-hidden"><MediaEmbed post={p} compact/><Link href={`/news/${p.id}`} className="block p-5"><div className="flex gap-2 flex-wrap">{p.tags?.map(t=><span key={`${p.id}-${t.name}`} className="tag-pill" style={{borderColor:t.color,color:t.color}}>{t.icon} {t.name}</span>)}</div><p className="text-xs text-gray-500 mt-3">{new Date(p.published_at||p.created_at).toLocaleDateString("ja-JP")}</p><h2 className="text-2xl font-bold mt-2">{p.title}</h2><p className="text-gray-300 mt-4 whitespace-pre-wrap leading-relaxed line-clamp-4">{p.content}</p></Link></div>):<div className="portal-panel text-gray-400">条件に一致するお知らせはありません。</div>}</div></main></div>
}
