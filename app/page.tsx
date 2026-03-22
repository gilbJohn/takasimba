'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { WorkoutForm } from '@/components/WorkoutForm'
import { WorkoutHistory } from '@/components/WorkoutHistory'
import { ProgressSummary } from '@/components/ProgressSummary'
import { QuickLogInput } from '@/components/QuickLogInput'
import { AuthForm } from '@/components/AuthForm'
import { useAuth } from '@/hooks/useAuth'
import { useWorkouts } from '@/hooks/useWorkouts'
import type { Workout } from '@/lib/types'

export default function Home() {
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const { workouts, addWorkout, updateWorkout, deleteWorkout, loading: workoutsLoading, error, retry } = useWorkouts(user?.id)
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null)
  const [duplicatingWorkout, setDuplicatingWorkout] = useState<Workout | null>(null)
  const [parsedWorkout, setParsedWorkout] = useState<Workout | null>(null)
  const [showQuickLog, setShowQuickLog] = useState(false)
  const formSectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (editingWorkout || parsedWorkout) {
      formSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [editingWorkout, parsedWorkout])

  const handleSave = (workout: Workout) => {
    if (editingWorkout && workout.id === editingWorkout.id) {
      updateWorkout(workout)
      setEditingWorkout(null)
    } else {
      addWorkout(workout)
      setDuplicatingWorkout(null)
      setParsedWorkout(null)
    }
  }

  const handleDuplicate = (workout: Workout) => {
    setEditingWorkout(null)
    setParsedWorkout(null)
    setDuplicatingWorkout({
      ...workout,
      id: crypto.randomUUID(),
      date: format(new Date(), 'yyyy-MM-dd'),
    })
  }

  const handleWorkoutParsed = (workout: Workout) => {
    setEditingWorkout(null)
    setDuplicatingWorkout(null)
    setParsedWorkout(workout)
    setShowQuickLog(false)
  }

  if (authLoading) {
    return (
      <div className="app">
        <header className="header">
          <h1>Takasimba</h1>
          <p className="tagline">Hypertrophy Tracker</p>
        </header>
        <p className="loading">Loading…</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app">
        <header className="header">
          <h1>Takasimba</h1>
          <p className="tagline">Hypertrophy Tracker</p>
        </header>
        <main className="main">
          <AuthForm onSignIn={signIn} onSignUp={signUp} />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header header-with-signout">
        <div>
          <h1>Takasimba</h1>
          <p className="tagline">Hypertrophy Tracker</p>
        </div>
        <nav className="header-nav">
          <Link href="/" className="nav-link nav-link-active">
            Log
          </Link>
          <Link href="/progress" className="nav-link">
            Progress
          </Link>
          <button type="button" onClick={signOut} className="btn-sign-out">
            Sign out
          </button>
        </nav>
      </header>

      <main className="main">
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button type="button" onClick={retry} className="btn-retry">
              Retry
            </button>
          </div>
        )}
        {workoutsLoading ? (
          <p className="loading">Loading workouts…</p>
        ) : (
          <>
            <section className="section">
              <h2>Your Progress</h2>
              <ProgressSummary workouts={workouts} />
            </section>

            <section className="section">
              <div className="quick-log-toggle">
                <button
                  type="button"
                  onClick={() => setShowQuickLog(!showQuickLog)}
                  className={`btn btn-secondary ${showQuickLog ? 'active' : ''}`}
                >
                  {showQuickLog ? 'Hide' : 'Quick log'} (type or voice → AI)
                </button>
              </div>
              {showQuickLog && (
                <QuickLogInput
                  onWorkoutParsed={handleWorkoutParsed}
                  onCancel={() => setShowQuickLog(false)}
                />
              )}
            </section>

            <section ref={formSectionRef} className="section">
              <h2>
                {editingWorkout ? 'Edit Workout' : parsedWorkout ? 'Review & save (from AI)' : duplicatingWorkout ? 'Log Workout (from copy)' : 'Log Workout'}
              </h2>
              <WorkoutForm
                onSave={handleSave}
                initialWorkout={editingWorkout ?? duplicatingWorkout ?? parsedWorkout}
                onCancel={
                  editingWorkout
                    ? () => setEditingWorkout(null)
                    : duplicatingWorkout
                      ? () => setDuplicatingWorkout(null)
                      : parsedWorkout
                        ? () => setParsedWorkout(null)
                        : undefined
                }
                pastWorkouts={workouts}
              />
            </section>

            <section className="section">
              <h2>Workout History</h2>
              <WorkoutHistory
                workouts={workouts}
                onEdit={(w) => setEditingWorkout(w)}
                onDuplicate={handleDuplicate}
                onDelete={deleteWorkout}
              />
            </section>
          </>
        )}
      </main>
    </div>
  )
}
