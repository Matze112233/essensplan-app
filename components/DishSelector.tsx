'use client'

import { Dish, MealType } from '@/types'
import { useState } from 'react'
import IngredientList from './IngredientList'

interface Props {
  dishes: Dish[]
  mealType: MealType
  onSelect: (dish: Dish) => void
  onClose: () => void
}

export default function DishSelector({ dishes, mealType, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('')

  const filtered = dishes.filter(d => {
    const matchesMeal = d.suitable_for === 'both' || d.suitable_for === mealType
    const q = search.toLowerCase()
    const matchesSearch = !q ||
      d.name.toLowerCase().includes(q) ||
      d.ingredients.some(i => i.name.toLowerCase().includes(q))
    return matchesMeal && matchesSearch
  })

  const random = () => {
    if (filtered.length === 0) return
    onSelect(filtered[Math.floor(Math.random() * filtered.length)])
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-lg">Gericht wählen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="p-4 border-b flex gap-2">
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
            autoFocus
          />
          <button
            onClick={random}
            className="bg-amber-400 hover:bg-amber-500 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
          >
            Zufällig
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">Keine Gerichte gefunden</p>
          ) : (
            filtered.map(dish => (
              <button
                key={dish.id}
                onClick={() => onSelect(dish)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-green-50 transition-colors"
              >
                <div className="font-medium text-sm">{dish.name}</div>
                <IngredientList ingredients={dish.ingredients} className="text-xs text-gray-400 mt-0.5" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
