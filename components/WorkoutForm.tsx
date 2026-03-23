'use client'

import { useState, useEffect } from 'react'
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

interface WorkoutFormProps {
  onSave: (workout: Workout) => void
  initialWorkout?: Workout | null
  onCancel?: () => void
  pastWorkouts?: Workout[]
  prs?: Map<string, { weight: number; date: string }>
}

function getLastExerciseLog(exerciseId: string, workouts: Workout[]): ExerciseLog | null {
  for (const w of workouts) {
    const ex = w.exercises.find((e) => e.exerciseId === exerciseId)
    if (ex && ex.sets.length > 0) return ex
  }
  return null
}

export function WorkoutForm({ onSave, initialWorkout, onCancel, pastWorkouts = [], prs }: WorkoutFormProps) {
  const [name, setName] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<ExerciseLog[]>([])
  const [selectedExercise, setSelectedExercise] = useState('')
  const [filterGroup, setFilterGroup] = useState<string>('')

  const isEditing = !!initialWorkout

  useEffect(() => {
    if (initialWorkout) {
      setName(initialWorkout.name)
      setDate(initialWorkout.date)
      setNotes(initialWorkout.notes ?? '')
      setExercises(
        initialWorkout.exercises.map((e) => ({
          ...e,
          sets: e.sets.map((s) => ({ ...s })),
        }))
      )
    } else {
      setName('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setNotes('')
      setExercises([])
    }
  }, [initialWorkout])

  const filteredExercises = filterGroup
    ? DEFAULT_EXERCISES.filter((e) => e.muscleGroup === filterGroup)
    : DEFAULT_EXERCISES

  const addExercise = () => {
    if (!selectedExercise) return
    const ex = DEFAULT_EXERCISES.find((e) => e.id === selectedExercise)
    if (!ex || exercises.some((e) => e.exerciseId === ex.id)) return

    const lastLog = getLastExerciseLog(ex.id, pastWorkouts)
    const sets = lastLog
      ? lastLog.sets.map((s) => ({
          reps: s.reps,
          weight: s.weight,
          ...(s.rpe != null && { rpe: s.rpe }),
          ...(s.effort != null && { effort: s.effort }),
          ...(s.form != null && { form: s.form }),
        }))
      : [{ reps: 10, weight: 0 }]

    setExercises((prev) => [
      ...prev,
      {
        exerciseId: ex.id,
        exerciseName: ex.name,
        muscleGroup: ex.muscleGroup,
        sets,
      },
    ])
    setSelectedExercise('')
  }

  const removeExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((e) => e.exerciseId !== exerciseId))
  }

  const addSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((e) => {
        if (e.exerciseId !== exerciseId) return e
        const last = e.sets[e.sets.length - 1]
        return {
          ...e,
          sets: [
            ...e.sets,
            {
              reps: last?.reps ?? 10,
              weight: last?.weight ?? 0,
              ...(last?.effort != null && { effort: last.effort }),
              ...(last?.form != null && { form: last.form }),
            },
          ],
        }
      })
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

    const cleanedExercises = exercises
      .map((e) => ({
        ...e,
        sets: e.sets.filter((s) => s.reps > 0 || s.weight > 0),
      }))
      .filter((e) => e.sets.length > 0)

    if (cleanedExercises.length === 0) return

    const workout: Workout = {
      id: initialWorkout?.id ?? crypto.randomUUID(),
      date,
      name: name.trim(),
      exercises: cleanedExercises,
      ...(notes.trim() && { notes: notes.trim() }),
    }

    onSave(workout)
    if (!isEditing) {
      setName('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setNotes('')
      setExercises([])
    }
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

      <div className="form-notes-row">
        <textarea
          placeholder="Notes (optional) — e.g. felt strong today, slight shoulder discomfort"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="input input-notes"
          rows={2}
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
        {exercises.map((ex) => {
          const prWeight = prs?.get(ex.exerciseId)?.weight ?? 0
          return (
            <div key={ex.exerciseId} className="exercise-card">
              <div className="exercise-header">
                <div>
                  <h3>{ex.exerciseName}</h3>
                  {pastWorkouts.length > 0 && (() => {
                    const last = getLastExerciseLog(ex.exerciseId, pastWorkouts)
                    if (!last) return null
                    const hint = last.sets.map((s) => `${s.reps}×${s.weight}lbs`).join(', ')
                    return (
                      <span className="last-time-hint">Last: {hint}</span>
                    )
                  })()}
                </div>
                <button
                  type="button"
                  onClick={() => removeExercise(ex.exerciseId)}
                  className="btn-remove"
                  aria-label="Remove exercise"
                >
                  ×
                </button>
              </div>
              <div className="sets-header sets-header-extended">
                <span>Set</span>
                <span>Reps</span>
                <span>Weight (lbs)</span>
                <span>Effort</span>
                <span>Form</span>
                <span></span>
              </div>
              {ex.sets.map((set, i) => {
                const isNewPR = prWeight > 0 && set.weight > prWeight
                return (
                  <div key={i} className="set-row set-row-extended">
                    <span className="set-num">{i + 1}</span>
                    <input
                      type="number"
                      min={1}
                      value={set.reps}
                      onChange={(e) => updateSet(ex.exerciseId, i, { reps: +e.target.value })}
                      className="input input-sm"
                    />
                    <div className="weight-cell">
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={set.weight || ''}
                        onChange={(e) => updateSet(ex.exerciseId, i, { weight: +e.target.value })}
                        className="input input-sm"
                        placeholder="0"
                      />
                      {isNewPR && <span className="pr-badge">PR</span>}
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={set.effort ?? ''}
                      onChange={(e) => updateSet(ex.exerciseId, i, { effort: e.target.value ? +e.target.value : undefined })}
                      className="input input-sm input-effort"
                      placeholder="1-5"
                      title="Effort (1-5)"
                    />
                    <input
                      type="number"
                      min={1}
                      max={5}
                      value={set.form ?? ''}
                      onChange={(e) => updateSet(ex.exerciseId, i, { form: e.target.value ? +e.target.value : undefined })}
                      className="input input-sm input-form"
                      placeholder="1-5"
                      title="Form (1-5)"
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
                )
              })}
              <button
                type="button"
                onClick={() => addSet(ex.exerciseId)}
                className="btn-add-set"
              >
                + Add set
              </button>
            </div>
          )
        })}
      </div>

      <div className={`form-actions ${isEditing ? 'form-actions-sticky' : ''}`}>
        {isEditing && onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || exercises.length === 0}
          className="btn btn-primary btn-save"
        >
          {isEditing ? 'Update Workout' : 'Save Workout'}
        </button>
      </div>
    </div>
  )
}
