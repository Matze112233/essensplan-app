import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('meal_plan_entries').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if (body.include_in_shopping !== undefined) updates.include_in_shopping = body.include_in_shopping
  if (body.date !== undefined) updates.date = body.date
  if (body.meal_type !== undefined) updates.meal_type = body.meal_type
  if (body.dish_id !== undefined) updates.dish_id = body.dish_id
  const { error } = await supabase
    .from('meal_plan_entries')
    .update(updates)
    .eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
