import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"

export async function POST(req: Request) {
  const auth = req.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : ""
  if (!token) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return NextResponse.json({ error: "Supabase環境変数がありません" }, { status: 500 })
  const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: { user }, error: userError } = await admin.auth.getUser(token)
  if (userError || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  const { data: profile } = await admin.from("profiles").select("role,is_admin").eq("id", user.id).maybeSingle()
  if (!(profile?.is_admin || profile?.role === "owner" || profile?.role === "admin")) return NextResponse.json({ error: "forbidden" }, { status: 403 })
  const form = await req.formData()
  const file = form.get("file")
  if (!(file instanceof File)) return NextResponse.json({ error: "画像ファイルがありません" }, { status: 400 })
  if (!file.type.startsWith("image/")) return NextResponse.json({ error: "画像ファイルのみ対応しています" }, { status: 400 })
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "画像は5MB以下にしてください" }, { status: 400 })
  const bucket = "post-images"
  const { data: buckets } = await admin.storage.listBuckets()
  if (!buckets?.some(b => b.name === bucket)) {
    const { error } = await admin.storage.createBucket(bucket, { public: true, fileSizeLimit: "5MB" })
    if (error && !/already exists/i.test(error.message)) return NextResponse.json({ error: `画像保存先の作成に失敗しました: ${error.message}` }, { status: 500 })
  }
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg"
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await admin.storage.from(bucket).upload(path, file, { contentType: file.type, upsert: false, cacheControl: "31536000" })
  if (uploadError) return NextResponse.json({ error: `画像アップロードに失敗しました: ${uploadError.message}` }, { status: 500 })
  const { data: publicData } = admin.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({ url: publicData.publicUrl })
}
