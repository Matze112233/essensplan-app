import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')
  const weekEnd = searchParams.get('week_end')

  let query = supabase
    .from('meal_plan_entries')
    .select('*, dish:dishes(*, ingredients(*))')

  if (weekStart && weekEnd) {
    query = query.gte('date', weekStart).lte('date', weekEnd)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { date, meal_type, dish_id } = body

  await supabase
    .from('meal_plan_entries')
    .delete()
    .eq('date', date)
    .eq('meal_type', meal_type)

  const { data, error } = await supabase
    .from('meal_plan_entries')
    .insert({ date, meal_type, dish_id })
    .select('*, dish:dishes(*, ingredients(*))')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
