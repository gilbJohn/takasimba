import { NextResponse } from 'next/server'

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    )
    const data = await response.json()

    if (!response.ok) {
      return NextResponse.json({ error: data.error?.message ?? 'Failed to list models' }, { status: 502 })
    }

    const models = (data.models || [])
      .filter((m: { supportedGenerationMethods?: string[] }) =>
        m.supportedGenerationMethods?.includes('generateContent')
      )
      .map((m: { name: string }) => m.name.replace('models/', ''))

    return NextResponse.json({ models })
  } catch (err) {
    console.error('List models error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to list models' },
      { status: 500 }
    )
  }
}
