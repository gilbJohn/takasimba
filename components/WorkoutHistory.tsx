'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Workout } from '@/lib/types'
import { getWorkoutSummary } from '@/lib/workout-stats'

const PAGE_SIZE = 20

export function WorkoutHistory({
  workouts,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  workouts: Workout[]
  onEdit: (workout: Workout) => void
  onDuplicate: (workout: Workout) => void
  onDelete: (id: string) => void
}) {
  const [page, setPage] = useState(1)

  if (workouts.length === 0) {
    return (
      <div className="empty-state">
        <p>No workouts yet. Log your first hypertrophy session above!</p>
      </div>
    )
  }

  const visible = workouts.slice(0, page * PAGE_SIZE)
  const hasMore = workouts.length > visible.length

  return (
    <div className="workout-history">
      {visible.map((workout) => {
        const { totalSets, totalVolume } = getWorkoutSummary(workout)
        return (
          <div key={workout.id} className="workout-card">
            <div className="workout-card-header">
              <div>
                <h3>{workout.name}</h3>
                <span className="workout-date">
                  {format(new Date(workout.date + 'T12:00:00'), 'EEE, MMM d, yyyy')}
                </span>
              </div>
              <div className="workout-card-actions">
                <button
                  type="button"
                  onClick={() => onDuplicate(workout)}
                  className="btn-duplicate"
                  aria-label="Repeat workout"
                >
                  Repeat
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(workout)}
                  className="btn-edit"
                  aria-label="Edit workout"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(workout.id)}
                  className="btn-remove"
                  aria-label="Delete workout"
                >
                  ×
                </button>
              </div>
            </div>
            <div className="workout-stats">
              <span>{workout.exercises.length} exercises</span>
              <span>{totalSets} sets</span>
              <span>{totalVolume.toFixed(0)} lbs volume</span>
            </div>
            {workout.notes && (
              <p className="workout-notes">{workout.notes}</p>
            )}
            <div className="workout-exercises">
              {workout.exercises.map((ex) => (
                <div key={ex.exerciseId} className="exercise-summary">
                  <span className="exercise-name">{ex.exerciseName}</span>
                  <span className="exercise-sets">
                    {ex.sets.map((s, i) => (
                      <span key={i} className="set-badge">
                        {s.reps}×{s.weight}lbs
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
      {hasMore && (
        <button
          type="button"
          className="btn-load-more"
          onClick={() => setPage((p) => p + 1)}
        >
          Load more ({workouts.length - visible.length} remaining)
        </button>
      )}
    </div>
  )
}
