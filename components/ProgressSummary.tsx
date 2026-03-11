'use client'

import { startOfWeek, startOfMonth } from 'date-fns'
import type { Workout } from '@/lib/types'
import { getWorkoutsStats } from '@/lib/workout-stats'

export function ProgressSummary({ workouts }: { workouts: Workout[] }) {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)

  const thisWeek = getWorkoutsStats(workouts, weekStart, now)
  const thisMonth = getWorkoutsStats(workouts, monthStart, now)

  return (
    <div className="progress-summary">
      <div className="progress-summary-card">
        <span className="progress-label">This week</span>
        <span className="progress-value">{thisWeek.count} workouts</span>
        <span className="progress-detail">
          {thisWeek.totalSets} sets · {thisWeek.totalVolume.toLocaleString()} lbs
        </span>
      </div>
      <div className="progress-summary-card">
        <span className="progress-label">This month</span>
        <span className="progress-value">{thisMonth.count} workouts</span>
        <span className="progress-detail">
          {thisMonth.totalSets} sets · {thisMonth.totalVolume.toLocaleString()} lbs
        </span>
      </div>
    </div>
  )
}
