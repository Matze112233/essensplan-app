'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'
type MealBoundary = 'mittag' | 'abend' | 'both'

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

function MealToggle({ value, onChange }: { value: MealBoundary; onChange: (v: MealBoundary) => void }) {
  const mActive = value === 'mittag' || value === 'both'
  const aActive = value === 'abend' || value === 'both'

  const toggleM = () => {
    if (mActive && aActive) onChange('abend')
    else if (!mActive) onChange('both')
    // mActive && !aActive → do nothing (last selection)
  }
  const toggleA = () => {
    if (mActive && aActive) onChange('mittag')
    else if (!aActive) onChange('both')
    // aActive && !mActive → do nothing (last selection)
  }

  const cls = (active: boolean) =>
    `px-2 py-1 text-xs font-black uppercase tracking-wide transition-colors ${active ? 'bg-blue-900 text-white' : 'text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`

  return (
    <div className="flex rounded-lg overflow-hidden border-2 border-gray-200 dark:border-gray-600 shrink-0">
      <button onClick={toggleM} className={cls(mActive)}>M</button>
      <button onClick={toggleA} className={cls(aActive)}>A</button>
    </div>
  )
}

export default function EinkaufslistePage() {
  const { dark, toggle } = useTheme()
  const [range, setRange] = useState(getDefaultRange)
  const [startMeal, setStartMeal] = useState<MealBoundary>('both')
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        setRange({ start: data.start, end: data.end })
        if (data.startMeal) setStartMeal(data.startMeal)
      }
    } catch {}
  }, [])

  const saveToStorage = (r: { start: string; end: string }, sm: MealBoundary) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...r, startMeal: sm })) } catch {}
  }

  const updateRange = (next: { start: string; end: string }) => {
    setRange(next)
    saveToStorage(next, startMeal)
  }

  const updateStartMeal = (meal: MealBoundary) => {
    setStartMeal(meal)
    saveToStorage(range, meal)
  }

  const loadList = useCallback(async () => {
    setLoading(true)
    const res = await fetch(
      `/api/shopping-list?week_start=${range.start}&week_end=${range.end}&start_meal=${startMeal}`
    )
    const data: ShoppingItem[] = await res.json()
    setItems(data)
    const initial: Record<string, number> = {}
    data.forEach(item => { initial[item.name] = item.count })
    setQuantities(initial)
    setChecked(new Set())
    setLoading(false)
  }, [range.start, range.end, startMeal])

  useEffect(() => { loadList() }, [loadList])

  const toggleChecked = (name: string) => {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  const adjustQty = (name: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[name] ?? 1
      return { ...prev, [name]: Math.max(1, current + delta) }
    })
  }

  const handleCopy = async () => {
    const text = items.map(item => {
      const qty = quantities[item.name] ?? item.count
      const suffix = qty > 1 ? ` ×${qty}` : ''
      return `• ${item.name}${suffix}`
    }).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const unchecked = items.filter(i => !checked.has(i.name))
  const done = items.filter(i => checked.has(i.name))

  const QtyControl = ({ name }: { name: string }) => {
    const qty = quantities[name] ?? 1
    return (
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={e => { e.stopPropagation(); adjustQty(name, -1) }}
          className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-500 text-sm font-black flex items-center justify-center transition-colors"
        >−</button>
        <span className="w-5 text-center text-sm font-bold text-gray-600 dark:text-gray-300">{qty}</span>
        <button
          onClick={e => { e.stopPropagation(); adjustQty(name, +1) }}
          className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-600 text-sm font-black flex items-center justify-center transition-colors"
        >+</button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <header className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-4 py-4 flex items-center gap-3 sticky top-0 z-10 shadow-lg">
        <Link href="/" className="text-blue-300 hover:text-white text-lg font-black">←</Link>
        <h1 className="text-xl font-black uppercase tracking-tight flex-1">Einkaufsliste</h1>
        {items.length > 0 && (
          <button
            onClick={handleCopy}
            className="text-xs font-black uppercase tracking-wide px-3 py-1.5 rounded-xl border border-blue-400 text-blue-200 hover:bg-blue-800 transition-colors"
          >
            {copied ? 'Kopiert!' : 'Kopieren'}
          </button>
        )}
        <button onClick={toggle} className="text-lg px-2 py-1 rounded-lg border border-blue-500 text-blue-300 hover:bg-blue-800 hover:text-white transition-colors">
          {dark ? '☀' : '☾'}
        </button>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md px-4 py-3 border-l-4 border-red-600 space-y-2">
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-400 dark:text-gray-500 block mb-1">Von</label>
              <input
                type="date"
                value={range.start}
                onChange={e => updateRange({ ...range, start: e.target.value })}
                className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            <div className="pb-1">
              <MealToggle value={startMeal} onChange={updateStartMeal} />
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 dark:text-gray-500 block mb-1">Bis</label>
            <input
              type="date"
              value={range.end}
              min={range.start}
              onChange={e => updateRange({ ...range, end: e.target.value })}
              className="w-full border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {formatDisplay(range.start)} {startMeal === 'both' ? 'ganztags' : startMeal === 'mittag' ? 'Mittag' : 'Abend'} – {formatDisplay(range.end)} ganztags
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
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden">
              {unchecked.map(item => (
                <div key={item.name} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 border-gray-100 dark:border-gray-700">
                  <button onClick={() => toggleChecked(item.name)} className="shrink-0">
                    <span className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-500 block" />
                  </button>
                  <span className="flex-1 text-sm capitalize dark:text-gray-200">{item.name}</span>
                  <QtyControl name={item.name} />
                </div>
              ))}
            </div>

            {done.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden opacity-50">
                {done.map(item => (
                  <div key={item.name} className="flex items-center gap-3 px-4 py-3 border-b last:border-0 border-gray-100 dark:border-gray-700">
                    <button onClick={() => toggleChecked(item.name)} className="shrink-0">
                      <span className="w-5 h-5 rounded border-2 border-red-600 bg-red-600 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </span>
                    </button>
                    <span className="flex-1 text-sm capitalize line-through text-gray-400">{item.name}</span>
                    <QtyControl name={item.name} />
                  </div>
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
