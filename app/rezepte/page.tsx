'use client'

import { Recipe } from '@/types'
import { useTheme } from '@/components/ThemeProvider'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface RecipeForm {
  title: string
  ingredients: string[]
  instructions: string
}

const emptyForm = (): RecipeForm => ({ title: '', ingredients: [''], instructions: '' })

export default function RezeptePage() {
  const { dark, toggle } = useTheme()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [form, setForm] = useState<RecipeForm>(emptyForm())
  const [saving, setSaving] = useState(false)

  const loadRecipes = async () => {
    const res = await fetch('/api/recipes')
    setRecipes(await res.json())
    setLoading(false)
  }

  useEffect(() => { loadRecipes() }, [])

  const openNew = () => {
    setEditingId(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  const openEdit = (recipe: Recipe) => {
    setEditingId(recipe.id)
    setForm({
      title: recipe.title,
      ingredients: recipe.recipe_ingredients.map(i => i.name).concat(''),
      instructions: recipe.instructions ?? '',
    })
    setShowForm(true)
  }

  const handleIngredientChange = (index: number, value: string) => {
    const updated = [...form.ingredients]
    updated[index] = value
    if (index === updated.length - 1 && value) updated.push('')
    setForm(f => ({ ...f, ingredients: updated }))
  }

  const removeIngredient = (index: number) => {
    const updated = form.ingredients.filter((_, i) => i !== index)
    setForm(f => ({ ...f, ingredients: updated.length ? updated : [''] }))
  }

  const handleSave = async () => {
    if (!form.title.trim()) return
    setSaving(true)

    const payload = {
      title: form.title.trim(),
      instructions: form.instructions.trim(),
      ingredients: form.ingredients.filter(i => i.trim()),
    }

    if (editingId) {
      await fetch(`/api/recipes/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }

    await loadRecipes()
    setShowForm(false)
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Rezept wirklich löschen?')) return
    await fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    setRecipes(prev => prev.filter(r => r.id !== id))
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-lg">
        <Link href="/" className="text-blue-300 hover:text-white text-lg font-black">←</Link>
        <h1 className="text-xl font-black uppercase tracking-tight flex-1">Rezepte</h1>
        <button onClick={toggle} className="text-blue-300 hover:text-white text-lg transition-colors" title={dark ? 'Hellmodus' : 'Nachtmodus'}>
          {dark ? '☀' : '☾'}
        </button>
        <button onClick={openNew} className="bg-red-600 hover:bg-red-700 text-white text-sm font-black uppercase tracking-wide px-3 py-1.5 rounded-xl transition-colors">
          + Neu
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Laden...</div>
        ) : recipes.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Noch keine Rezepte angelegt.</p>
            <button onClick={openNew} className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
              Erstes Rezept anlegen
            </button>
          </div>
        ) : (
          recipes.map(recipe => (
            <div key={recipe.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              <button
                onClick={() => setExpandedId(expandedId === recipe.id ? null : recipe.id)}
                className="w-full flex items-center px-4 py-3 gap-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm dark:text-gray-200">{recipe.title}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {recipe.recipe_ingredients.length} Zutaten
                  </div>
                </div>
                <span className="text-gray-400 text-sm">{expandedId === recipe.id ? '▲' : '▼'}</span>
              </button>

              {expandedId === recipe.id && (
                <div className="px-4 pb-4 border-t dark:border-gray-700 pt-3 space-y-3">
                  {recipe.recipe_ingredients.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Zutaten</div>
                      <ul className="space-y-1">
                        {recipe.recipe_ingredients.map(ing => (
                          <li key={ing.id} className="text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2">
                            <span className="text-gray-300 dark:text-gray-600 mt-0.5">•</span>
                            {ing.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {recipe.instructions && (
                    <div>
                      <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Zubereitung</div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{recipe.instructions}</p>
                    </div>
                  )}
                  <div className="flex gap-3 pt-1">
                    <button onClick={() => openEdit(recipe)} className="text-sm text-green-600 hover:text-green-700">Bearbeiten</button>
                    <button onClick={() => handleDelete(recipe.id)} className="text-sm text-red-400 hover:text-red-500">Löschen</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <h2 className="font-black text-lg uppercase tracking-wide">{editingId ? 'Rezept bearbeiten' : 'Neues Rezept'}</h2>
              <button onClick={() => setShowForm(false)} className="text-blue-300 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Titel</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="z.B. Fischstäbchen klassisch"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">Zutaten</label>
                <div className="space-y-2">
                  {form.ingredients.map((ing, i) => (
                    <div key={i} className="flex gap-2">
                      <input
                        type="text"
                        value={ing}
                        onChange={e => handleIngredientChange(i, e.target.value)}
                        placeholder="z.B. 500g Fischstäbchen"
                        className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                      {form.ingredients.length > 1 && (
                        <button onClick={() => removeIngredient(i)} className="text-gray-300 hover:text-red-400 text-xl leading-none px-1">
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">Zubereitung</label>
                <textarea
                  value={form.instructions}
                  onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
                  placeholder="Schritt für Schritt Anleitung..."
                  rows={6}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            <div className="p-4 border-t dark:border-gray-700 flex gap-3">
              <button onClick={() => setShowForm(false)} className="flex-1 border dark:border-gray-600 rounded-lg py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Abbrechen
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim()}
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
