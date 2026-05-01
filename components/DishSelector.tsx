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
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
        <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white p-4 rounded-t-2xl flex items-center justify-between">
          <h2 className="font-black text-lg uppercase tracking-wide">Gericht wählen</h2>
          <button onClick={onClose} className="text-blue-300 hover:text-white text-2xl leading-none">&times;</button>
        </div>

        <div className="p-4 border-b flex gap-2">
          <input
            type="text"
            placeholder="Suchen..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
            autoFocus
          />
          <button
            onClick={random}
            className="bg-amber-400 hover:bg-amber-500 text-white px-3 py-2 rounded-xl text-sm font-black uppercase tracking-wide whitespace-nowrap transition-colors"
          >
            Zufall
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-2">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm font-bold uppercase tracking-wide">Keine Gerichte gefunden</p>
          ) : (
            filtered.map(dish => (
              <button
                key={dish.id}
                onClick={() => onSelect(dish)}
                className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 transition-colors border-l-4 border-transparent hover:border-red-500 mb-1"
              >
                <div className="font-bold text-sm text-blue-950">{dish.name}</div>
                <IngredientList ingredients={dish.ingredients} className="text-xs text-gray-400 mt-0.5" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
