"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { supabase } from "@/lib/supabase"

type Notification = { id:string; title:string; body:string|null; link_url:string|null; category:string; priority:string; created_at:string }

export default function NotificationBell(){
 const [user,setUser]=useState<any>(null); const [items,setItems]=useState<Notification[]>([]); const [unread,setUnread]=useState(0); const [open,setOpen]=useState(false); const ref=useRef<HTMLDivElement>(null)
 const load=async()=>{ const {data:u}=await supabase.auth.getUser(); setUser(u.user||null); const {data}=await supabase.from("notifications").select("id,title,body,link_url,category,priority,created_at").order("created_at",{ascending:false}).limit(8); setItems(data||[]); if(u.user){const ids=(data||[]).map((x:any)=>x.id); if(ids.length){const {data:readRows}=await supabase.from("user_notifications").select("notification_id").eq("user_id",u.user.id).in("notification_id",ids); const read=new Set((readRows||[]).map((x:any)=>x.notification_id)); setUnread(ids.filter((id:string)=>!read.has(id)).length)} else setUnread(0)} }
 useEffect(()=>{load(); const sub=supabase.auth.onAuthStateChange(()=>load()); const click=(e:MouseEvent)=>{if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false)};document.addEventListener("mousedown",click);return()=>{sub.data.subscription.unsubscribe();document.removeEventListener("mousedown",click)}} ,[])
 const markRead=async(id:string)=>{if(!user)return;await supabase.from("user_notifications").upsert({user_id:user.id,notification_id:id,read_at:new Date().toISOString()},{onConflict:"user_id,notification_id"});load()}
 return <div className="relative" ref={ref}><button onClick={()=>setOpen(!open)} className="relative h-10 w-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10" aria-label="通知">🔔{unread>0&&<span className="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[10px] font-bold flex items-center justify-center">{unread>9?"9+":unread}</span>}</button>{open&&<div className="absolute right-0 mt-2 w-[min(380px,calc(100vw-24px))] portal-menu p-2 z-50"><div className="px-3 py-2 font-bold flex justify-between"><span>通知</span><Link href="/notifications" className="text-xs text-cyan-300">すべて見る</Link></div>{items.length?items.map(n=><button key={n.id} onClick={()=>{markRead(n.id); if(n.link_url) location.href=n.link_url}} className="w-full min-w-0 text-left p-3 rounded-lg hover:bg-white/5 overflow-hidden"><div className="text-xs text-cyan-300">{n.category.toUpperCase()} · {new Date(n.created_at).toLocaleDateString("ja-JP")}</div><div className="font-semibold mt-1 break-words leading-snug">{n.title}</div>{n.body&&<div className="text-xs text-gray-400 mt-1 line-clamp-2 break-words leading-relaxed">{n.body}</div>}</button>):<div className="p-4 text-sm text-gray-400">現在通知はありません。</div>}</div>}</div>
}
