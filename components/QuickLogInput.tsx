'use client'

import { useState, useRef, useCallback } from 'react'
import { parseWorkoutWithAI } from '@/lib/ai/parseWorkout'
import type { Workout, ExerciseLog } from '@/lib/types'
import { DEFAULT_EXERCISES } from '@/lib/data/exercises'
import { format } from 'date-fns'

interface QuickLogInputProps {
  onWorkoutParsed: (workout: Workout) => void
  onCancel?: () => void
}

export function QuickLogInput({ onWorkoutParsed, onCancel }: QuickLogInputProps) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const [isListening, setIsListening] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const handleParse = useCallback(async () => {
    if (!text.trim()) return

    setError(null)
    setLoading(true)

    try {
      const parsed = await parseWorkoutWithAI(text.trim())

      const exerciseAliases: Record<string, string> = {
        'chest supported row': 'Chest Supported Row',
        'weighted pull up': 'Pull Up',
        'pull up': 'Pull Up',
        'dip': 'Dip',
        'tricep pushdown': 'Tricep Pushdown',
        'tricep pushdowns': 'Tricep Pushdown',
        'barbell curl': 'Barbell Curl',
        'bicep curl': 'Barbell Curl',
        'bicep curls': 'Barbell Curl',
        'rear delt fly': 'Rear Delt Fly',
        'reverse delt fly': 'Reverse Delt Fly',
        'reverse delt flys': 'Reverse Delt Fly',
        'lateral raise': 'Lateral Raise',
        'side delt fly': 'Lateral Raise',
        'side delt flys': 'Lateral Raise',
        'bench press': 'Bench Press',
      }

      const exercises: ExerciseLog[] = parsed.exercises.map((ex) => {
        const nameLower = ex.exerciseName.toLowerCase().trim()
        const aliasName = exerciseAliases[nameLower] ?? ex.exerciseName
        const match = DEFAULT_EXERCISES.find(
          (e) =>
            e.name.toLowerCase() === aliasName.toLowerCase() ||
            e.name.toLowerCase() === ex.exerciseName.toLowerCase()
        )
        const exerciseId = match?.id ?? ex.exerciseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const exerciseName = match?.name ?? ex.exerciseName

        return {
          exerciseId,
          exerciseName,
          muscleGroup: ex.muscleGroup as ExerciseLog['muscleGroup'],
          sets: ex.sets.map((s) => ({
            reps: s.reps,
            weight: s.weight,
            ...(s.effort != null && { effort: s.effort }),
            ...(s.form != null && { form: s.form }),
          })),
        }
      })

      const workout: Workout = {
        id: crypto.randomUUID(),
        date: format(new Date(), 'yyyy-MM-dd'),
        name: parsed.name,
        exercises: exercises.filter((e) => e.sets.length > 0),
      }

      onWorkoutParsed(workout)
      setText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse workout')
    } finally {
      setLoading(false)
    }
  }, [text, onWorkoutParsed])

  const toggleVoice = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setError('Voice input is not supported in this browser')
      return
    }

    const SpeechRecognitionAPI =
      (window as typeof window & { webkitSpeechRecognition?: typeof SpeechRecognition })
        .webkitSpeechRecognition ?? (window as typeof window & { SpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition

    if (!SpeechRecognitionAPI) {
      setError('Voice input is not supported')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const last = event.results[event.results.length - 1]
      const transcript = last[0].transcript
      if (last.isFinal) {
        setText((prev) => prev + transcript + ' ')
      }
    }

    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [isListening])

  return (
    <div className="quick-log">
      <label htmlFor="quick-log-input" className="quick-log-label">
        Describe your workout (type or use voice)
      </label>
      <div className="quick-log-row">
        <textarea
          ref={textareaRef}
          id="quick-log-input"
          value={text}
          onChange={handleTextChange}
          placeholder="e.g. Bench press 3 sets of 10 at 135 lbs, felt easy. Squats 4x8 at 185 lbs, form was good."
          className="quick-log-input"
          rows={3}
          disabled={loading}
        />
        <button
          type="button"
          onClick={toggleVoice}
          className={`btn-voice ${isListening ? 'listening' : ''}`}
          aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          title={isListening ? 'Stop listening' : 'Voice input'}
        >
          {isListening ? '⏹' : '🎤'}
        </button>
      </div>
      {error && <div className="quick-log-error">{error}</div>}
      <div className="quick-log-actions">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            Cancel
          </button>
        )}
        <button
          type="button"
          onClick={handleParse}
          disabled={!text.trim() || loading}
          className="btn btn-primary"
        >
          {loading ? 'Parsing…' : 'Parse with AI'}
        </button>
      </div>
      <p className="quick-log-hint">
        AI will extract exercises, sets, reps, weight, effort (1–5), and form (1–5). You can edit the result before saving.
      </p>
    </div>
  )
}
