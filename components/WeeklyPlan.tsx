'use client'

import { Dish, MealPlanEntry, MealPlanExtra, MealType, WeekDay } from '@/types'
import { useState } from 'react'
import DishSelector from './DishSelector'
import IngredientList from './IngredientList'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'

interface Props {
  week: WeekDay[]
  dishes: Dish[]
  onAssign: (date: string, mealType: MealType, dish: Dish) => void
  onRemove: (entry: MealPlanEntry) => void
  onExtrasChange: (entry: MealPlanEntry, extras: MealPlanExtra[]) => void
  onDishCreated?: (dish: Dish) => void
  onMove: (source: MealPlanEntry, targetDate: string, targetMealType: MealType, target: MealPlanEntry | null) => void
  onToggleShopping: (entry: MealPlanEntry, include: boolean) => void
}

interface ActiveSlot { date: string; mealType: MealType }
interface ExtrasModal { entry: MealPlanEntry; inputs: string[] }

// Grip icon
function GripIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" className="opacity-40">
      <circle cx="3" cy="3" r="1.5" /><circle cx="7" cy="3" r="1.5" />
      <circle cx="3" cy="7" r="1.5" /><circle cx="7" cy="7" r="1.5" />
      <circle cx="3" cy="11" r="1.5" /><circle cx="7" cy="11" r="1.5" />
      <circle cx="3" cy="15" r="1.5" /><circle cx="7" cy="15" r="1.5" />
    </svg>
  )
}

interface SlotRowProps {
  date: string
  mealType: MealType
  entry: MealPlanEntry | null
  draggingId: string | null
  onOpenSelector: () => void
  onRemove: () => void
  onOpenExtras: () => void
  onToggleShopping: () => void
}

function SlotRow({ date, mealType, entry, draggingId, onOpenSelector, onRemove, onOpenExtras, onToggleShopping }: SlotRowProps) {
  const slotId = `${date}|${mealType}`
  const isDraggingThis = draggingId === slotId

  const { setNodeRef: dropRef, isOver } = useDroppable({ id: slotId })
  const { attributes, listeners, setNodeRef: dragRef, isDragging } = useDraggable({
    id: slotId,
    disabled: !entry,
    data: { entry, date, mealType },
  })

  const isDropTarget = isOver && draggingId !== slotId

  return (
    <div
      ref={dropRef}
      className={`px-3 py-3 flex gap-2 items-start transition-colors ${isDropTarget ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
    >
      {/* drag handle */}
      <div
        ref={dragRef}
        {...(entry ? listeners : {})}
        {...(entry ? attributes : {})}
        className={`shrink-0 flex items-center pt-0.5 px-0.5 touch-none select-none cursor-grab active:cursor-grabbing text-gray-300 dark:text-gray-600 hover:text-gray-400 ${!entry ? 'invisible' : ''} ${isDraggingThis ? 'opacity-0' : ''}`}
      >
        <GripIcon />
      </div>

      <span className="text-xs font-black text-gray-300 dark:text-gray-600 uppercase tracking-wider w-10 shrink-0 pt-0.5">
        {mealType}
      </span>

      {entry ? (
        <div className={`flex-1 flex items-start justify-between gap-2 ${isDragging ? 'opacity-20' : ''}`}>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-bold text-blue-950 dark:text-blue-200">{entry.dish?.name}</div>
            {entry.dish && (
              <IngredientList ingredients={entry.dish.ingredients} className="text-xs text-gray-400 mt-0.5" />
            )}
            {entry.meal_plan_extras.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {entry.meal_plan_extras.map(ex => (
                  <span key={ex.id} className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-semibold px-2 py-0.5 rounded-full">
                    {ex.name}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={onOpenExtras}
              className="text-xs text-gray-300 hover:text-red-500 font-bold mt-1.5 transition-colors"
            >
              + Extras
            </button>
          </div>
          <div className="flex flex-col items-center gap-2 shrink-0">
            <button
              onClick={onRemove}
              className="text-gray-300 hover:text-red-500 text-xl leading-none transition-colors"
            >
              &times;
            </button>
            <button
              onClick={onToggleShopping}
              className="flex flex-col items-center gap-0.5"
              title={entry.include_in_shopping ? 'Zutaten auf Einkaufsliste' : 'Zutaten ausgeschlossen'}
            >
              <span className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${entry.include_in_shopping ? 'border-green-500 bg-green-500' : 'border-gray-300 dark:border-gray-600'}`}>
                {entry.include_in_shopping && <span className="text-white leading-none" style={{ fontSize: 9 }}>✓</span>}
              </span>
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={onOpenSelector}
          className={`flex-1 text-left text-sm font-semibold transition-colors ${isDropTarget ? 'text-blue-400' : 'text-gray-300 hover:text-red-500'}`}
        >
          {isDropTarget ? 'Hier ablegen' : '+ Gericht wählen'}
        </button>
      )}
    </div>
  )
}

export default function WeeklyPlan({ week, dishes, onAssign, onRemove, onExtrasChange, onDishCreated, onMove, onToggleShopping }: Props) {
  const [activeSlot, setActiveSlot] = useState<ActiveSlot | null>(null)
  const [extrasModal, setExtrasModal] = useState<ExtrasModal | null>(null)
  const [savingExtras, setSavingExtras] = useState(false)
  const [draggingId, setDraggingId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const draggingEntry = draggingId
    ? week.flatMap(d => [d.mittag, d.abend]).find(e => {
        if (!e || !draggingId) return false
        const [date, mealType] = draggingId.split('|')
        return e.date === date && e.meal_type === mealType
      }) ?? null
    : null

  const handleDragStart = ({ active }: DragStartEvent) => {
    setDraggingId(active.id as string)
  }

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    setDraggingId(null)
    if (!over || active.id === over.id) return

    const sourceData = active.data.current as { entry: MealPlanEntry; date: string; mealType: MealType } | undefined
    if (!sourceData?.entry) return

    const [targetDate, targetMealType] = (over.id as string).split('|')
    const targetDay = week.find(d => d.date === targetDate)
    const targetEntry = targetDay?.[targetMealType as MealType] ?? null

    onMove(sourceData.entry, targetDate, targetMealType as MealType, targetEntry)
  }

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
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="space-y-3">
          {week.map(day => (
            <div key={day.date} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
              <div className="bg-gradient-to-r from-blue-950 to-blue-900 text-white px-4 py-2.5">
                <span className="font-black text-sm uppercase tracking-wide">{day.label}</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {(['mittag', 'abend'] as MealType[]).map(mealType => (
                  <SlotRow
                    key={mealType}
                    date={day.date}
                    mealType={mealType}
                    entry={day[mealType]}
                    draggingId={draggingId}
                    onOpenSelector={() => setActiveSlot({ date: day.date, mealType })}
                    onRemove={() => day[mealType] && onRemove(day[mealType]!)}
                    onOpenExtras={() => day[mealType] && openExtras(day[mealType]!)}
                    onToggleShopping={() => { const e = day[mealType]; if (e) onToggleShopping(e, !e.include_in_shopping) }}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <DragOverlay dropAnimation={null}>
          {draggingEntry?.dish && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl px-4 py-3 border-l-4 border-red-500 opacity-95 pointer-events-none">
              <div className="text-sm font-bold text-blue-950 dark:text-blue-200">{draggingEntry.dish.name}</div>
              <IngredientList ingredients={draggingEntry.dish.ingredients} className="text-xs text-gray-400 mt-0.5" />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {activeSlot && (
        <DishSelector
          dishes={dishes}
          mealType={activeSlot.mealType}
          onSelect={handleSelect}
          onClose={() => setActiveSlot(null)}
          onDishCreated={onDishCreated}
        />
      )}

      {extrasModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl">
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
                    className="flex-1 border-2 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
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

            <div className="p-4 border-t dark:border-gray-700 flex gap-3">
              <button onClick={() => setExtrasModal(null)} className="flex-1 border-2 dark:border-gray-600 rounded-xl py-2 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
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
