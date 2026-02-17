'use client'

import { WorkoutForm } from '@/components/WorkoutForm'
import { WorkoutHistory } from '@/components/WorkoutHistory'
import { useWorkouts } from '@/hooks/useWorkouts'

export default function Home() {
  const { workouts, addWorkout, deleteWorkout } = useWorkouts()

  return (
    <div className="app">
      <header className="header">
        <h1>Takasimba</h1>
        <p className="tagline">Hypertrophy Tracker</p>
      </header>

      <main className="main">
        <section className="section">
          <h2>Log Workout</h2>
          <WorkoutForm onSave={addWorkout} />
        </section>

        <section className="section">
          <h2>Workout History</h2>
          <WorkoutHistory workouts={workouts} onDelete={deleteWorkout} />
        </section>
      </main>
    </div>
  )
}
