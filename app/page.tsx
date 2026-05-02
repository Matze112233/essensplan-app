'use client'

import WeeklyPlan from '@/components/WeeklyPlan'
import { useTheme } from '@/components/ThemeProvider'
import { Dish, MealPlanEntry, MealType, WeekDay } from '@/types'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'essensplan_range'
const DAY_LABELS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

async function syncEntriesToServer(snapshot: MealPlanEntry[], current: MealPlanEntry[]) {
  const slots = new Set([
    ...current.map(e => `${e.date}|${e.meal_type}`),
    ...snapshot.map(e => `${e.date}|${e.meal_type}`),
  ])
  const ops: Promise<Response>[] = []
  for (const slot of slots) {
    const [date, meal_type] = slot.split('|')
    const cur = current.find(e => e.date === date && e.meal_type === meal_type)
    const target = snapshot.find(e => e.date === date && e.meal_type === meal_type)
    if (target && (!cur || cur.dish_id !== target.dish_id)) {
      ops.push(fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: target.date, meal_type: target.meal_type, dish_id: target.dish_id }),
      }))
    } else if (!target && cur) {
      ops.push(fetch(`/api/meal-plan/${cur.id}`, { method: 'DELETE' }))
    }
  }
  await Promise.all(ops)
}

function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getDefaultRange() {
  const today = new Date()
  const end = new Date(today)
  end.setDate(today.getDate() + 6)
  return { start: formatDate(today), end: formatDate(end) }
}

function getDaysInRange(start: string, end: string): { date: string; label: string }[] {
  const days: { date: string; label: string }[] = []
  const current = parseLocal(start)
  const endDate = parseLocal(end)
  while (current <= endDate) {
    days.push({
      date: formatDate(current),
      label: `${DAY_LABELS[current.getDay()]}, ${current.getDate()}.${current.getMonth() + 1}.`,
    })
    current.setDate(current.getDate() + 1)
  }
  return days
}

export default function HomePage() {
  const { dark, toggle } = useTheme()
  const [range, setRange] = useState(getDefaultRange)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [autoFilling, setAutoFilling] = useState(false)
  const [undoStack, setUndoStack] = useState<MealPlanEntry[][]>([])
  const [redoStack, setRedoStack] = useState<MealPlanEntry[][]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setRange(JSON.parse(saved))
    } catch {}
  }, [])

  const updateRange = (next: { start: string; end: string }) => {
    setRange(next)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)) } catch {}
  }

  const resetToday = () => updateRange(getDefaultRange())

  const loadData = useCallback(async () => {
    const [dishesRes, entriesRes] = await Promise.all([
      fetch('/api/dishes'),
      fetch(`/api/meal-plan?week_start=${range.start}&week_end=${range.end}`),
    ])
    setDishes(await dishesRes.json())
    setEntries(await entriesRes.json())
    setLoading(false)
  }, [range.start, range.end])

  useEffect(() => {
    setLoading(true)
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  const days = getDaysInRange(range.start, range.end)

  const weekDays: WeekDay[] = days.map(({ date, label }) => ({
    date,
    label,
    mittag: entries.find(e => e.date === date && e.meal_type === 'mittag') ?? null,
    abend: entries.find(e => e.date === date && e.meal_type === 'abend') ?? null,
  }))

  const handleAssign = async (date: string, mealType: MealType, dish: Dish) => {
    pushHistory(entries)
    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, meal_type: mealType, dish_id: dish.id }),
    })
    const newEntry = await res.json()
    setEntries(prev => [...prev.filter(e => !(e.date === date && e.meal_type === mealType)), newEntry])
  }

  const handleRemove = async (entry: MealPlanEntry) => {
    pushHistory(entries)
    await fetch(`/api/meal-plan/${entry.id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== entry.id))
  }

  const handleExtrasChange = (entry: MealPlanEntry, extras: MealPlanEntry['meal_plan_extras']) => {
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, meal_plan_extras: extras } : e))
  }

  const pushHistory = (snapshot: MealPlanEntry[]) => {
    setUndoStack(prev => [...prev.slice(-19), snapshot])
    setRedoStack([])
  }

  const handleUndo = async () => {
    if (undoStack.length === 0) return
    const previous = undoStack[undoStack.length - 1]
    setUndoStack(prev => prev.slice(0, -1))
    setRedoStack(prev => [entries, ...prev.slice(0, 19)])
    setEntries(previous)
    await syncEntriesToServer(previous, entries)
    loadData()
  }

  const handleRedo = async () => {
    if (redoStack.length === 0) return
    const next = redoStack[0]
    setRedoStack(prev => prev.slice(1))
    setUndoStack(prev => [...prev.slice(-19), entries])
    setEntries(next)
    await syncEntriesToServer(next, entries)
    loadData()
  }

  const handleToggleShopping = async (entry: MealPlanEntry, include: boolean) => {
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, include_in_shopping: include } : e))
    await fetch(`/api/meal-plan/${entry.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ include_in_shopping: include }),
    })
  }

  const handleMove = async (source: MealPlanEntry, targetDate: string, targetMealType: MealType, target: MealPlanEntry | null) => {
    pushHistory(entries)
    // Optimistic update
    if (target) {
      setEntries(prev => prev.map(e => {
        if (e.id === source.id) return { ...target, id: source.id, date: source.date, meal_type: source.meal_type }
        if (e.id === target.id) return { ...source, id: target.id, date: target.date, meal_type: target.meal_type }
        return e
      }))
      await Promise.all([
        fetch('/api/meal-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: source.date, meal_type: source.meal_type, dish_id: target.dish_id }) }),
        fetch('/api/meal-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: targetDate, meal_type: targetMealType, dish_id: source.dish_id }) }),
      ])
    } else {
      setEntries(prev => prev.map(e => e.id === source.id ? { ...e, date: targetDate, meal_type: targetMealType } : e))
      await Promise.all([
        fetch('/api/meal-plan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: targetDate, meal_type: targetMealType, dish_id: source.dish_id }) }),
        fetch(`/api/meal-plan/${source.id}`, { method: 'DELETE' }),
      ])
    }
    loadData()
  }

  const handleAutoFill = async () => {
    if (autoFilling || dishes.length === 0) return
    pushHistory(entries)
    setAutoFilling(true)

    const newEntries: MealPlanEntry[] = []

    for (const day of days) {
      const allEntries = [...entries, ...newEntries]
      const dayDishIds = new Set(allEntries.filter(e => e.date === day.date).map(e => e.dish_id))

      for (const mealType of ['mittag', 'abend'] as MealType[]) {
        const alreadyFilled = allEntries.some(e => e.date === day.date && e.meal_type === mealType)
        if (alreadyFilled) continue

        const candidates = dishes.filter(d =>
          (d.suitable_for === 'both' || d.suitable_for === mealType) &&
          !dayDishIds.has(d.id)
        )
        if (candidates.length === 0) continue

        const chosen = candidates[Math.floor(Math.random() * candidates.length)]

        const res = await fetch('/api/meal-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: day.date, meal_type: mealType, dish_id: chosen.id }),
        })
        if (!res.ok) continue
        const newEntry: MealPlanEntry = await res.json()
        newEntries.push(newEntry)
        dayDishIds.add(chosen.id)
      }
    }

    if (newEntries.length > 0) {
      setEntries(prev => {
        const updated = [...prev]
        for (const entry of newEntries) {
          const idx = updated.findIndex(e => e.date === entry.date && e.meal_type === entry.meal_type)
          if (idx >= 0) updated[idx] = entry
          else updated.push(entry)
        }
        return updated
      })
    }
    setAutoFilling(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-4 pt-4 pb-3 sticky top-0 z-10 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight uppercase">Essensplan</h1>
          <button onClick={toggle} className="text-lg px-2 py-1 rounded-lg border border-blue-500 text-blue-300 hover:bg-blue-800 hover:text-white transition-colors">
            {dark ? '☀' : '☾'}
          </button>
        </div>
        <div className="flex gap-2">
          <Link href="/gerichte" className="flex-1 text-center text-xs font-black uppercase tracking-wide px-2 py-1.5 rounded-lg border border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors">Gerichte</Link>
          <Link href="/rezepte" className="flex-1 text-center text-xs font-black uppercase tracking-wide px-2 py-1.5 rounded-lg border border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors">Rezepte</Link>
          <Link href="/einkaufsliste" className="flex-1 text-center text-xs font-black uppercase tracking-wide px-2 py-1.5 rounded-lg border border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white transition-colors">Einkauf</Link>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="flex-1 text-center text-base py-1 rounded-lg border border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            ↶
          </button>
          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="flex-1 text-center text-base py-1 rounded-lg border border-blue-500 text-blue-200 hover:bg-blue-800 hover:text-white disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            ↷
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md px-4 py-3 space-y-2 border-l-4 border-red-600">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide block mb-1">Von</label>
              <input
                type="date"
                value={range.start}
                onChange={e => updateRange({ ...range, start: e.target.value })}
                className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wide block mb-1">Bis</label>
              <input
                type="date"
                value={range.end}
                min={range.start}
                onChange={e => updateRange({ ...range, end: e.target.value })}
                className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <button
              onClick={resetToday}
              className="mt-5 text-xs text-amber-500 hover:text-amber-600 font-black uppercase tracking-wide whitespace-nowrap"
            >
              Heute
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">{days.length} {days.length === 1 ? 'Tag' : 'Tage'}</p>
        </div>

        {!loading && dishes.length > 0 && (
          <button
            onClick={handleAutoFill}
            disabled={autoFilling}
            className="w-full bg-amber-400 hover:bg-amber-500 disabled:opacity-60 text-white font-black uppercase tracking-wide text-sm py-2.5 rounded-2xl shadow-md transition-colors"
          >
            {autoFilling ? 'Wird ausgefüllt...' : 'Alle Mahlzeiten ausfüllen'}
          </button>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-wide text-sm">Laden...</div>
        ) : (
          <WeeklyPlan
            week={weekDays}
            dishes={dishes}
            onAssign={handleAssign}
            onRemove={handleRemove}
            onExtrasChange={handleExtrasChange}
            onDishCreated={dish => setDishes(prev => [...prev, dish])}
            onMove={handleMove}
            onToggleShopping={handleToggleShopping}
          />
        )}
      </main>
    </div>
  )
}
