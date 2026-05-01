import { Ingredient, IngredientCategory } from '@/types'

const dotClass: Record<NonNullable<IngredientCategory>, string> = {
  protein: 'bg-blue-500',
  kohlenhydrat: 'bg-pink-500',
  gemuse: 'bg-green-500',
  sosse: 'bg-red-500',
}

interface Props {
  ingredients: Ingredient[]
  className?: string
}

export default function IngredientList({ ingredients, className = '' }: Props) {
  if (ingredients.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-x-2 gap-y-0.5 ${className}`}>
      {ingredients.map(ing => (
        <span key={ing.id} className="flex items-center gap-1">
          {ing.category && (
            <span className={`w-2 h-2 rounded-full shrink-0 ${dotClass[ing.category]}`} />
          )}
          <span>{ing.name}</span>
        </span>
      ))}
    </div>
  )
}
