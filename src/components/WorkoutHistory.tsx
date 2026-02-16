import { format } from 'date-fns'
import type { Workout } from '../types'

function getWorkoutSummary(workout: Workout) {
  let totalSets = 0
  let totalVolume = 0

  workout.exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      totalSets++
      totalVolume += set.reps * set.weight
    })
  })

  return { totalSets, totalVolume }
}

export function WorkoutHistory({
  workouts,
  onDelete,
}: {
  workouts: Workout[]
  onDelete: (id: string) => void
}) {
  if (workouts.length === 0) {
    return (
      <div className="empty-state">
        <p>No workouts yet. Log your first hypertrophy session above!</p>
      </div>
    )
  }

  return (
    <div className="workout-history">
      {workouts.map((workout) => {
        const { totalSets, totalVolume } = getWorkoutSummary(workout)
        return (
          <div key={workout.id} className="workout-card">
            <div className="workout-card-header">
              <div>
                <h3>{workout.name}</h3>
                <span className="workout-date">
                  {format(new Date(workout.date), 'EEE, MMM d, yyyy')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onDelete(workout.id)}
                className="btn-remove"
                aria-label="Delete workout"
              >
                ×
              </button>
            </div>
            <div className="workout-stats">
              <span>{workout.exercises.length} exercises</span>
              <span>{totalSets} sets</span>
              <span>{totalVolume.toFixed(0)} kg volume</span>
            </div>
            <div className="workout-exercises">
              {workout.exercises.map((ex) => (
                <div key={ex.exerciseId} className="exercise-summary">
                  <span className="exercise-name">{ex.exerciseName}</span>
                  <span className="exercise-sets">
                    {ex.sets.map((s, i) => (
                      <span key={i} className="set-badge">
                        {s.reps}×{s.weight}kg
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
