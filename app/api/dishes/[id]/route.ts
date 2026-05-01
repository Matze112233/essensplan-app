import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { name, suitable_for, ingredients } = body

  const { error: dishError } = await supabase
    .from('dishes')
    .update({ name, suitable_for })
    .eq('id', id)

  if (dishError) return NextResponse.json({ error: dishError.message }, { status: 500 })

  await supabase.from('ingredients').delete().eq('dish_id', id)

  if (ingredients && ingredients.length > 0) {
    const ingredientRows = ingredients
      .filter((i: string) => i.trim())
      .map((name: string) => ({ dish_id: id, name: name.trim() }))

    if (ingredientRows.length > 0) {
      const { error: ingError } = await supabase.from('ingredients').insert(ingredientRows)
      if (ingError) return NextResponse.json({ error: ingError.message }, { status: 500 })
    }
  }

  const { data: full } = await supabase
    .from('dishes')
    .select('*, ingredients(*)')
    .eq('id', id)
    .single()

  return NextResponse.json(full)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const { error } = await supabase.from('dishes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
