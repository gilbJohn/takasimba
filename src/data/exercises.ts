import type { Exercise } from '../types'

export const DEFAULT_EXERCISES: Exercise[] = [
  // Chest
  { id: 'bench-press', name: 'Bench Press', muscleGroup: 'chest', equipment: 'Barbell' },
  { id: 'incline-bench', name: 'Incline Bench Press', muscleGroup: 'chest', equipment: 'Barbell' },
  { id: 'dumbbell-fly', name: 'Dumbbell Fly', muscleGroup: 'chest', equipment: 'Dumbbell' },
  { id: 'cable-crossover', name: 'Cable Crossover', muscleGroup: 'chest', equipment: 'Cable' },
  { id: 'push-up', name: 'Push Up', muscleGroup: 'chest', equipment: 'Bodyweight' },
  // Back
  { id: 'deadlift', name: 'Deadlift', muscleGroup: 'back', equipment: 'Barbell' },
  { id: 'barbell-row', name: 'Barbell Row', muscleGroup: 'back', equipment: 'Barbell' },
  { id: 'pull-up', name: 'Pull Up', muscleGroup: 'back', equipment: 'Bodyweight' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'Cable' },
  { id: 'face-pull', name: 'Face Pull', muscleGroup: 'back', equipment: 'Cable' },
  // Shoulders
  { id: 'ohp', name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'Barbell' },
  { id: 'lateral-raise', name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'Dumbbell' },
  { id: 'rear-delt-fly', name: 'Rear Delt Fly', muscleGroup: 'shoulders', equipment: 'Dumbbell' },
  { id: 'arnold-press', name: 'Arnold Press', muscleGroup: 'shoulders', equipment: 'Dumbbell' },
  // Biceps
  { id: 'barbell-curl', name: 'Barbell Curl', muscleGroup: 'biceps', equipment: 'Barbell' },
  { id: 'hammer-curl', name: 'Hammer Curl', muscleGroup: 'biceps', equipment: 'Dumbbell' },
  { id: 'preacher-curl', name: 'Preacher Curl', muscleGroup: 'biceps', equipment: 'Barbell' },
  // Triceps
  { id: 'tricep-pushdown', name: 'Tricep Pushdown', muscleGroup: 'triceps', equipment: 'Cable' },
  { id: 'skull-crusher', name: 'Skull Crusher', muscleGroup: 'triceps', equipment: 'Barbell' },
  { id: 'dip', name: 'Dip', muscleGroup: 'triceps', equipment: 'Bodyweight' },
  // Legs
  { id: 'squat', name: 'Squat', muscleGroup: 'quads', equipment: 'Barbell' },
  { id: 'leg-press', name: 'Leg Press', muscleGroup: 'quads', equipment: 'Machine' },
  { id: 'leg-extension', name: 'Leg Extension', muscleGroup: 'quads', equipment: 'Machine' },
  { id: 'romanian-deadlift', name: 'Romanian Deadlift', muscleGroup: 'hamstrings', equipment: 'Barbell' },
  { id: 'leg-curl', name: 'Leg Curl', muscleGroup: 'hamstrings', equipment: 'Machine' },
  { id: 'hip-thrust', name: 'Hip Thrust', muscleGroup: 'glutes', equipment: 'Barbell' },
  { id: 'calf-raise', name: 'Calf Raise', muscleGroup: 'calves', equipment: 'Machine' },
  // Core
  { id: 'plank', name: 'Plank', muscleGroup: 'core', equipment: 'Bodyweight' },
  { id: 'cable-crunch', name: 'Cable Crunch', muscleGroup: 'core', equipment: 'Cable' },
]
