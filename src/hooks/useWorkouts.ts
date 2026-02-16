import { useState, useEffect, useCallback } from 'react'
import type { Workout } from '../types'

const STORAGE_KEY = 'takasimba-workouts'

export function useWorkouts() {
  const [workouts, setWorkouts] = useState<Workout[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        setWorkouts(JSON.parse(stored))
      }
    } catch {
      console.error('Failed to load workouts')
    }
  }, [])

  const addWorkout = useCallback(
    (workout: Workout) => {
      setWorkouts((prev) => {
        const next = [workout, ...prev]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        return next
      })
    },
    []
  )

  const deleteWorkout = useCallback((id: string) => {
    setWorkouts((prev) => {
      const next = prev.filter((w) => w.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  return { workouts, addWorkout, deleteWorkout }
}
