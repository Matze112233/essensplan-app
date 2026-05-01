import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { names } = body // string[]

  await supabase.from('meal_plan_extras').delete().eq('entry_id', id)

  if (names && names.length > 0) {
    const rows = names
      .filter((n: string) => n.trim())
      .map((n: string) => ({ entry_id: id, name: n.trim() }))
    if (rows.length > 0) {
      const { error } = await supabase.from('meal_plan_extras').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data } = await supabase
    .from('meal_plan_extras')
    .select('*')
    .eq('entry_id', id)

  return NextResponse.json(data)
}
