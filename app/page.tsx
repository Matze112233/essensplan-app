'use client'

import WeeklyPlan from '@/components/WeeklyPlan'
import { Dish, MealPlanEntry, MealType, WeekDay } from '@/types'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

function getWeekDates(offset = 0): { start: string; end: string; days: { date: string; label: string }[] } {
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + offset * 7)

  const days = []
  const labels = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag']
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    const display = `${labels[i]}, ${d.getDate()}.${d.getMonth() + 1}.`
    days.push({ date: dateStr, label: display })
  }

  return { start: days[0].date, end: days[6].date, days }
}

export default function HomePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [dishes, setDishes] = useState<Dish[]>([])
  const [entries, setEntries] = useState<MealPlanEntry[]>([])
  const [loading, setLoading] = useState(true)

  const week = getWeekDates(weekOffset)

  const loadData = useCallback(async () => {
    const [dishesRes, entriesRes] = await Promise.all([
      fetch('/api/dishes'),
      fetch(`/api/meal-plan?week_start=${week.start}&week_end=${week.end}`),
    ])
    setDishes(await dishesRes.json())
    setEntries(await entriesRes.json())
    setLoading(false)
  }, [week.start, week.end])

  useEffect(() => {
    setLoading(true)
    loadData()
    const interval = setInterval(loadData, 5000)
    return () => clearInterval(interval)
  }, [loadData])

  const weekDays: WeekDay[] = week.days.map(({ date, label }) => {
    const mittag = entries.find(e => e.date === date && e.meal_type === 'mittag') ?? null
    const abend = entries.find(e => e.date === date && e.meal_type === 'abend') ?? null
    return { date, label, mittag, abend }
  })

  const handleAssign = async (date: string, mealType: MealType, dish: Dish) => {
    const res = await fetch('/api/meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, meal_type: mealType, dish_id: dish.id }),
    })
    const newEntry = await res.json()
    setEntries(prev => {
      const filtered = prev.filter(e => !(e.date === date && e.meal_type === mealType))
      return [...filtered, newEntry]
    })
  }

  const handleRemove = async (entry: MealPlanEntry) => {
    await fetch(`/api/meal-plan/${entry.id}`, { method: 'DELETE' })
    setEntries(prev => prev.filter(e => e.id !== entry.id))
  }

  const weekLabel =
    weekOffset === 0 ? 'Diese Woche' :
    weekOffset === 1 ? 'Nächste Woche' :
    weekOffset === -1 ? 'Letzte Woche' :
    week.start

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-10 shadow">
        <h1 className="text-xl font-bold">Essensplan</h1>
        <div className="flex gap-4 text-sm font-medium">
          <Link href="/gerichte" className="opacity-90 hover:opacity-100">Gerichte</Link>
          <Link href="/einkaufsliste" className="opacity-90 hover:opacity-100">Einkauf</Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600">
            ←
          </button>
          <span className="font-semibold text-gray-700">{weekLabel}</span>
          <button onClick={() => setWeekOffset(o => o + 1)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600">
            →
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Laden...</div>
        ) : (
          <WeeklyPlan week={weekDays} dishes={dishes} onAssign={handleAssign} onRemove={handleRemove} />
        )}
      </main>
    </div>
  )
}
