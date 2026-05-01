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
          <div key={day.date} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-green-600 text-white px-4 py-2 font-semibold text-sm">
              {day.label}
            </div>
            <div className="divide-y">
              {(['mittag', 'abend'] as MealType[]).map(mealType => {
                const entry = day[mealType]
                return (
                  <div key={mealType} className="px-4 py-3 flex gap-3">
                    <span className="text-xs font-medium text-gray-400 w-12 shrink-0 capitalize pt-0.5">
                      {mealType}
                    </span>
                    {entry ? (
                      <div className="flex-1 flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{entry.dish?.name}</div>
                          {entry.dish && (
                            <IngredientList ingredients={entry.dish.ingredients} className="text-xs text-gray-400 mt-0.5" />
                          )}
                          {entry.meal_plan_extras.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {entry.meal_plan_extras.map(ex => (
                                <span key={ex.id} className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">
                                  {ex.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <button
                            onClick={() => openExtras(entry)}
                            className="text-xs text-gray-400 hover:text-green-600 mt-1"
                          >
                            + Extras
                          </button>
                        </div>
                        <button
                          onClick={() => onRemove(entry)}
                          className="text-gray-300 hover:text-red-400 text-xl leading-none shrink-0"
                        >
                          &times;
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setActiveSlot({ date: day.date, mealType })}
                        className="flex-1 text-left text-sm text-gray-300 hover:text-green-600 transition-colors"
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-lg">Extras</h2>
                <p className="text-xs text-gray-400">{extrasModal.entry.dish?.name}</p>
              </div>
              <button onClick={() => setExtrasModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            <div className="overflow-y-auto flex-1 p-4 space-y-2">
              {extrasModal.inputs.map((val, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={val}
                    onChange={e => handleInputChange(i, e.target.value)}
                    placeholder="z.B. Ketchup"
                    className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                    autoFocus={i === 0}
                  />
                  {extrasModal.inputs.length > 1 && (
                    <button onClick={() => removeInput(i)} className="text-gray-300 hover:text-red-400 text-xl leading-none px-1">
                      &times;
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t flex gap-3">
              <button onClick={() => setExtrasModal(null)} className="flex-1 border rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50">
                Abbrechen
              </button>
              <button
                onClick={saveExtras}
                disabled={savingExtras}
                className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50"
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
