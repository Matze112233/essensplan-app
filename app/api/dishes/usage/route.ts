import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('meal_plan_entries')
    .select('dish_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.dish_id] = (counts[row.dish_id] ?? 0) + 1
  }

  return NextResponse.json(counts)
}
