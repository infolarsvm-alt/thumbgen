export const runtime = 'edge'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return Response.json({ error: 'Geen prediction ID.' }, { status: 400 })

  const REPLICATE_KEY = process.env.REPLICATE_API_KEY
  const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
    headers: { Authorization: `Bearer ${REPLICATE_KEY}` },
  })
  const data = await res.json()
  return Response.json({
    status: data.status,
    output: data.output || null,
    error: data.error || null,
  })
}
