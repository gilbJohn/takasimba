'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchWorkouts, insertWorkout, updateWorkout as updateWorkoutDb, deleteWorkout } from '@/lib/supabase/workouts'
import type { Session } from '@supabase/supabase-js'
import type { Workout } from '@/lib/types'

export function useWorkouts(userId: string | undefined) {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const loadIdRef = useRef(0)

  const loadWorkouts = useCallback(async () => {
    if (!userId) return

    setError(null)
    setLoading(true)
    const thisLoadId = ++loadIdRef.current

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url?.trim() || !key?.trim()) {
      setError('Missing Supabase env vars. Check .env.local')
      setLoading(false)
      return
    }

    const supabase = createClient()

    try {
      const data = await fetchWorkouts(supabase, userId)
      // Ignore stale responses (e.g. from Strict Mode double-mount)
      if (thisLoadId === loadIdRef.current) {
        setWorkouts(data)
      }
    } catch (err) {
      if (thisLoadId === loadIdRef.current) {
        const message = err instanceof Error ? err.message : 'Failed to load workouts'
        setError(message)
        console.error('[useWorkouts]', err)
      }
    } finally {
      if (thisLoadId === loadIdRef.current) setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) {
      setWorkouts([])
      setLoading(false)
      setError(null)
      return
    }

    loadWorkouts()

    const supabase = createClient()
    const onVisible = () => {
      if (document.visibilityState === 'visible') loadWorkouts()
    }
    document.addEventListener('visibilitychange', onVisible)

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: string, session: Session | null) => {
      // Reload on sign-in, sign-out, and INITIAL_SESSION (page reload with existing session)
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (session?.user?.id === userId) loadWorkouts()
      } else if (event === 'SIGNED_OUT') {
        setWorkouts([])
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      subscription.unsubscribe()
    }
  }, [userId, loadWorkouts])

  const addWorkout = useCallback(async (workout: Workout) => {
    if (!userId) return

    const supabase = createClient()
    try {
      await insertWorkout(supabase, userId, workout)
      setWorkouts((prev) => [workout, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save workout')
    }
  }, [userId])

  const updateWorkout = useCallback(async (workout: Workout) => {
    const supabase = createClient()
    try {
      await updateWorkoutDb(supabase, workout)
      setWorkouts((prev) =>
        prev.map((w) => (w.id === workout.id ? workout : w))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workout')
    }
  }, [])

  const removeWorkout = useCallback(async (id: string) => {
    const supabase = createClient()
    try {
      await deleteWorkout(supabase, id)
      setWorkouts((prev) => prev.filter((w) => w.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workout')
    }
  }, [])

  return { workouts, addWorkout, updateWorkout, deleteWorkout: removeWorkout, loading, error, retry: loadWorkouts }
}
