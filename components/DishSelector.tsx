'use client'

import { Dish, IngredientCategory, MealType } from '@/types'
import { useState } from 'react'
import IngredientList from './IngredientList'

interface Props {
  dishes: Dish[]
  mealType: MealType
  onSelect: (dish: Dish) => void
  onClose: () => void
  onDishCreated?: (dish: Dish) => void
}

type CatKey = 'protein' | 'kohlenhydrat' | 'gemuse' | 'sosse'

interface DishForm {
  name: string
  suitable_for: MealType | 'both'
  protein: string[]
  kohlenhydrat: string[]
  gemuse: string[]
  sosse: string[]
  extras: string[]
}

const emptyForm = (mealType: MealType): DishForm => ({
  name: '',
  suitable_for: 'both',
  protein: [''],
  kohlenhydrat: [''],
  gemuse: [''],
  sosse: [''],
  extras: [''],
})

const CATEGORIES: { key: CatKey; label: string; color: string; category: IngredientCategory }[] = [
  { key: 'protein', label: 'Protein', color: 'bg-blue-500', category: 'protein' },
  { key: 'kohlenhydrat', label: 'Kohlenhydrat', color: 'bg-pink-500', category: 'kohlenhydrat' },
  { key: 'gemuse', label: 'Gemüse', color: 'bg-green-500', category: 'gemuse' },
  { key: 'sosse', label: 'Soße', color: 'bg-red-500', category: 'sosse' },
]

export default function DishSelector({ dishes, mealType, onSelect, onClose, onDishCreated }: Props) {
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState<'select' | 'create'>('select')
  const [form, setForm] = useState<DishForm>(() => emptyForm(mealType))
  const [saving, setSaving] = useState(false)

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

  const handleCatChange = (key: CatKey, index: number, value: string) => {
    const updated = [...form[key]]
    updated[index] = value
    if (index === updated.length - 1 && value) updated.push('')
    setForm(f => ({ ...f, [key]: updated }))
  }

  const removeCatItem = (key: CatKey, index: number) => {
    const updated = form[key].filter((_, i) => i !== index)
    setForm(f => ({ ...f, [key]: updated.length ? updated : [''] }))
  }

  const handleExtraChange = (index: number, value: string) => {
    const updated = [...form.extras]
    updated[index] = value
    if (index === updated.length - 1 && value) updated.push('')
    setForm(f => ({ ...f, extras: updated }))
  }

  const removeExtra = (index: number) => {
    const updated = form.extras.filter((_, i) => i !== index)
    setForm(f => ({ ...f, extras: updated.length ? updated : [''] }))
  }

  const handleSave = async () => {
    if (!form.name.trim()) return
    setSaving(true)

    const ingredients: { name: string; category: IngredientCategory }[] = []
    for (const cat of CATEGORIES) {
      for (const name of form[cat.key]) {
        if (name.trim()) ingredients.push({ name: name.trim(), category: cat.category })
      }
    }
    for (const extra of form.extras) {
      if (extra.trim()) ingredients.push({ name: extra.trim(), category: null })
    }

    const res = await fetch('/api/dishes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: form.name.trim(), suitable_for: form.suitable_for, ingredients }),
    })
    const newDish: Dish = await res.json()
    onDishCreated?.(newDish)
    onSelect(newDish)
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col shadow-2xl">

        {mode === 'select' ? (
          <>
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="font-black text-lg uppercase tracking-wide">Gericht wählen</h2>
              <button onClick={onClose} className="text-blue-300 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="p-4 border-b dark:border-gray-700 flex gap-2">
              <input
                type="text"
                placeholder="Suchen..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
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
              <button
                onClick={() => setMode('create')}
                className="w-full text-left px-4 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 text-red-500 dark:text-red-400 font-black text-sm uppercase tracking-wide transition-colors mb-2"
              >
                + Neues Gericht erfassen
              </button>

              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-8 text-sm font-bold uppercase tracking-wide">Keine Gerichte gefunden</p>
              ) : (
                filtered.map(dish => (
                  <button
                    key={dish.id}
                    onClick={() => onSelect(dish)}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border-l-4 border-transparent hover:border-red-500 mb-1"
                  >
                    <div className="font-bold text-sm text-blue-950 dark:text-blue-200">{dish.name}</div>
                    <IngredientList ingredients={dish.ingredients} className="text-xs text-gray-400 mt-0.5" />
                  </button>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white p-4 rounded-t-2xl flex items-center gap-3">
              <button onClick={() => setMode('select')} className="text-blue-300 hover:text-white font-black text-lg leading-none">←</button>
              <h2 className="font-black text-lg uppercase tracking-wide flex-1">Neues Gericht</h2>
              <button onClick={onClose} className="text-blue-300 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Fischstäbchen mit Kartoffeln"
                  className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Geeignet für</label>
                <select
                  value={form.suitable_for}
                  onChange={e => setForm(f => ({ ...f, suitable_for: e.target.value as DishForm['suitable_for'] }))}
                  className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="both">Mittag & Abend</option>
                  <option value="mittag">Nur Mittag</option>
                  <option value="abend">Nur Abend</option>
                </select>
              </div>

              {CATEGORIES.map(cat => (
                <div key={cat.key}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${cat.color}`} />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{cat.label}</label>
                  </div>
                  <div className="space-y-2 pl-5">
                    {form[cat.key].map((val, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={val}
                          onChange={e => handleCatChange(cat.key, i, e.target.value)}
                          placeholder="optional"
                          className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        />
                        {form[cat.key].length > 1 && (
                          <button onClick={() => removeCatItem(cat.key, i)} className="text-gray-300 hover:text-red-400 text-xl leading-none px-1">
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Weitere Zutaten</label>
                <div className="space-y-2">
                  {form.extras.map((extra, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={extra}
                        onChange={e => handleExtraChange(i, e.target.value)}
                        placeholder={`Zutat ${i + 1}`}
                        className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                      {form.extras.length > 1 && (
                        <button onClick={() => removeExtra(i)} className="text-gray-300 hover:text-red-400 text-xl leading-none px-1">
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t dark:border-gray-700 flex gap-3">
              <button onClick={() => setMode('select')} className="flex-1 border dark:border-gray-600 rounded-lg py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Zurück
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-black uppercase tracking-wide disabled:opacity-50 transition-colors"
              >
                {saving ? 'Speichern...' : 'Speichern & auswählen'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
