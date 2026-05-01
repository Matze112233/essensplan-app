import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*)')
    .order('title')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { title, instructions, ingredients } = body

  const { data: recipe, error: recipeError } = await supabase
    .from('recipes')
    .insert({ title, instructions: instructions || null })
    .select()
    .single()

  if (recipeError) return NextResponse.json({ error: recipeError.message }, { status: 500 })

  if (ingredients && ingredients.length > 0) {
    const rows = ingredients
      .filter((i: string) => i.trim())
      .map((name: string) => ({ recipe_id: recipe.id, name: name.trim() }))
    if (rows.length > 0) {
      const { error } = await supabase.from('recipe_ingredients').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const { data: full } = await supabase
    .from('recipes')
    .select('*, recipe_ingredients(*)')
    .eq('id', recipe.id)
    .single()

  return NextResponse.json(full, { status: 201 })
}
