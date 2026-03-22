import type { SupabaseClient } from '@supabase/supabase-js'
import type { Workout, ExerciseLog, SetLog } from '@/lib/types'

export interface DbWorkout {
  id: string
  user_id: string
  date: string
  name: string
  notes: string | null
  created_at: string
}

export interface DbExerciseLog {
  id: string
  workout_id: string
  exercise_id: string
  exercise_name: string
  muscle_group: string
  sort_order: number
}

export interface DbSet {
  id: string
  exercise_log_id: string
  reps: number
  weight: number
  rpe: number | null
  effort: number | null
  form: number | null
  set_order: number
}

export async function fetchWorkouts(supabase: SupabaseClient, userId: string): Promise<Workout[]> {
  const { data: workoutsData, error: workoutsError } = await supabase
    .from('workouts')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (workoutsError) throw workoutsError
  if (!workoutsData?.length) return []

  const workoutIds = workoutsData.map((w) => w.id)

  const { data: exerciseLogsData, error: logsError } = await supabase
    .from('exercise_logs')
    .select('*')
    .in('workout_id', workoutIds)
    .order('sort_order', { ascending: true })

  if (logsError) throw logsError

  const exerciseLogIds = (exerciseLogsData ?? []).map((el) => el.id)

  const { data: setsData, error: setsError } = await supabase
    .from('sets')
    .select('*')
    .in('exercise_log_id', exerciseLogIds)
    .order('set_order', { ascending: true })

  if (setsError) throw setsError

  return workoutsData.map((w: DbWorkout) => {
    const logs = (exerciseLogsData ?? []).filter((el: DbExerciseLog) => el.workout_id === w.id)
    const exercises: ExerciseLog[] = logs.map((el: DbExerciseLog) => {
      const sets = (setsData ?? []).filter((s: DbSet) => s.exercise_log_id === el.id)
      return {
        exerciseId: el.exercise_id,
        exerciseName: el.exercise_name,
        muscleGroup: el.muscle_group as ExerciseLog['muscleGroup'],
        sets: sets.map((s: DbSet) => ({
          reps: s.reps,
          weight: s.weight,
          ...(s.rpe != null && { rpe: s.rpe }),
          ...(s.effort != null && { effort: s.effort }),
          ...(s.form != null && { form: s.form }),
        })),
      }
    })
    return {
      id: w.id,
      date: w.date,
      name: w.name,
      exercises,
      ...(w.notes && { notes: w.notes }),
    }
  })
}

async function insertExerciseLogs(
  supabase: SupabaseClient,
  workoutId: string,
  exercises: ExerciseLog[]
): Promise<void> {
  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    const { data: logRow, error: logError } = await supabase
      .from('exercise_logs')
      .insert({
        workout_id: workoutId,
        exercise_id: ex.exerciseId,
        exercise_name: ex.exerciseName,
        muscle_group: ex.muscleGroup,
        sort_order: i,
      })
      .select('id')
      .single()

    if (logError) throw logError

    const setsToInsert = ex.sets
      .filter((s) => s.reps > 0 || s.weight > 0)
      .map((s, j) => ({
        exercise_log_id: logRow.id,
        reps: s.reps,
        weight: s.weight,
        rpe: s.rpe ?? null,
        effort: s.effort ?? null,
        form: s.form ?? null,
        set_order: j,
      }))

    if (setsToInsert.length > 0) {
      const { error: setsError } = await supabase.from('sets').insert(setsToInsert)
      if (setsError) throw setsError
    }
  }
}

export async function insertWorkout(
  supabase: SupabaseClient,
  userId: string,
  workout: Workout
): Promise<void> {
  const { error: workoutError } = await supabase
    .from('workouts')
    .insert({
      id: workout.id,
      user_id: userId,
      date: workout.date,
      name: workout.name,
      notes: workout.notes ?? null,
    })

  if (workoutError) throw workoutError

  await insertExerciseLogs(supabase, workout.id, workout.exercises)
}

export async function updateWorkout(
  supabase: SupabaseClient,
  workout: Workout
): Promise<void> {
  const { error: updateError } = await supabase
    .from('workouts')
    .update({
      date: workout.date,
      name: workout.name,
      notes: workout.notes ?? null,
    })
    .eq('id', workout.id)

  if (updateError) throw updateError

  const { error: deleteLogsError } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('workout_id', workout.id)

  if (deleteLogsError) throw deleteLogsError

  await insertExerciseLogs(supabase, workout.id, workout.exercises)
}

export async function deleteWorkout(supabase: SupabaseClient, workoutId: string): Promise<void> {
  const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
  if (error) throw error
}
