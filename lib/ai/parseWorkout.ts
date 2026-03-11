import type { ParsedWorkout } from './types'

export async function parseWorkoutWithAI(text: string): Promise<ParsedWorkout> {
  if (!text.trim()) {
    throw new Error('Please enter a workout description')
  }

  const response = await fetch('/api/parse-workout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.trim() }),
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error ?? 'Failed to parse workout')
  }

  return data as ParsedWorkout
}
