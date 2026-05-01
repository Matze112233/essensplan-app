'use client'

import { Dish, IngredientCategory, MealType, Recipe } from '@/types'
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
  recipe_id: string
}

const emptyForm = (): DishForm => ({
  name: '',
  suitable_for: 'both',
  protein: [''],
  kohlenhydrat: [''],
  gemuse: [''],
  sosse: [''],
  extras: [''],
  recipe_id: '',
})

const CATEGORIES: { key: CatKey; label: string; color: string; activeClass: string; category: IngredientCategory }[] = [
  { key: 'protein', label: 'Protein', color: 'bg-blue-500', activeClass: 'bg-blue-500 text-white border-blue-500', category: 'protein' },
  { key: 'kohlenhydrat', label: 'Kohlenhydrat', color: 'bg-pink-500', activeClass: 'bg-pink-500 text-white border-pink-500', category: 'kohlenhydrat' },
  { key: 'gemuse', label: 'Gemüse', color: 'bg-green-500', activeClass: 'bg-green-500 text-white border-green-500', category: 'gemuse' },
  { key: 'sosse', label: 'Soße', color: 'bg-red-500', activeClass: 'bg-red-500 text-white border-red-500', category: 'sosse' },
]

export default function GerichtePage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<DishForm>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const filteredDishes = dishes.filter(dish => {
    const q = search.toLowerCase()
    return !q ||
      dish.name.toLowerCase().includes(q) ||
      dish.ingredients.some(i => i.name.toLowerCase().includes(q))
  })

  const loadDishes = async () => {
    const [dishesRes, recipesRes] = await Promise.all([
      fetch('/api/dishes'),
      fetch('/api/recipes'),
    ])
    setDishes(await dishesRes.json())
    setRecipes(await recipesRes.json())
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
      recipe_id: dish.recipe_id ?? '',
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

    const payload = { name: form.name.trim(), suitable_for: form.suitable_for, ingredients, recipe_id: form.recipe_id || null }

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
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-lg">
        <Link href="/" className="text-blue-300 hover:text-white text-lg font-black">←</Link>
        <h1 className="text-xl font-black uppercase tracking-tight flex-1">Gerichte</h1>
        <button onClick={openNew} className="bg-red-600 hover:bg-red-700 text-white text-sm font-black uppercase tracking-wide px-3 py-1.5 rounded-xl transition-colors">
          + Neu
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {!loading && dishes.length > 0 && (
          <>
            <div className="bg-white rounded-2xl shadow-md p-3 border-l-4 border-blue-900 flex gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Gericht oder Zutat suchen..."
                className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-gray-400 hover:text-red-500 text-xl px-1">
                  &times;
                </button>
              )}
            </div>
            {search && (
              <p className="text-xs text-gray-400 px-1">{filteredDishes.length} von {dishes.length} Gerichten</p>
            )}
          </>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Laden...</div>
        ) : dishes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Noch keine Gerichte angelegt.</p>
            <button onClick={openNew} className="mt-4 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wide">
              Erstes Gericht anlegen
            </button>
          </div>
        ) : filteredDishes.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">Keine Gerichte gefunden.</p>
            <button onClick={() => setSearch('')} className="mt-2 text-red-500 text-sm font-bold">
              Suche zurücksetzen
            </button>
          </div>
        ) : (
          filteredDishes.map(dish => (
            <div key={dish.id} className="bg-white rounded-2xl shadow-md px-4 py-3 flex items-start gap-3 border-l-4 border-transparent hover:border-red-500 transition-all">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm text-blue-950">{dish.name}</div>
                <div className="text-xs font-bold text-blue-700 uppercase tracking-wide mt-0.5">{mealLabel(dish.suitable_for)}</div>
                <IngredientList ingredients={dish.ingredients} className="text-xs text-gray-400 mt-1" />
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => openEdit(dish)} className="text-gray-400 hover:text-red-500 text-sm">Bearbeiten</button>
                <button onClick={() => handleDelete(dish.id)} className="text-gray-400 hover:text-red-500 text-sm">Löschen</button>
              </div>
            </div>
          ))
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="font-black text-lg uppercase tracking-wide">{editingId ? 'Gericht bearbeiten' : 'Neues Gericht'}</h2>
              <button onClick={() => setShowForm(false)} className="text-blue-300 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="z.B. Fischstäbchen mit Kartoffeln"
                  className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Geeignet für</label>
                <select
                  value={form.suitable_for}
                  onChange={e => setForm(f => ({ ...f, suitable_for: e.target.value as DishForm['suitable_for'] }))}
                  className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
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
                          className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
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
                        className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
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

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Rezept verknüpfen <span className="text-gray-400 font-normal">(optional)</span></label>
                <select
                  value={form.recipe_id}
                  onChange={e => setForm(f => ({ ...f, recipe_id: e.target.value }))}
                  className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                >
                  <option value="">Kein Rezept</option>
                  {recipes.map(r => (
                    <option key={r.id} value={r.id}>{r.title}</option>
                  ))}
                </select>
                {form.recipe_id && (
                  <p className="text-xs text-amber-600 mt-1">Die Rezeptzutaten werden für die Einkaufsliste verwendet.</p>
                )}
              </div>

            <div className="p-4 border-t flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-100">
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-black uppercase tracking-wide disabled:opacity-50 transition-colors"
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
