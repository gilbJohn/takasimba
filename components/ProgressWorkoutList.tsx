'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import type { Workout } from '@/lib/types'
import { getWorkoutSummary } from '@/lib/workout-stats'

export function ProgressWorkoutList({ workouts }: { workouts: Workout[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (workouts.length === 0) return null

  return (
    <div className="progress-workout-list">
      {workouts.map((workout) => {
        const { totalSets, totalVolume } = getWorkoutSummary(workout)
        const isExpanded = expandedId === workout.id

        return (
          <div
            key={workout.id}
            className={`progress-workout-card ${isExpanded ? 'expanded' : ''}`}
          >
            <button
              type="button"
              className="progress-workout-trigger"
              onClick={() => setExpandedId(isExpanded ? null : workout.id)}
              aria-expanded={isExpanded}
            >
              <span className="progress-workout-date">
                {format(new Date(workout.date), 'MMM d')}
              </span>
              <span className="progress-workout-name">{workout.name}</span>
              <span className="progress-workout-meta">
                {workout.exercises.length} exercises · {totalSets} sets ·{' '}
                {totalVolume.toLocaleString()} lbs
              </span>
              <span className="progress-workout-chevron" aria-hidden>
                {isExpanded ? '−' : '+'}
              </span>
            </button>

            {isExpanded && (
              <div className="progress-workout-detail">
                {workout.exercises.map((ex) => {
                  const exVol = ex.sets.reduce(
                    (s, set) => s + set.reps * set.weight,
                    0
                  )
                  return (
                    <div key={ex.exerciseId} className="progress-exercise-row">
                      <div className="progress-exercise-header">
                        <span className="progress-exercise-name">
                          {ex.exerciseName}
                        </span>
                        <span className="progress-exercise-volume">
                          {exVol.toLocaleString()} lbs
                        </span>
                      </div>
                      <div className="progress-sets-row">
                        {ex.sets.map((s, i) => (
                          <span key={i} className="progress-set-badge">
                            {s.reps}×{s.weight} lbs
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
