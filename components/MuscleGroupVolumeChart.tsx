'use client'

import { useState } from 'react'
import { startOfWeek, endOfWeek, addWeeks, subWeeks, format } from 'date-fns'
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
import { getMuscleGroupVolumeByWeek } from '@/lib/workout-stats'

function formatMuscleGroup(group: string) {
  return group.charAt(0).toUpperCase() + group.slice(1)
}

export function MuscleGroupVolumeChart({ workouts }: { workouts: Workout[] }) {
  const [weekRef, setWeekRef] = useState(() => new Date())

  const weekStart = startOfWeek(weekRef, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(weekRef, { weekStartsOn: 1 })

  const volumeByGroup = getMuscleGroupVolumeByWeek(workouts, weekStart, weekEnd)

  const data = Object.entries(volumeByGroup)
    .map(([muscleGroup, volume]) => ({ muscleGroup: formatMuscleGroup(muscleGroup), volume }))
    .sort((a, b) => b.volume - a.volume)

  const weekLabel = `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`

  return (
    <div>
      <div className="muscle-chart-nav">
        <button
          type="button"
          className="btn btn-secondary muscle-chart-nav-btn"
          onClick={() => setWeekRef((d) => subWeeks(d, 1))}
        >
          ‹ Prev
        </button>
        <span className="muscle-chart-week-label">{weekLabel}</span>
        <button
          type="button"
          className="btn btn-secondary muscle-chart-nav-btn"
          onClick={() => setWeekRef((d) => addWeeks(d, 1))}
        >
          Next ›
        </button>
      </div>

      {data.length === 0 ? (
        <p className="progress-empty-exercise">No workouts logged this week.</p>
      ) : (
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data} margin={{ top: 16, right: 16, left: 16, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                dataKey="muscleGroup"
                stroke="var(--text-muted)"
                tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
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
              />
              <Bar dataKey="volume" fill="var(--accent)" radius={[4, 4, 0, 0]} name="Volume (lbs)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
