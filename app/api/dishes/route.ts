import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET() {
  const { data, error } = await supabase
    .from('dishes')
    .select('*, ingredients(*), recipe:recipes(*, recipe_ingredients(*))')
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const body = await request.json()
  const { name, suitable_for, ingredients, recipe_id } = body

  const { data: dish, error: dishError } = await supabase
    .from('dishes')
    .insert({ name, suitable_for, recipe_id: recipe_id || null })
    .select()
    .single()

  if (dishError) return NextResponse.json({ error: dishError.message }, { status: 500 })

  if (ingredients && ingredients.length > 0) {
    const ingredientRows = ingredients
      .filter((i: { name: string; category: string | null }) => i.name.trim())
      .map((i: { name: string; category: string | null }) => ({
        dish_id: dish.id,
        name: i.name.trim(),
        category: i.category ?? null,
      }))
    if (ingredientRows.length > 0) {
      const { error: ingError } = await supabase.from('ingredients').insert(ingredientRows)
      if (ingError) return NextResponse.json({ error: ingError.message }, { status: 500 })
    }
  }

  const { data: full } = await supabase
    .from('dishes')
    .select('*, ingredients(*), recipe:recipes(*, recipe_ingredients(*))')
    .eq('id', dish.id)
    .single()

  return NextResponse.json(full, { status: 201 })
}
