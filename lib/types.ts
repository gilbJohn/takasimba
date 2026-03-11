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
  weight: number // lbs
  rpe?: number // 1-10 RPE scale
  effort?: number // 1-5 how hard the set felt
  form?: number // 1-5 how good the form was
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
  totalVolume: number // lbs (reps × weight)
  duration?: number // minutes
}
