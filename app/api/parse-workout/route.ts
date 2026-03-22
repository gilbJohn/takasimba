import { NextResponse } from 'next/server'

const SYSTEM_PROMPT = `You parse workout descriptions into JSON. Return ONLY valid JSON, no markdown, no code blocks.

EXACT output format (effort and form optional, 1-5 scale):
{"name":"string","exercises":[{"exerciseName":"string","muscleGroup":"string","sets":[{"reps":number,"weight":number,"effort":1-5,"form":1-5}]}]}
EFFORT: 1=easy, 5=max. Infer from "easy","hard","struggled" etc. Default 3 if unclear.
FORM: 1=poor, 5=perfect. Infer from "good form","sloppy" etc. Default 4 if unclear.

EXERCISE NAME MAPPINGS (use these exact names):
- bench press → Bench Press
- dips → Dip
- chest supported rows, chest supported row → Chest Supported Row
- weighted pullups, pullups, pull ups → Pull Up
- tricep pushdowns, tricep pushdown → Tricep Pushdown
- bicep curls, bicep curl → Barbell Curl
- reverse delt flys, rear delt flys → Rear Delt Fly
- side delt flys, lateral raises → Lateral Raise

MUSCLE GROUPS (use exactly): chest, back, shoulders, biceps, triceps, quads, hamstrings, glutes, calves, core

WEIGHT: Use pounds (lbs) as-is. "95 pounds" = 95, "65 pounds" = 65. No conversion.

SETS: Create one object per set. If "2 sets 8 and 6 reps" → two sets: {reps:8, weight:X}, {reps:6, weight:X}.
If "12 reps then 8 reps" → two sets with same weight.
If "15 reps each" for 2 sets → two identical sets.

ORDER: Keep exercises in the order the user listed them.`

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid text' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
    }

    const modelEndpoints = [
      'v1beta/models/gemini-2.5-flash',
      'v1beta/models/gemini-2.0-flash',
      'v1beta/models/gemini-2.0-flash-001',
      'v1beta/models/gemini-2.0-flash-lite',
      'v1beta/models/gemini-2.0-flash-lite-001',
      'v1beta/models/gemini-2.5-pro',
      'v1beta/models/gemini-exp-1206',
    ]

    const requestBody = JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nUser input:\n${text}` }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
      },
    })

    const fetchGemini = (endpoint: string) =>
      fetch(
        `https://generativelanguage.googleapis.com/${endpoint}:generateContent?key=${apiKey}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: requestBody }
      )

    let response: Response | null = null
    let errText = ''

    for (const endpoint of modelEndpoints) {
      response = await fetchGemini(endpoint)
      if (response.ok) break
      errText = await response.text()
      if (response.status === 429) {
        const retryMatchMs = errText.match(/retry in (\d+(?:\.\d+)?)ms/)
        const retryMatchS = errText.match(/retry in (\d+(?:\.\d+)?)s/)
        const delayMs = retryMatchMs
          ? Math.ceil(parseFloat(retryMatchMs[1]))
          : retryMatchS
            ? Math.ceil(parseFloat(retryMatchS[1]) * 1000)
            : 1000
        await new Promise((r) => setTimeout(r, Math.min(delayMs, 10000)))
        const retryResponse = await fetchGemini(endpoint)
        if (retryResponse.ok) {
          response = retryResponse
          break
        }
        response = retryResponse
        errText = await retryResponse.text()
      }
      if (response!.status !== 404 && response!.status !== 429) break
    }

    if (!response || !response.ok) {
      console.error('Gemini API error:', response?.status ?? 'no response', errText)
      let errMessage = 'AI service error'
      try {
        const errJson = JSON.parse(errText)
        errMessage = errJson.error?.message ?? errJson.error ?? errText.slice(0, 300)
      } catch {
        errMessage = errText.slice(0, 300) || errMessage
      }
      return NextResponse.json({ error: errMessage }, { status: 502 })
    }

    const data = await response.json()
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      const blockReason = data.candidates?.[0]?.finishReason
      return NextResponse.json(
        { error: blockReason === 'SAFETY' ? 'Content was blocked by safety filters' : 'No response from AI' },
        { status: 502 }
      )
    }

    content = content.trim()
    // Strip markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) content = jsonMatch[1].trim()
    // Fix trailing commas
    content = content.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
    // Extract JSON object if wrapped in extra text
    const firstBrace = content.indexOf('{')
    if (firstBrace > 0) content = content.slice(firstBrace)
    if (content.indexOf('{') >= 0) {
      let depth = 0
      let end = -1
      for (let i = 0; i < content.length; i++) {
        if (content[i] === '{') depth++
        else if (content[i] === '}') {
          depth--
          if (depth === 0) {
            end = i + 1
            break
          }
        }
      }
      if (end > 0) content = content.slice(0, end)
    }

    let parsed: { name?: string; exercises?: Array<{ exerciseName?: string; muscleGroup?: string; sets?: Array<{ reps?: number; weight?: number; effort?: number; form?: number }> }> }
    try {
      parsed = JSON.parse(content)
    } catch (parseErr) {
      console.error('Parse workout JSON fail. Raw content:', content.slice(0, 500))
      return NextResponse.json(
        { error: 'AI returned invalid JSON. Try rephrasing your workout.' },
        { status: 502 }
      )
    }

    if (!parsed.exercises || !Array.isArray(parsed.exercises)) {
      return NextResponse.json({ error: 'AI response missing exercises array' }, { status: 502 })
    }

    const validMuscleGroups = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'calves', 'core']

    const normalized = {
      name: parsed.name || 'Workout',
      exercises: parsed.exercises
        .filter((ex) => ex && ex.exerciseName && ex.sets?.length)
        .map((ex) => {
          let mg = String(ex.muscleGroup || 'chest').toLowerCase().replace(/\s+/g, '')
          if (!validMuscleGroups.includes(mg)) {
            const match = validMuscleGroups.find((g) => g.includes(mg) || mg.includes(g))
            mg = match || 'chest'
          }
          return {
            exerciseName: String(ex.exerciseName).trim(),
            muscleGroup: mg,
            sets: (ex.sets || [])
              .filter((s) => s && (typeof s.reps === 'number' || typeof s.reps === 'string') && Number(s.reps) > 0)
            .map((s) => ({
              reps: Math.round(Number(s.reps)) || 1,
              weight: Math.max(0, Number(s.weight) || 0),
              ...(s.effort != null && { effort: Math.min(5, Math.max(1, Math.round(Number(s.effort)))) }),
              ...(s.form != null && { form: Math.min(5, Math.max(1, Math.round(Number(s.form)))) }),
            })),
          }
        })
        .filter((ex) => ex.sets.length > 0),
    }

    return NextResponse.json(normalized)
  } catch (err) {
    console.error('Parse workout error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to parse workout' },
      { status: 500 }
    )
  }
}
