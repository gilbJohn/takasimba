'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Exercise, MuscleGroup } from '@/lib/types'

interface DbCustomExercise {
  id: string
  name: string
  muscle_group: string
  equipment: string
}

function toExercise(row: DbCustomExercise): Exercise {
  return {
    id: row.id,
    name: row.name,
    muscleGroup: row.muscle_group as MuscleGroup,
    equipment: row.equipment,
  }
}

export function useCustomExercises(userId: string | undefined) {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!userId) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from('custom_exercises')
      .select('id, name, muscle_group, equipment')
      .eq('user_id', userId)
      .order('name', { ascending: true })
    if (!error && data) {
      setCustomExercises(data.map(toExercise))
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setCustomExercises([])
      setLoading(false)
      return
    }
    load()
  }, [userId, load])

  const addCustomExercise = useCallback(async (
    name: string,
    muscleGroup: MuscleGroup,
    equipment: string
  ): Promise<Exercise> => {
    if (!userId) throw new Error('Not authenticated')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('custom_exercises')
      .insert({ user_id: userId, name: name.trim(), muscle_group: muscleGroup, equipment: equipment.trim() || 'Other' })
      .select('id, name, muscle_group, equipment')
      .single()
    if (error) throw error
    const exercise = toExercise(data)
    setCustomExercises((prev) => [...prev, exercise].sort((a, b) => a.name.localeCompare(b.name)))
    return exercise
  }, [userId])

  const deleteCustomExercise = useCallback(async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from('custom_exercises').delete().eq('id', id)
    if (error) throw error
    setCustomExercises((prev) => prev.filter((e) => e.id !== id))
  }, [])

  return { customExercises, addCustomExercise, deleteCustomExercise, loading }
}
