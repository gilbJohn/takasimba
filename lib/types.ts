export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'biceps'
  | 'triceps'
  | 'quads'
  | 'hamstrings'
  | 'glutes'
  | 'calves'
  | 'core'

export interface Exercise {
  id: string
  name: string
  muscleGroup: MuscleGroup
  equipment?: string
}

export interface SetLog {
  reps: number
  weight: number // kg
  rpe?: number // 1-10 RPE scale
}

export interface ExerciseLog {
  exerciseId: string
  exerciseName: string
  muscleGroup: MuscleGroup
  sets: SetLog[]
}

export interface Workout {
  id: string
  date: string // ISO date
  name: string
  exercises: ExerciseLog[]
  notes?: string
}

export interface WorkoutSummary {
  totalSets: number
  totalVolume: number // kg
  duration?: number // minutes
}
