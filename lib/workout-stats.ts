import type { Workout } from '@/lib/types'

export function getWorkoutVolume(workout: Workout): number {
  let volume = 0
  workout.exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      volume += set.reps * set.weight
    })
  })
  return volume
}

export function getExerciseVolume(exercise: { sets: { reps: number; weight: number }[] }): number {
  return exercise.sets.reduce((sum, s) => sum + s.reps * s.weight, 0)
}

export function getWorkoutSummary(workout: Workout) {
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

export function getWorkoutsStats(
  workouts: Workout[],
  startDate: Date,
  endDate: Date
) {
  const filtered = workouts.filter((w) => {
    const d = new Date(w.date)
    return d >= startDate && d <= endDate
  })
  let totalVolume = 0
  let totalSets = 0
  filtered.forEach((w) => {
    const s = getWorkoutSummary(w)
    totalSets += s.totalSets
    totalVolume += s.totalVolume
  })
  return { count: filtered.length, totalSets, totalVolume }
}
