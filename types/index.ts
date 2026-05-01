export type MealType = 'mittag' | 'abend'

export interface Ingredient {
  id: string
  dish_id: string
  name: string
}

export interface Dish {
  id: string
  name: string
  suitable_for: MealType | 'both'
  ingredients: Ingredient[]
  created_at: string
}

export interface MealPlanEntry {
  id: string
  date: string // ISO date string: YYYY-MM-DD
  meal_type: MealType
  dish_id: string
  dish?: Dish
}

export interface WeekDay {
  date: string
  label: string
  mittag: MealPlanEntry | null
  abend: MealPlanEntry | null
}
