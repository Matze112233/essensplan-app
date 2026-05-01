'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface ShoppingItem {
  name: string
  count: number
}

function getWeekDates(offset = 0) {
  const today = new Date()
  const dayOfWeek = today.getDay() === 0 ? 6 : today.getDay() - 1
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + offset * 7)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return {
    start: monday.toISOString().split('T')[0],
    end: sunday.toISOString().split('T')[0],
  }
}

export default function EinkaufslistePage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const week = getWeekDates(weekOffset)

  const loadList = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/shopping-list?week_start=${week.start}&week_end=${week.end}`)
    setItems(await res.json())
    setChecked(new Set())
    setLoading(false)
  }, [week.start, week.end])

  useEffect(() => { loadList() }, [loadList])

  const toggle = (name: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const weekLabel =
    weekOffset === 0 ? 'Diese Woche' :
    weekOffset === 1 ? 'Nächste Woche' :
    weekOffset === -1 ? 'Letzte Woche' :
    week.start

  const unchecked = items.filter(i => !checked.has(i.name))
  const done = items.filter(i => checked.has(i.name))

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow">
        <Link href="/" className="text-white opacity-80 hover:opacity-100">←</Link>
        <h1 className="text-xl font-bold flex-1">Einkaufsliste</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center justify-between">
          <button onClick={() => setWeekOffset(o => o - 1)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600">←</button>
          <span className="font-semibold text-gray-700">{weekLabel}</span>
          <button onClick={() => setWeekOffset(o => o + 1)} className="p-2 rounded-lg hover:bg-gray-200 text-gray-600">→</button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Laden...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Noch keine Mahlzeiten geplant.</p>
            <Link href="/" className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
              Zum Wochenplan
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {unchecked.map(item => (
                <button
                  key={item.name}
                  onClick={() => toggle(item.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50 text-left"
                >
                  <span className="w-5 h-5 rounded border-2 border-gray-300 shrink-0" />
                  <span className="flex-1 text-sm capitalize">{item.name}</span>
                  {item.count > 1 && (
                    <span className="text-xs text-gray-400">×{item.count}</span>
                  )}
                </button>
              ))}
            </div>

            {done.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden opacity-50">
                {done.map(item => (
                  <button
                    key={item.name}
                    onClick={() => toggle(item.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50 text-left"
                  >
                    <span className="w-5 h-5 rounded border-2 border-green-500 bg-green-500 shrink-0 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    <span className="flex-1 text-sm capitalize line-through text-gray-400">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-gray-400">{items.length} Zutaten aus dem Wochenplan</p>
          </>
        )}
      </main>
    </div>
  )
}
