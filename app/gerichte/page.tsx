'use client'

import { Dish, IngredientCategory, MealType } from '@/types'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import IngredientList from '@/components/IngredientList'

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

const emptyForm = (): DishForm => ({
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

export default function GerichtePage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DishForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const loadDishes = async () => {
    const res = await fetch('/api/dishes')
    setDishes(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadDishes() }, [])

  const openNew = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (dish: Dish) => {
    setEditingId(dish.id)
    const byCategory = (cat: IngredientCategory) => {
      const names = dish.ingredients.filter(i => i.category === cat).map(i => i.name)
      return names.length ? [...names, ''] : ['']
    }
    const extras = dish.ingredients.filter(i => !i.category).map(i => i.name)
    setForm({
      name: dish.name,
      suitable_for: dish.suitable_for,
      protein: byCategory('protein'),
      kohlenhydrat: byCategory('kohlenhydrat'),
      gemuse: byCategory('gemuse'),
      sosse: byCategory('sosse'),
      extras: extras.length ? [...extras, ''] : [''],
    })
    setShowForm(true)
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

    const payload = { name: form.name.trim(), suitable_for: form.suitable_for, ingredients }

    if (editingId) {
      await fetch(`/api/dishes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    await loadDishes()
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Gericht wirklich löschen?')) return
    await fetch(`/api/dishes/${id}`, { method: 'DELETE' })
    setDishes(prev => prev.filter(d => d.id !== id))
  }

  const mealLabel = (v: string) => v === 'both' ? 'Mittag & Abend' : v === 'mittag' ? 'Mittag' : 'Abend'

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/" className="text-white opacity-80 hover:opacity-100">←</Link>
        <h1 className="text-xl font-bold flex-1">Gerichte</h1>
        <button onClick={openNew} className="bg-white text-green-700 text-sm font-semibold px-3 py-1.5 rounded-lg">
          + Neu
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Laden...</div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Noch keine Gerichte angelegt.</p>
            <button onClick={openNew} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
              Erstes Gericht anlegen
            </button>
          </div>
        ) : (
          dishes.map(dish => (
            <div key={dish.id} className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{dish.name}</div>
                <div className="text-xs text-green-600 mt-0.5">{mealLabel(dish.suitable_for)}</div>
                <IngredientList ingredients={dish.ingredients} className="text-xs text-gray-400 mt-1" />
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(dish)} className="text-gray-400 hover:text-green-600 text-sm">Bearbeiten</button>
                <button onClick={() => handleDelete(dish.id)} className="text-gray-400 hover:text-red-500 text-sm">Löschen</button>
              </div>
            </div>
          ))
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-semibold text-lg">{editingId ? 'Gericht bearbeiten' : 'Neues Gericht'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Fischstäbchen mit Kartoffeln"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Geeignet für</label>
                <select
                  value={form.suitable_for}
                  onChange={e => setForm(f => ({ ...f, suitable_for: e.target.value as DishForm['suitable_for'] }))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
                    <label className="text-sm font-medium text-gray-700">{cat.label}</label>
                  </div>
                  <div className="space-y-2 pl-5">
                    {form[cat.key].map((val, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={val}
                          onChange={e => handleCatChange(cat.key, i, e.target.value)}
                          placeholder="optional"
                          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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
                <label className="text-sm font-medium text-gray-700 block mb-2">Weitere Zutaten</label>
                <div className="space-y-2">
                  {form.extras.map((extra, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={extra}
                        onChange={e => handleExtraChange(i, e.target.value)}
                        placeholder={`Zutat ${i + 1}`}
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
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

            <div className="p-4 border-t flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
