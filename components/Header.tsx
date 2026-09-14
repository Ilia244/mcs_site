"use client"

import Link from "next/link"
import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/app/providers/AuthProvider"
import RoleBadge from "@/components/RoleBadge"
import { hasPermission } from "@/lib/role"
import NotificationBell from "@/components/NotificationBell"

export default function Header() {
 const {user}=useAuth(); const [displayName,setDisplayName]=useState("");const[avatarUrl,setAvatarUrl]=useState("");const[role,setRole]=useState("user");const[open,setOpen]=useState(false);const[menuOpen,setMenuOpen]=useState(false);const dropdownRef=useRef<HTMLDivElement>(null);const menuRef=useRef<HTMLDivElement>(null);const router=useRouter()
 useEffect(()=>{const load=async()=>{if(!user){setDisplayName("");setRole("user");setAvatarUrl("");return}const{data:p}=await supabase.from("profiles").select("displayName, role").eq("id",user.id).maybeSingle();if(p){setDisplayName(p.displayName||"");setRole(p.role||"user")}const{data}=supabase.storage.from("avatars").getPublicUrl(`${user.id}.png`);setAvatarUrl(data.publicUrl)};load()},[user])
 useEffect(()=>{const on=(e:MouseEvent)=>{if(dropdownRef.current&&!dropdownRef.current.contains(e.target as Node))setOpen(false);if(menuRef.current&&!menuRef.current.contains(e.target as Node))setMenuOpen(false)};document.addEventListener("mousedown",on);return()=>document.removeEventListener("mousedown",on)},[])
 const logout=async()=>{await supabase.auth.signOut();setOpen(false);setMenuOpen(false);router.refresh()};const canAccessAdmin=hasPermission(role,80)
 const links=[['/','ホーム'],['/minecraft','MCS'],['/join','🎮 参加する'],['/news','最新情報'],['/youtube','YouTube'],['/app/terratech-calculator','TerraTech']]
 return <nav className="portal-nav"><div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-3"><Link href="/" className="font-bold tracking-tight text-cyan-300 text-center leading-tight min-w-0 max-w-[180px]">Ilia./衣李亜<span className="block text-[9px] tracking-[0.25em] text-gray-500">OFFICIAL PORTAL</span></Link><div className="hidden lg:flex items-center gap-5 text-sm">{links.map(([href,label])=><Link key={href} href={href} className="nav-link">{label}</Link>)}</div><div className="flex items-center gap-2"><NotificationBell/><div className="relative lg:hidden" ref={menuRef}><button onClick={()=>setMenuOpen(!menuOpen)} className="px-3 py-2 rounded-lg bg-white/10">☰</button>{menuOpen&&<div className="absolute right-0 mt-2 w-56 portal-menu">{links.map(([href,label])=><Link key={href} href={href} onClick={()=>setMenuOpen(false)}>{label}</Link>)}</div>}</div><div className="relative" ref={dropdownRef}><button onClick={()=>setOpen(!open)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-500/15 border border-cyan-400/20 hover:bg-cyan-500/25">{!user?"ログイン":<><img src={avatarUrl||"/default_avatar.png"} alt="" className="w-7 h-7 rounded-full object-cover" onError={e=>{e.currentTarget.src="/default_avatar.png"}}/><span className="max-w-[90px] truncate hidden sm:inline">{displayName||"未設定"}</span><RoleBadge role={role}/></>}</button>{open&&<div className="absolute right-0 mt-2 w-52 portal-menu">{!user?<><Link href="/account/login">ログイン</Link><Link href="/account/signup">新規作成</Link></>:<><Link href="/account/profile">プロフィールへ</Link>{canAccessAdmin&&<Link href="/admin" className="text-red-400">管理画面</Link>}<hr className="border-white/10"/><button onClick={logout} className="text-left text-red-400">ログアウト</button></>}</div>}</div></div></div></nav>
}
