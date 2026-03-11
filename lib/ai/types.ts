/**
 * AI-parsed workout structure.
 * The AI API will take free-form text (typed or voice) and return this structure.
 */

export interface ParsedSet {
  reps: number
  weight: number // lbs
  effort?: number // 1-5 how hard the set felt
  form?: number // 1-5 how good the form was
}

export interface ParsedExercise {
  exerciseName: string
  muscleGroup: string
  sets: ParsedSet[]
}

export interface ParsedWorkout {
  name: string
  exercises: ParsedExercise[]
}
