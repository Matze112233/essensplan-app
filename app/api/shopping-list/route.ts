import { supabase } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const weekStart = searchParams.get('week_start')
  const weekEnd = searchParams.get('week_end')
  const startMeal = searchParams.get('start_meal') ?? 'mittag'
  const endMeal = searchParams.get('end_meal') ?? 'abend'

  let query = supabase
    .from('meal_plan_entries')
    .select('date, meal_type, dish:dishes(ingredients(name), recipe:recipes(recipe_ingredients(name))), meal_plan_extras(name)')
    .eq('include_in_shopping', true)

  if (weekStart && weekEnd) {
    query = query.gte('date', weekStart).lte('date', weekEnd)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const ingredientCount: Record<string, number> = {}

  const add = (name: string) => {
    const key = name.toLowerCase()
    ingredientCount[key] = (ingredientCount[key] || 0) + 1
  }

  for (const entry of (data as any[]).filter(e => {
    if (e.date === weekStart && startMeal === 'abend' && e.meal_type === 'mittag') return false
    if (e.date === weekEnd && endMeal === 'mittag' && e.meal_type === 'abend') return false
    return true
  })) {
    const dish = entry.dish
    if (dish) {
      const items: { name: string }[] =
        dish.recipe?.recipe_ingredients?.length
          ? dish.recipe.recipe_ingredients
          : dish.ingredients ?? []
      for (const ing of items) add(ing.name)
    }
    for (const extra of entry.meal_plan_extras ?? []) add(extra.name)
  }

  const list = Object.entries(ingredientCount)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({ name, count }))

  return NextResponse.json(list)
}
