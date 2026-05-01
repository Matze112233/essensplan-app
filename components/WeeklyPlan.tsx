'use client'

import { Dish, MealPlanEntry, MealType, WeekDay } from '@/types'
import { useState } from 'react'
import DishSelector from './DishSelector'

interface Props {
  week: WeekDay[]
  dishes: Dish[]
  onAssign: (date: string, mealType: MealType, dish: Dish) => void
  onRemove: (entry: MealPlanEntry) => void
}

interface ActiveSlot {
  date: string
  mealType: MealType
}

export default function WeeklyPlan({ week, dishes, onAssign, onRemove }: Props) {
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null)

  const handleSelect = (dish: Dish) => {
    if (!activeSlot) return
    onAssign(activeSlot.date, activeSlot.mealType, dish)
    setActiveSlot(null)
  }

  return (
    <>
      <div className="space-y-3">
        {week.map(day => (
          <div key={day.date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-green-600 text-white px-4 py-2 font-semibold text-sm">
              {day.label}
            </div>
            <div className="divide-y">
              {(['mittag', 'abend'] as MealType[]).map(mealType => {
                const entry = day[mealType]
                return (
                  <div key={mealType} className="flex items-center px-4 py-3 gap-3">
                    <span className="text-xs font-medium text-gray-400 w-12 shrink-0 capitalize">
                      {mealType}
                    </span>
                    {entry ? (
                      <div className="flex-1 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-sm font-medium">{entry.dish?.name}</div>
                          {entry.dish && entry.dish.ingredients.length > 0 && (
                            <div className="text-xs text-gray-400">
                              {entry.dish.ingredients.map(i => i.name).join(', ')}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => onRemove(entry)}
                          className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSlot({ date: day.date, mealType })}
                        className="flex-1 text-left text-sm text-gray-300 hover:text-green-600 transition-colors"
                      >
                        + Gericht wählen
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {activeSlot && (
        <DishSelector
          dishes={dishes}
          mealType={activeSlot.mealType}
          onSelect={handleSelect}
          onClose={() => setActiveSlot(null)}
        />
      )}
    </>
  )
}
