'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface ShoppingItem {
  name: string
  count: number
}

const STORAGE_KEY = 'essensplan_range'

function getDefaultRange() {
  const today = new Date()
  const end = new Date(today)
  end.setDate(today.getDate() + 6)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(today), end: fmt(end) }
}

function formatDisplay(dateStr: string) {
  const [, m, d] = dateStr.split('-')
  return `${Number(d)}.${Number(m)}.`
}

export default function EinkaufslistePage() {
  const [range, setRange] = useState(getDefaultRange)
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [checked, setChecked] = useState<Set<string>>(new Set())
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

  const loadList = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/shopping-list?week_start=${range.start}&week_end=${range.end}`)
    setItems(await res.json())
    setChecked(new Set())
    setLoading(false)
  }, [range.start, range.end])

  useEffect(() => { loadList() }, [loadList])

  const toggle = (name: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const unchecked = items.filter(i => !checked.has(i.name))
  const done = items.filter(i => checked.has(i.name))

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-lg">
        <Link href="/" className="text-blue-300 hover:text-white text-lg font-black">←</Link>
        <h1 className="text-xl font-black uppercase tracking-tight flex-1">Einkaufsliste</h1>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl shadow-md px-4 py-3 border-l-4 border-red-600">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Von</label>
              <input
                type="date"
                value={range.start}
                onChange={e => updateRange({ ...range, start: e.target.value })}
                className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 block mb-1">Bis</label>
              <input
                type="date"
                value={range.end}
                min={range.start}
                onChange={e => updateRange({ ...range, end: e.target.value })}
                className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {formatDisplay(range.start)} – {formatDisplay(range.end)}
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">Laden...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <p>Keine Mahlzeiten im gewählten Zeitraum.</p>
            <Link href="/" className="mt-4 inline-block bg-green-600 text-white px-4 py-2 rounded-lg text-sm">
              Zum Essensplan
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {unchecked.map(item => (
                <button
                  key={item.name}
                  onClick={() => toggle(item.name)}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-100 text-left"
                >
                  <span className="w-5 h-5 rounded border-2 border-gray-300 shrink-0" />
                  <span className="flex-1 text-sm capitalize">{item.name}</span>
                  {item.count > 1 && <span className="text-xs text-gray-400">×{item.count}</span>}
                </button>
              ))}
            </div>

            {done.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden opacity-50">
                {done.map(item => (
                  <button
                    key={item.name}
                    onClick={() => toggle(item.name)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-100 text-left"
                  >
                    <span className="w-5 h-5 rounded border-2 border-red-600 bg-red-600 shrink-0 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </span>
                    <span className="flex-1 text-sm capitalize line-through text-gray-400">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-center text-xs text-gray-400">{items.length} Zutaten aus dem Essensplan</p>
          </>
        )}
      </main>
    </div>
  )
}
