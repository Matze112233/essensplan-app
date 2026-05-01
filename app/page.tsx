'use client'

import WeeklyPlan from '@/components/WeeklyPlan'
import { Dish, MealPlanEntry, MealType, WeekDay } from '@/types'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'essensplan_range'
const DAY_LABELS = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag']

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
  const [range, setRange] = useState(getDefaultRange)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [loading, setLoading] = useState(true)

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
    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, meal_type: mealType, dish_id: dish.id }),
    })
    const newEntry = await res.json()
    setEntries(prev => [...prev.filter(e => !(e.date === date && e.meal_type === mealType)), newEntry])
  }

  const handleRemove = async (entry: MealPlanEntry) => {
    await fetch(`/api/meal-plan/${entry.id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== entry.id))
  }

  const handleExtrasChange = (entry: MealPlanEntry, extras: MealPlanEntry['meal_plan_extras']) => {
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, meal_plan_extras: extras } : e))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-4 py-4 sticky top-0 z-10 shadow-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight uppercase">🏀 Essensplan</h1>
          <div className="flex gap-4 text-xs font-bold uppercase tracking-wide">
            <Link href="/gerichte" className="opacity-80 hover:opacity-100">Gerichte</Link>
            <Link href="/rezepte" className="opacity-80 hover:opacity-100">Rezepte</Link>
            <Link href="/einkaufsliste" className="opacity-80 hover:opacity-100">Einkauf</Link>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-md px-4 py-3 space-y-2 border-l-4 border-red-600">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide block mb-1">Von</label>
              <input
                type="date"
                value={range.start}
                onChange={e => updateRange({ ...range, start: e.target.value })}
                className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wide block mb-1">Bis</label>
              <input
                type="date"
                value={range.end}
                min={range.start}
                onChange={e => updateRange({ ...range, end: e.target.value })}
                className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
            </div>
            <button
              onClick={resetToday}
              className="mt-5 text-xs text-amber-500 hover:text-amber-600 font-black uppercase tracking-wide whitespace-nowrap"
            >
              Heute
            </button>
          </div>
          <p className="text-xs text-gray-400 font-medium">{days.length} {days.length === 1 ? 'Tag' : 'Tage'}</p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400 font-bold uppercase tracking-wide text-sm">Laden...</div>
        ) : (
          <WeeklyPlan week={weekDays} dishes={dishes} onAssign={handleAssign} onRemove={handleRemove} onExtrasChange={handleExtrasChange} />
        )}
      </main>
    </div>
  )
}
