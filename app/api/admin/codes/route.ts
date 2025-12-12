import { createClient } from "@/lib/supabase/client"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createClient()

  const { data, error } = await supabase.from("reward_codes").select("*").order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from("reward_codes")
    .insert([
      {
        code: body.code.toUpperCase(),
        gold: body.gold,
        mini_bomb: body.miniBomb,
        standard_bomb: body.standardBomb,
        eraser: body.eraser,
        board_refresh: body.boardRefresh,
        usage_limit: body.usageLimit,
        used_count: 0,
        active: true,
      },
    ])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 })
  }

  const { error } = await supabase.from("reward_codes").delete().eq("id", id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request) {
  const supabase = createClient()
  const body = await request.json()

  if (body.incrementUsage) {
    const { error } = await supabase.rpc("increment_code_usage", { code_id: body.id })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await supabase.from("reward_codes").update({ active: body.active }).eq("id", body.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
