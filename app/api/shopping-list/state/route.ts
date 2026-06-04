import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data } = await supabase
    .from('shopping_list_state')
    .select('*')
    .eq('id', 1)
    .single()
  return NextResponse.json(data ?? null)
}

export async function POST(request: Request) {
  const { range_start, range_end, start_meal, checked, quantities } = await request.json()
  const { error } = await supabase
    .from('shopping_list_state')
    .upsert({ id: 1, range_start, range_end, start_meal, checked, quantities, updated_at: new Date().toISOString() })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
