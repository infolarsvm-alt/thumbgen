'use client'
import { useState } from 'react'

const NICHES = ['Gaming', 'Tech', 'Finance', 'Lifestyle', 'Educatie', 'Fitness', 'Food', 'Travel']
const STYLES = ['Energiek & bold', 'Minimalistisch', 'Dramatisch', 'Humoristisch', 'Mysterieus']
const COLORS = ['#E24B4A', '#378ADD', '#1D9E75', '#EF9F27', '#7F77DD', '#D4537E', '#444441']

export default function Home() {
  const [tab, setTab] = useState('gen')
  const [title, setTitle] = useState('')
  const [niche, setNiche] = useState('Gaming')
  const [style, setStyle] = useState('Energiek & bold')
  const [color, setColor] = useState('#E24B4A')
  const [face, setFace] = useState('Ja')
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState('')
  const [imgUrl, setImgUrl] = useState(null)
  const [fluxPrompt, setFluxPrompt] = useState('')
  const [busy, setBusy] = useState(false)

  async function generate() {
    if (!title.trim() || busy) return
    setBusy(true)
    setImgUrl(null)
    setFluxPrompt('')
    setStatus('Stap 1/3 — Claude schrijft FLUX-prompt...')

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, niche, style, color, face, channel }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setFluxPrompt(data.fluxPrompt)

      if (data.output) {
        const url = Array.isArray(data.output) ? data.output[0] : data.output
        setImgUrl(url)
        setStatus('Klaar!')
        setBusy(false)
        return
      }

      setStatus('Stap 2/3 — FLUX genereert afbeelding...')
      await poll(data.predictionId)
    } catch (e) {
      setStatus('Fout: ' + e.message)
      setBusy(false)
    }
  }

  async function poll(id, attempts = 0) {
    if (attempts > 40) throw new Error('Timeout — probeer opnieuw.')
    await new Promise(r => setTimeout(r, 2500))
    const res = await fetch(`/api/poll?id=${id}`)
    const data = await res.json()
    if (data.status === 'succeeded') {
      const url = Array.isArray(data.output) ? data.output[0] : data.output
      setImgUrl(url)
      setStatus('Klaar!')
      setBusy(false)
    } else if (data.status === 'failed') {
      throw new Error(data.error || 'Replicate fout')
    } else {
      setStatus(`Stap 3/3 — Genereren... (${attempts + 1})`)
      await poll(id, attempts + 1)
    }
  }

  async function download() {
    if (!imgUrl) return
    const a = document.createElement('a')
    a.href = imgUrl
    a.download = 'thumbnail.webp'
    a.target = '_blank'
    a.click()
  }

  return (
    <main className="min-h-screen py-10 px-4">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-1">Thumbnail Generator</h1>
          <p className="text-sm text-gray-500">Claude + FLUX Thumbnails LoRA · ~€0,004 per afbeelding</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-5">
          {[['gen', 'Genereren'], ['profile', 'Kanaalstijl']].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-1.5 rounded-lg text-sm border transition-colors ${
                tab === id
                  ? 'bg-gray-100 border-gray-300 font-medium text-gray-900'
                  : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'gen' && (
          <div className="space-y-4">
            {/* Input */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Videotitel of beschrijving</label>
                <textarea
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  rows={2}
                  placeholder="Bijv: Ik leefde 30 dagen op €5 per dag..."
                  className="w-full border border-gray-200 rounded-lg p-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">Niche</label>
                <div className="flex flex-wrap gap-1.5">
                  {NICHES.map(n => (
                    <button
                      key={n}
                      onClick={() => setNiche(n)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        niche === n ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">Stijl</label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLES.map(s => (
                    <button
                      key={s}
                      onClick={() => setStyle(s)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        style === s ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={generate}
                disabled={busy || !title.trim()}
                className="w-full py-2.5 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-800 transition-colors"
              >
                {busy ? 'Bezig...' : 'Thumbnail genereren →'}
              </button>

              {status && <p className="text-xs text-gray-400">{status}</p>}
            </div>

            {/* Result */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Preview — 16:9</label>
              <div className="w-full aspect-video bg-gray-50 rounded-lg border border-gray-100 overflow-hidden flex items-center justify-center">
                {imgUrl ? (
                  <img src={imgUrl} alt="Gegenereerde thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <p className="text-xs text-gray-300">{busy ? 'Genereren...' : 'Nog geen thumbnail'}</p>
                )}
              </div>
              {imgUrl && (
                <button
                  onClick={download}
                  className="mt-3 px-4 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  ↓ Downloaden (webp)
                </button>
              )}
              {fluxPrompt && (
                <div className="mt-3">
                  <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">FLUX-prompt</label>
                  <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg p-3 leading-relaxed">{fluxPrompt}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'profile' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-1 block">Kanaalnaam</label>
              <input
                type="text"
                value={channel}
                onChange={e => setChannel(e.target.value)}
                placeholder="Bijv: TechMet Pieter"
                className="w-full border border-gray-200 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-gray-300"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-2 block">Merkkleur</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    style={{ background: c }}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${color === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase tracking-wide mb-1.5 block">Gezicht op thumbnail?</label>
              <div className="flex gap-2">
                {['Ja', 'Nee (faceless)'].map(f => (
                  <button
                    key={f}
                    onClick={() => setFace(f)}
                    className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                      face === f ? 'bg-blue-50 text-blue-700 border-blue-200' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-400">Instellingen worden meegenomen bij elke generatie.</p>
          </div>
        )}
      </div>
    </main>
  )
}
