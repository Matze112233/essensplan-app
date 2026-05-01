import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const { title, instructions, ingredients } = body

  const { error: recipeError } = await supabase
    .from('recipes')
    .update({ title, instructions: instructions || null })
    .eq('id', id)

  if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 })

  await supabase.from('recipe_ingredients').delete().eq('recipe_id', id)

  if (ingredients && ingredients.length > 0) {
    const rows = ingredients
      .filter((i: string) => i.trim())
      .map((name: string) => ({ recipe_id: id, name: name.trim() }))
    if (rows.length > 0) {
      const { error } = await supabase.from('recipe_ingredients').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data: full } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*)')
    .eq('id', id)
    .single()

  return NextResponse.json(full)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { error } = await supabase.from('recipes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
