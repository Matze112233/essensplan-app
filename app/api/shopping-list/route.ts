import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')
  const weekEnd = searchParams.get('week_end')

  let query = supabase
    .from('meal_plan_entries')
    .select('dish:dishes(name, ingredients(name), recipe:recipes(recipe_ingredients(name)))')

  if (weekStart && weekEnd) {
    query = query.gte('date', weekStart).lte('date', weekEnd)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ingredientCount: Record<string, number> = {}

  for (const entry of data as any[]) {
    const dish = entry.dish
    if (!dish) continue

    // Rezeptzutaten haben Vorrang, sonst Gerichtzutaten
    const items: { name: string }[] =
      dish.recipe?.recipe_ingredients?.length
        ? dish.recipe.recipe_ingredients
        : dish.ingredients ?? []

    for (const ing of items) {
      const key = ing.name.toLowerCase()
      ingredientCount[key] = (ingredientCount[key] || 0) + 1
    }
  }

  const list = Object.entries(ingredientCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json(list)
}
