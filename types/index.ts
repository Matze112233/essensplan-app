export type MealType = 'mittag' | 'abend'

export type IngredientCategory = 'protein' | 'kohlenhydrat' | 'gemuse' | 'sosse' | null

export interface Ingredient {
  id: string
  dish_id: string
  name: string
  category: IngredientCategory
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  name: string
}

export interface Recipe {
  id: string
  title: string
  instructions: string | null
  recipe_ingredients: RecipeIngredient[]
  created_at: string
}

export interface Dish {
  id: string
  name: string
  suitable_for: MealType | 'both'
  ingredients: Ingredient[]
  recipe_id: string | null
  recipe?: Recipe
  created_at: string
}

export interface MealPlanExtra {
  id: string
  entry_id: string
  name: string
}

export interface MealPlanEntry {
  id: string
  date: string // ISO date string: YYYY-MM-DD
  meal_type: MealType
  dish_id: string
  dish?: Dish
  meal_plan_extras: MealPlanExtra[]
}

export interface WeekDay {
  date: string
  label: string
  mittag: MealPlanEntry | null
  abend: MealPlanEntry | null
}
