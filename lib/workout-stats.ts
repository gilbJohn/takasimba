import type { Workout } from '@/lib/types'

export function computePRs(workouts: Workout[]): Map<string, { weight: number; date: string }> {
  const prs = new Map<string, { weight: number; date: string }>()
  for (const workout of workouts) {
    for (const ex of workout.exercises) {
      const maxWeight = Math.max(...ex.sets.map((s) => s.weight), 0)
      if (maxWeight <= 0) continue
      const current = prs.get(ex.exerciseId)
      if (!current || maxWeight > current.weight) {
        prs.set(ex.exerciseId, { weight: maxWeight, date: workout.date })
      }
    }
  }
  return prs
}

export function getMuscleGroupVolumeByWeek(
  workouts: Workout[],
  weekStart: Date,
  weekEnd: Date
): Record<string, number> {
  const result: Record<string, number> = {}
  for (const w of workouts) {
    const d = new Date(w.date + 'T12:00:00')
    if (d < weekStart || d > weekEnd) continue
    for (const ex of w.exercises) {
      const vol = getExerciseVolume(ex)
      result[ex.muscleGroup] = (result[ex.muscleGroup] ?? 0) + vol
    }
  }
  return result
}

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
  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0)
  return { totalSets, totalVolume: getWorkoutVolume(workout) }
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
