'use client'

import { useState } from 'react'
import type { Workout, ExerciseLog, SetLog } from '@/lib/types'
import { DEFAULT_EXERCISES } from '@/lib/data/exercises'
import { format } from 'date-fns'

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quads', 'hamstrings', 'glutes', 'calves', 'core'
] as const

function formatMuscleGroup(group: string) {
  return group.charAt(0).toUpperCase() + group.slice(1)
}

export function WorkoutForm({ onSave }: { onSave: (workout: Workout) => void }) {
  const [name, setName] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [exercises, setExercises] = useState<ExerciseLog[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [filterGroup, setFilterGroup] = useState<string>('')

  const filteredExercises = filterGroup
    ? DEFAULT_EXERCISES.filter((e) => e.muscleGroup === filterGroup)
    : DEFAULT_EXERCISES

  const addExercise = () => {
    if (!selectedExercise) return
    const ex = DEFAULT_EXERCISES.find((e) => e.id === selectedExercise)
    if (!ex || exercises.some((e) => e.exerciseId === ex.id)) return

    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: [{ reps: 10, weight: 0 }],
      },
    ])
    setSelectedExercise('')
  }

  const removeExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId))
  }

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: [...e.sets, { reps: 10, weight: e.sets[0]?.weight ?? 0 }] }
          : e
      )
    )
  }

  const updateSet = (exerciseId: string, setIndex: number, updates: Partial<SetLog>) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e
        const newSets = [...e.sets]
        newSets[setIndex] = { ...newSets[setIndex], ...updates }
        return { ...e, sets: newSets }
      })
    )
  }

  const removeSet = (exerciseId: string, setIndex: number) => {
    setExercises((prev) =>
      prev.map((e) =>
        e.exerciseId === exerciseId
          ? { ...e, sets: e.sets.filter((_, i) => i !== setIndex) }
          : e
      )
    )
  }

  const handleSave = () => {
    if (!name.trim() || exercises.length === 0) return

    const workout: Workout = {
      id: crypto.randomUUID(),
      date,
      name: name.trim(),
      exercises: exercises.map((e) => ({
        ...e,
        sets: e.sets.filter((s) => s.reps > 0 || s.weight > 0),
      })).filter((e) => e.sets.length > 0),
    }

    onSave(workout)
    setName('')
    setDate(format(new Date(), 'yyyy-MM-dd'))
    setExercises([])
  }

  return (
    <div className="workout-form">
      <div className="form-row">
        <input
          type="text"
          placeholder="Workout name (e.g. Push Day)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input input-date"
        />
      </div>

      <div className="add-exercise">
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="select"
        >
          <option value="">All muscle groups</option>
          {MUSCLE_GROUPS.map((g) => (
            <option key={g} value={g}>{formatMuscleGroup(g)}</option>
          ))}
        </select>
        <select
          value={selectedExercise}
          onChange={(e) => setSelectedExercise(e.target.value)}
          className="select select-exercise"
        >
          <option value="">Select exercise</option>
          {filteredExercises.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.name} ({ex.equipment})
            </option>
          ))}
        </select>
        <button type="button" onClick={addExercise} className="btn btn-secondary">
          Add Exercise
        </button>
      </div>

      <div className="exercises-list">
        {exercises.map((ex) => (
          <div key={ex.exerciseId} className="exercise-card">
            <div className="exercise-header">
              <h3>{ex.exerciseName}</h3>
              <button
                type="button"
                onClick={() => removeExercise(ex.exerciseId)}
                className="btn-remove"
                aria-label="Remove exercise"
              >
                ×
              </button>
            </div>
            <div className="sets-header">
              <span>Set</span>
              <span>Reps</span>
              <span>Weight (kg)</span>
              <span></span>
            </div>
            {ex.sets.map((set, i) => (
              <div key={i} className="set-row">
                <span className="set-num">{i + 1}</span>
                <input
                  type="number"
                  min={1}
                  value={set.reps}
                  onChange={(e) => updateSet(ex.exerciseId, i, { reps: +e.target.value })}
                  className="input input-sm"
                />
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={set.weight || ''}
                  onChange={(e) => updateSet(ex.exerciseId, i, { weight: +e.target.value })}
                  className="input input-sm"
                  placeholder="0"
                />
                <button
                  type="button"
                  onClick={() => removeSet(ex.exerciseId, i)}
                  className="btn-remove btn-remove-sm"
                  disabled={ex.sets.length === 1}
                >
                  ×
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addSet(ex.exerciseId)}
              className="btn-add-set"
            >
              + Add set
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!name.trim() || exercises.length === 0}
        className="btn btn-primary btn-save"
      >
        Save Workout
      </button>
    </div>
  )
}
