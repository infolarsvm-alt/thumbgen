export const runtime = 'edge'

export async function POST(req) {
  try {
    const { title, niche, style, color, face, channel } = await req.json()

    const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
    const REPLICATE_KEY = process.env.REPLICATE_API_KEY

    if (!ANTHROPIC_KEY || !REPLICATE_KEY) {
      return Response.json({ error: 'API keys niet geconfigureerd in Vercel.' }, { status: 500 })
    }

    const profileCtx = channel ? `Kanaal: "${channel}". ` : ''
    const claudePrompt = `${profileCtx}Je bent expert YouTube thumbnail designer. Schrijf een gedetailleerde Engelse image-generation prompt voor het FLUX Thumbnails LoRA-model voor deze YouTube video: "${title}". Niche: ${niche}. Stijl: ${style}. Merkkleur (hex): ${color}. Gezicht op thumbnail: ${face}.

Regels:
- Begin ALTIJD met: "Thumbnail in the style of TOK,"
- Beschrijf compositie, kleuren, verlichting, emotie, tekst-overlay en sfeer
- Houd het onder 120 woorden
- Schrijf alleen de prompt, geen uitleg

Geef ALLEEN de prompt terug, niets anders.`

    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        messages: [{ role: 'user', content: claudePrompt }],
      }),
    })

    const claudeData = await claudeRes.json()
    const fluxPrompt = claudeData.content?.map(b => b.text || '').join('').trim()
    if (!fluxPrompt) throw new Error('Claude gaf geen prompt terug.')

    const repRes = await fetch('https://api.replicate.com/v1/models/justmalhar/flux-thumbnails/predictions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${REPLICATE_KEY}`,
        'Prefer': 'wait=60',
      },
      body: JSON.stringify({
        input: {
          prompt: fluxPrompt,
          aspect_ratio: '16:9',
          output_format: 'webp',
          output_quality: 90,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          model: 'dev',
        },
      }),
    })

    const repData = await repRes.json()
    if (repData.detail) throw new Error('Replicate: ' + repData.detail)
    if (repData.error) throw new Error('Replicate: ' + repData.error)

    return Response.json({
      predictionId: repData.id,
      fluxPrompt,
      status: repData.status,
      output: repData.output || null,
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
