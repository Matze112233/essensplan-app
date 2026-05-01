'use client'

import { Dish, MealPlanEntry, MealPlanExtra, MealType, WeekDay } from '@/types'
import { useState } from 'react'
import DishSelector from './DishSelector'
import IngredientList from './IngredientList'

interface Props {
  week: WeekDay[]
  dishes: Dish[]
  onAssign: (date: string, mealType: MealType, dish: Dish) => void
  onRemove: (entry: MealPlanEntry) => void
  onExtrasChange: (entry: MealPlanEntry, extras: MealPlanExtra[]) => void
}

interface ActiveSlot { date: string; mealType: MealType }
interface ExtrasModal { entry: MealPlanEntry; inputs: string[] }

export default function WeeklyPlan({ week, dishes, onAssign, onRemove, onExtrasChange }: Props) {
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null)
  const [extrasModal, setExtrasModal] = useState<ExtrasModal | null>(null)
  const [savingExtras, setSavingExtras] = useState(false)

  const handleSelect = (dish: Dish) => {
    if (!activeSlot) return
    onAssign(activeSlot.date, activeSlot.mealType, dish)
    setActiveSlot(null)
  }

  const openExtras = (entry: MealPlanEntry) => {
    const names = entry.meal_plan_extras.map(e => e.name)
    setExtrasModal({ entry, inputs: names.length ? [...names, ''] : [''] })
  }

  const handleInputChange = (index: number, value: string) => {
    if (!extrasModal) return
    const updated = [...extrasModal.inputs]
    updated[index] = value
    if (index === updated.length - 1 && value) updated.push('')
    setExtrasModal({ ...extrasModal, inputs: updated })
  }

  const removeInput = (index: number) => {
    if (!extrasModal) return
    const updated = extrasModal.inputs.filter((_, i) => i !== index)
    setExtrasModal({ ...extrasModal, inputs: updated.length ? updated : [''] })
  }

  const saveExtras = async () => {
    if (!extrasModal) return
    setSavingExtras(true)
    const names = extrasModal.inputs.filter(n => n.trim())
    const res = await fetch(`/api/meal-plan/${extrasModal.entry.id}/extras`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ names }),
    })
    const newExtras = await res.json()
    onExtrasChange(extrasModal.entry, newExtras)
    setSavingExtras(false)
    setExtrasModal(null)
  }

  return (
    <>
      <div className="space-y-3">
        {week.map(day => (
          <div key={day.date} className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-4 py-2.5 flex items-center gap-2">
              <span className="font-black text-sm uppercase tracking-wide">{day.label}</span>
              <span className="ml-auto w-2 h-2 rounded-full bg-red-500" />
            </div>
            <div className="divide-y divide-gray-100">
              {(['mittag', 'abend'] as MealType[]).map(mealType => {
                const entry = day[mealType]
                return (
                  <div key={mealType} className="px-4 py-3 flex gap-3">
                    <span className="text-xs font-black text-gray-300 uppercase tracking-wider w-12 shrink-0 pt-0.5">
                      {mealType}
                    </span>
                    {entry ? (
                      <div className="flex-1 flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-blue-950">{entry.dish?.name}</div>
                          {entry.dish && (
                            <IngredientList ingredients={entry.dish.ingredients} className="text-xs text-gray-400 mt-0.5" />
                          )}
                          {entry.meal_plan_extras.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.meal_plan_extras.map(ex => (
                                <span key={ex.id} className="text-xs bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                                  {ex.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => openExtras(entry)}
                            className="text-xs text-gray-300 hover:text-red-500 font-bold mt-1 transition-colors"
                          >
                            + Extras
                          </button>
                        </div>
                        <button
                          onClick={() => onRemove(entry)}
                          className="text-gray-300 hover:text-red-500 text-xl leading-none shrink-0 transition-colors"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSlot({ date: day.date, mealType })}
                        className="flex-1 text-left text-sm text-gray-300 hover:text-red-500 font-semibold transition-colors"
                      >
                        + Gericht wählen
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {activeSlot && (
        <DishSelector
          dishes={dishes}
          mealType={activeSlot.mealType}
          onSelect={handleSelect}
          onClose={() => setActiveSlot(null)}
        />
      )}

      {extrasModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white p-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="font-black text-lg uppercase tracking-wide">Extras</h2>
                <p className="text-xs text-blue-300">{extrasModal.entry.dish?.name}</p>
              </div>
              <button onClick={() => setExtrasModal(null)} className="text-blue-300 hover:text-white text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {extrasModal.inputs.map((val, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={val}
                    onChange={e => handleInputChange(i, e.target.value)}
                    placeholder="z.B. Ketchup"
                    className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent"
                    autoFocus={i === 0}
                  />
                  {extrasModal.inputs.length > 1 && (
                    <button onClick={() => removeInput(i)} className="text-gray-300 hover:text-red-500 text-xl leading-none px-1">
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex gap-3">
              <button onClick={() => setExtrasModal(null)} className="flex-1 border-2 rounded-xl py-2 text-sm font-bold text-gray-600 hover:bg-gray-50">
                Abbrechen
              </button>
              <button
                onClick={saveExtras}
                disabled={savingExtras}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2 text-sm font-black uppercase tracking-wide disabled:opacity-50 transition-colors"
              >
                {savingExtras ? 'Speichern...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
