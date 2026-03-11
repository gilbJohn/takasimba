-- =============================================================================
-- Takasimba Lifting App - Complete Schema
-- =============================================================================
-- Copy this entire file into Supabase: SQL Editor → New query → Paste → Run
-- For a FRESH project: Run as-is. For existing data: Skip the DROP lines below.
-- =============================================================================

-- Clean slate (optional - removes existing workout data; comment out if you have data to keep)
DROP TABLE IF EXISTS sets CASCADE;
DROP TABLE IF EXISTS exercise_logs CASCADE;
DROP TABLE IF EXISTS workouts CASCADE;

-- Enable UUID extension (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Workouts table (one per session)
CREATE TABLE workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  name TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Exercise logs (exercises within a workout)
CREATE TABLE exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id TEXT NOT NULL,
  exercise_name TEXT NOT NULL,
  muscle_group TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

-- Sets (individual set data for each exercise)
CREATE TABLE sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_log_id UUID NOT NULL REFERENCES exercise_logs(id) ON DELETE CASCADE,
  reps INT NOT NULL,
  weight NUMERIC(6,2) NOT NULL DEFAULT 0,
  rpe INT CHECK (rpe >= 1 AND rpe <= 10),
  effort INT CHECK (effort >= 1 AND effort <= 5),
  form INT CHECK (form >= 1 AND form <= 5),
  set_order INT NOT NULL DEFAULT 0
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_workouts_user_date ON workouts(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_exercise_logs_workout ON exercise_logs(workout_id);
CREATE INDEX IF NOT EXISTS idx_sets_exercise_log ON sets(exercise_log_id);

-- Row Level Security (RLS)
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sets ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own data
DROP POLICY IF EXISTS "Users can view own workouts" ON workouts;
CREATE POLICY "Users can view own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own workouts" ON workouts;
CREATE POLICY "Users can insert own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own workouts" ON workouts;
CREATE POLICY "Users can update own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own workouts" ON workouts;
CREATE POLICY "Users can delete own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage exercise_logs for own workouts" ON exercise_logs;
CREATE POLICY "Users can manage exercise_logs for own workouts"
  ON exercise_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = exercise_logs.workout_id
      AND workouts.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = exercise_logs.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can manage sets for own workouts" ON sets;
CREATE POLICY "Users can manage sets for own workouts"
  ON sets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM exercise_logs el
      JOIN workouts w ON w.id = el.workout_id
      WHERE el.id = sets.exercise_log_id
      AND w.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_logs el
      JOIN workouts w ON w.id = el.workout_id
      WHERE el.id = sets.exercise_log_id
      AND w.user_id = auth.uid()
    )
  );
