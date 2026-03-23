'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useWorkouts } from '@/hooks/useWorkouts'
import { AuthForm } from '@/components/AuthForm'
import { MuscleGroupVolumeChart } from '@/components/MuscleGroupVolumeChart'
import Link from 'next/link'
import { format } from 'date-fns'
import { ProgressWorkoutList } from '@/components/ProgressWorkoutList'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Workout } from '@/lib/types'
import { getExerciseVolume, computePRs } from '@/lib/workout-stats'

function buildExerciseChartData(workouts: Workout[], exerciseName: string) {
  return workouts
    .map((w) => {
      const ex = w.exercises.find((e) => e.exerciseName === exerciseName)
      if (!ex) return null
      return {
        name: format(new Date(w.date + 'T12:00:00'), 'MMM d'),
        fullDate: w.date,
        workoutName: w.name,
        volume: getExerciseVolume(ex),
      }
    })
    .filter((d): d is NonNullable<typeof d> => d !== null)
}

export default function ProgressPage() {
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth()
  const { workouts, loading: workoutsLoading } = useWorkouts(user?.id)

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

  const exerciseNames = Array.from(
    new Set(workouts.flatMap((w) => w.exercises.map((e) => e.exerciseName)))
  ).sort()
  const effectiveExercise = selectedExercise || exerciseNames[0] || ''
  const exerciseData = effectiveExercise ? buildExerciseChartData(workouts, effectiveExercise) : []

  const prs = computePRs(workouts)
  const prList = Array.from(prs.entries())
    .map(([exerciseId, pr]) => {
      const name = workouts
        .flatMap((w) => w.exercises)
        .find((e) => e.exerciseId === exerciseId)?.exerciseName ?? exerciseId
      return { name, weight: pr.weight, date: pr.date }
    })
    .sort((a, b) => b.weight - a.weight)

  return (
    <div className="app">
      <header className="header header-with-signout">
        <div>
          <h1>Takasimba</h1>
          <p className="tagline">Hypertrophy Tracker</p>
        </div>
        <nav className="header-nav">
          <Link href="/" className="nav-link">
            Log
          </Link>
          <Link href="/progress" className="nav-link nav-link-active">
            Progress
          </Link>
          <button type="button" onClick={signOut} className="btn-sign-out">
            Sign out
          </button>
        </nav>
      </header>

      <main className="main">
        {workoutsLoading ? (
          <p className="loading">Loading…</p>
        ) : exerciseNames.length === 0 ? (
          <section className="section">
            <div className="empty-state">
              <p>No workouts yet. Log some workouts to see your progress!</p>
              <Link href="/" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                Log Workout
              </Link>
            </div>
          </section>
        ) : (
          <>
            <section className="section">
              <h2>Weekly Volume by Muscle Group</h2>
              <MuscleGroupVolumeChart workouts={workouts} />
            </section>

            <section className="section">
              <h2>Personal Records</h2>
              {prList.length === 0 ? (
                <p className="progress-empty-exercise">No PRs yet.</p>
              ) : (
                <div className="pr-list">
                  {prList.map((pr) => (
                    <div key={pr.name} className="pr-row">
                      <span className="pr-exercise-name">{pr.name}</span>
                      <span className="pr-exercise-weight">{pr.weight} lbs</span>
                      <span className="pr-exercise-date">
                        {format(new Date(pr.date + 'T12:00:00'), 'MMM d, yyyy')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="section">
              <h2>Progress by Exercise</h2>
              <div className="progress-exercise-select">
                <label htmlFor="exercise-select">Select exercise</label>
                <select
                  id="exercise-select"
                  value={effectiveExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="exercise-select"
                >
                  {exerciseNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              {exerciseData.length > 0 ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={exerciseData}
                      margin={{ top: 20, right: 20, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis
                        dataKey="name"
                        stroke="var(--text-muted)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                      />
                      <YAxis
                        stroke="var(--text-muted)"
                        tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                        tickFormatter={(v) => v.toLocaleString()}
                      />
                      <Tooltip
                        contentStyle={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                        labelStyle={{ color: 'var(--text-primary)' }}
                        formatter={(value: number | undefined) => [`${(value ?? 0).toLocaleString()} lbs`, 'Volume']}
                        labelFormatter={(_, payload) =>
                          payload[0]?.payload?.workoutName
                            ? `${payload[0].payload.workoutName} (${payload[0].payload.name})`
                            : ''
                        }
                      />
                      <Bar
                        dataKey="volume"
                        fill="var(--accent-hover)"
                        radius={[4, 4, 0, 0]}
                        name="Volume (lbs)"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="progress-empty-exercise">
                  No data for {effectiveExercise} yet.
                </p>
              )}
            </section>

            <section className="section" style={{ marginTop: '2rem' }}>
              <h2>Workouts</h2>
              <p className="progress-workouts-intro">
                Click a workout to see details
              </p>
              <ProgressWorkoutList workouts={workouts} />
            </section>
          </>
        )}
      </main>
    </div>
  )
}
