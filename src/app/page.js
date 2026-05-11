'use client'
import { useState, useRef } from 'react'

const NICHES = ['Gaming', 'Tech', 'Finance', 'Lifestyle', 'Education', 'Fitness', 'Food', 'Travel', 'Comedy', 'Business']
const STYLES = ['Energetic & Bold', 'Minimalist', 'Dramatic', 'Humorous', 'Mysterious', 'Inspirational']
const COLORS = ['#E24B4A', '#378ADD', '#1D9E75', '#EF9F27', '#7F77DD', '#D4537E', '#444441', '#F5F5F5']
const COUNTS = [1, 2, 4]

export default function Home() {
  const [channel, setChannel] = useState('')
  const [title, setTitle] = useState('')
  const [niche, setNiche] = useState('Gaming')
  const [style, setStyle] = useState('Energetic & Bold')
  const [color, setColor] = useState('#E24B4A')
  const [face, setFace] = useState('Yes')
  const [count, setCount] = useState(2)
  const [refImage, setRefImage] = useState(null)
  const [refImageB64, setRefImageB64] = useState(null)
  const [results, setResults] = useState([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [activeTab, setActiveTab] = useState('generate')
  const [channelSaved, setChannelSaved] = useState(false)
  const fileRef = useRef()

  function handleImageUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    setRefImage(URL.createObjectURL(file))
    const reader = new FileReader()
    reader.onload = () => setRefImageB64(reader.result.split(',')[1])
    reader.readAsDataURL(file)
  }

  function saveChannel() {
    setChannelSaved(true)
    setTimeout(() => setChannelSaved(false), 2000)
  }

  async function generate() {
    if (!title.trim() || busy) return
    setBusy(true)
    setResults([])
    setStatus('Claude is analysing your video concept...')

    try {
      const promises = Array.from({ length: count }, async (_, i) => {
        await new Promise(r => setTimeout(r, i * 800))
        setStatus(`Generating variant ${i + 1} of ${count}...`)
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, niche, style, color, face, channel, variant: i + 1 }),
        })
        const data = await res.json()
        if (data.error) throw new Error(data.error)
        return { predictionId: data.predictionId, fluxPrompt: data.fluxPrompt, status: data.status, output: data.output, index: i }
      })

      const initial = await Promise.all(promises)
      setResults(initial.map(r => ({ ...r, imgUrl: null, loading: true })))

      // Poll all
      await Promise.all(initial.map(async (item, i) => {
        let imgUrl = null
        if (item.output) {
          imgUrl = Array.isArray(item.output) ? item.output[0] : item.output
        } else {
          imgUrl = await pollPrediction(item.predictionId, i)
        }
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, imgUrl, loading: false } : r))
      }))

      setStatus('Done! Your thumbnails are ready.')
    } catch (e) {
      setStatus('Error: ' + e.message)
    }
    setBusy(false)
  }

  async function pollPrediction(id, idx, attempts = 0) {
    if (attempts > 40) throw new Error('Timeout')
    await new Promise(r => setTimeout(r, 2500))
    const res = await fetch(`/api/poll?id=${id}`)
    const data = await res.json()
    if (data.status === 'succeeded') {
      return Array.isArray(data.output) ? data.output[0] : data.output
    }
    if (data.status === 'failed') throw new Error(data.error || 'Generation failed')
    return pollPrediction(id, idx, attempts + 1)
  }

  function download(url, i) {
    const a = document.createElement('a')
    a.href = url
    a.download = `thumbnail-${i + 1}.webp`
    a.target = '_blank'
    a.click()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f0f', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #222', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 32, height: 56 }}>
        <div style={{ fontWeight: 700, fontSize: 18, background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          ThumbGen
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['generate', 'channel'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              background: activeTab === tab ? '#1e1e1e' : 'transparent',
              color: activeTab === tab ? '#fff' : '#666',
            }}>
              {tab === 'generate' ? '✦ Generate' : '⚙ Channel Style'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px' }}>
        {activeTab === 'channel' && (
          <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 24, border: '1px solid #2a2a2a' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 600 }}>Channel Style</h2>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>YouTube Channel Handle</label>
              <input value={channel} onChange={e => setChannel(e.target.value)} placeholder="@yourchannel"
                style={{ width: '100%', background: '#111', border: '1px solid #333', borderRadius: 10, padding: '10px 14px', color: '#fff', fontSize: 14, boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Brand Color</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COLORS.map(c => (
                  <div key={c} onClick={() => setColor(c)} style={{
                    width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: color === c ? '2px solid #fff' : '2px solid transparent',
                    transform: color === c ? 'scale(1.15)' : 'scale(1)', transition: 'all 0.15s'
                  }} />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Niche</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {NICHES.map(n => (
                  <button key={n} onClick={() => setNiche(n)} style={{
                    padding: '5px 12px', borderRadius: 99, border: '1px solid', cursor: 'pointer', fontSize: 12,
                    borderColor: niche === n ? '#6366f1' : '#333',
                    background: niche === n ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: niche === n ? '#818cf8' : '#666',
                  }}>{n}</button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Face on Thumbnail?</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Yes', 'No (faceless)'].map(f => (
                  <button key={f} onClick={() => setFace(f)} style={{
                    padding: '5px 14px', borderRadius: 99, border: '1px solid', cursor: 'pointer', fontSize: 12,
                    borderColor: face === f ? '#6366f1' : '#333',
                    background: face === f ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: face === f ? '#818cf8' : '#666',
                  }}>{f}</button>
                ))}
              </div>
            </div>
            <button onClick={saveChannel} style={{
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14,
              background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff'
            }}>
              {channelSaved ? '✓ Saved!' : 'Save Channel Style'}
            </button>
          </div>
        )}

        {activeTab === 'generate' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Left — Input */}
            <div>
              <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, border: '1px solid #2a2a2a', marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Video Title or Description</label>
                <textarea value={title} onChange={e => setTitle(e.target.value)} rows={4}
                  placeholder="Describe your video... e.g. 'I lived on €5 a day for 30 days'"
                  style={{ width: '100%', background: '#111', border: '1px solid #2a2a2a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14, resize: 'none', boxSizing: 'border-box', lineHeight: 1.5 }} />
                <div style={{ fontSize: 11, color: '#444', textAlign: 'right', marginTop: 4 }}>{title.length} / 2000</div>
              </div>

              <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, border: '1px solid #2a2a2a', marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Style</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STYLES.map(s => (
                    <button key={s} onClick={() => setStyle(s)} style={{
                      padding: '5px 12px', borderRadius: 99, border: '1px solid', cursor: 'pointer', fontSize: 12,
                      borderColor: style === s ? '#6366f1' : '#333',
                      background: style === s ? 'rgba(99,102,241,0.15)' : 'transparent',
                      color: style === s ? '#818cf8' : '#666',
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Reference image */}
              <div style={{ background: '#1a1a1a', borderRadius: 16, padding: 20, border: '1px solid #2a2a2a', marginBottom: 16 }}>
                <label style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reference Image (optional)</label>
                <input type="file" accept="image/*" ref={fileRef} onChange={handleImageUpload} style={{ display: 'none' }} />
                {refImage ? (
                  <div style={{ position: 'relative' }}>
                    <img src={refImage} style={{ width: '100%', borderRadius: 8, aspectRatio: '16/9', objectFit: 'cover' }} />
                    <button onClick={() => { setRefImage(null); setRefImageB64(null) }} style={{
                      position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.7)', border: 'none',
                      color: '#fff', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 12
                    }}>✕</button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current.click()} style={{
                    width: '100%', padding: '20px', borderRadius: 10, border: '1px dashed #333',
                    background: 'transparent', color: '#444', cursor: 'pointer', fontSize: 13
                  }}>
                    ＋ Upload reference image
                  </button>
                )}
              </div>

              {/* Variants + Generate */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {COUNTS.map(c => (
                    <button key={c} onClick={() => setCount(c)} style={{
                      width: 36, height: 36, borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                      borderColor: count === c ? '#6366f1' : '#333',
                      background: count === c ? 'rgba(99,102,241,0.15)' : '#1a1a1a',
                      color: count === c ? '#818cf8' : '#555',
                    }}>{c}</button>
                  ))}
                  <span style={{ fontSize: 12, color: '#555', alignSelf: 'center', marginLeft: 4 }}>variants</span>
                </div>
                <button onClick={generate} disabled={busy || !title.trim()} style={{
                  flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: busy || !title.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: 600, fontSize: 14, opacity: busy || !title.trim() ? 0.4 : 1,
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)', color: '#fff'
                }}>
                  {busy ? 'Generating...' : '✦ Generate'}
                </button>
              </div>
              {status && <div style={{ marginTop: 10, fontSize: 12, color: '#555' }}>{status}</div>}
            </div>

            {/* Right — Results */}
            <div>
              {results.length === 0 && !busy && (
                <div style={{ background: '#1a1a1a', borderRadius: 16, border: '1px dashed #2a2a2a', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🖼</div>
                  <div style={{ fontSize: 13 }}>Your thumbnails will appear here</div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: count === 1 ? '1fr' : '1fr 1fr', gap: 12 }}>
                {results.map((r, i) => (
                  <div key={i} style={{ background: '#1a1a1a', borderRadius: 12, border: '1px solid #2a2a2a', overflow: 'hidden' }}>
                    <div style={{ aspectRatio: '16/9', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      {r.loading ? (
                        <div style={{ color: '#333', fontSize: 12 }}>Generating...</div>
                      ) : r.imgUrl ? (
                        <img src={r.imgUrl} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={`Thumbnail ${i + 1}`} />
                      ) : (
                        <div style={{ color: '#f44', fontSize: 12 }}>Failed</div>
                      )}
                    </div>
                    {r.imgUrl && (
                      <div style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 11, color: '#555' }}>Variant {i + 1}</span>
                        <button onClick={() => download(r.imgUrl, i)} style={{
                          padding: '4px 10px', borderRadius: 6, border: '1px solid #333', background: 'transparent',
                          color: '#888', fontSize: 11, cursor: 'pointer'
                        }}>↓ Download</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
