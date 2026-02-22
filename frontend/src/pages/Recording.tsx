import { useCallback, useEffect, useRef, useState } from 'react'

// Use proxy in dev (vite forwards /api to backend), or VITE_API_URL in prod
const API_BASE = import.meta.env.VITE_API_URL ?? ''

interface ProcessedUtterance {
  speaker: 'clinician' | 'client'
  text: string
}

interface ProcessedResult {
  utterances: ProcessedUtterance[]
  clinician_questions: string[]
  client_responses: string[]
  summary: string
}

interface FullPipelineResult {
  processed: ProcessedResult
  emr_notes: string
}

function mergeBuffers(lhs: Int16Array, rhs: Int16Array): Int16Array {
  const merged = new Int16Array(lhs.length + rhs.length)
  merged.set(lhs, 0)
  merged.set(rhs, lhs.length)
  return merged
}

export function Recording() {
  const [isRecording, setIsRecording] = useState(false)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [result, setResult] = useState<FullPipelineResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const turnsRef = useRef<Record<string, string>>({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!isRecording) {
      setElapsedSeconds(0)
      return
    }
    const start = Date.now()
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [isRecording])

  const startRecording = useCallback(async () => {
    setError(null)
    setResult(null)
    setLiveTranscript('')
    turnsRef.current = {}

    // 1. Get temp token from backend
    const tokenRes = await fetch(`${API_BASE}/api/streaming/token`)
    if (!tokenRes.ok) {
      const data = await tokenRes.json().catch(() => ({}))
      throw new Error(data.detail || 'Failed to get streaming token')
    }
    const { token } = await tokenRes.json()
    if (!token) throw new Error('No token received')

    // 2. Get microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    streamRef.current = stream

    const audioContext = new AudioContext({ sampleRate: 16000, latencyHint: 'balanced' })
    audioContextRef.current = audioContext

    const source = audioContext.createMediaStreamSource(stream)
    await audioContext.audioWorklet.addModule('/audio-processor.js')
    const workletNode = new AudioWorkletNode(audioContext, 'audio-processor')
    source.connect(workletNode)
    workletNode.connect(audioContext.destination)

    let audioBufferQueue = new Int16Array(0)

    workletNode.port.onmessage = (event: MessageEvent) => {
      const currentBuffer = new Int16Array(event.data.audio_data)
      audioBufferQueue = mergeBuffers(audioBufferQueue, currentBuffer)
      const bufferDuration = (audioBufferQueue.length / audioContext.sampleRate) * 1000

      if (bufferDuration >= 100) {
        const totalSamples = Math.floor(audioContext.sampleRate * 0.1)
        const finalBuffer = new Uint8Array(audioBufferQueue.subarray(0, totalSamples).buffer)
        audioBufferQueue = audioBufferQueue.subarray(totalSamples)
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(finalBuffer)
        }
      }
    }

    const endpoint = `wss://streaming.assemblyai.com/v3/ws?sample_rate=16000&formatted_finals=true&token=${token}`
    const ws = new WebSocket(endpoint)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string)
        if (msg.type === 'Turn') {
          const { turn_order, transcript } = msg
          turnsRef.current[turn_order] = transcript
          const ordered = Object.keys(turnsRef.current)
            .sort((a, b) => Number(a) - Number(b))
            .map((k) => turnsRef.current[k])
            .join(' ')
          setLiveTranscript(ordered)
        }
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => setError('WebSocket error')
    ws.onclose = () => {}
    ws.onopen = () => setIsRecording(true)
  }, [])

  const stopRecording = useCallback(async () => {
    if (wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: 'Terminate' }))
      wsRef.current.close()
      wsRef.current = null
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioContextRef.current?.close()
    audioContextRef.current = null
    setIsRecording(false)

    const rawTranscript = Object.keys(turnsRef.current)
      .sort((a, b) => Number(a) - Number(b))
      .map((k) => turnsRef.current[k])
      .join(' ')
      .trim()

    if (!rawTranscript) {
      setError('No speech detected. Please try again.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_BASE}/api/transcript/full-pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw_transcript: rawTranscript }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.detail || 'Failed to process transcript')
      }
      const data: FullPipelineResult = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to process')
    } finally {
      setLoading(false)
    }
  }, [])

  const handleToggle = useCallback(() => {
    if (isRecording) stopRecording()
    else startRecording().catch((e) => setError(e instanceof Error ? e.message : 'Failed to start'))
  }, [isRecording, startRecording, stopRecording])

  return (
    <div className="recording-page" style={{ padding: '2rem 1.5rem', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Visit Recorder</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9375rem' }}>
        Record a clinician–client conversation. Live transcript will appear below. When you stop, AI will
        separate clinician questions from patient responses and generate EMR notes.
      </p>

      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="card-btn card-btn--match"
          onClick={handleToggle}
          disabled={loading}
        >
          {isRecording ? 'Stop recording' : 'Start recording'}
        </button>
        {isRecording && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: 8,
              background: 'var(--escalate-soft)',
              border: '1px solid #fca5a5',
            }}
          >
            <span style={{ fontSize: '0.875rem', color: 'var(--escalate)', fontWeight: 600 }}>
              ● Recording
            </span>
            <span
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '1.125rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
            </span>
          </div>
        )}
      </div>

      {error && (
        <div className="auth-error" style={{ marginBottom: '1rem' }}>{error}</div>
      )}

      {loading && (
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
          Processing transcript and generating EMR...
        </p>
      )}

      {liveTranscript && (
        <div
          className="summary-card"
          style={{ marginBottom: '1.5rem', padding: '1.25rem' }}
        >
          <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Live transcript</h3>
          <p style={{ margin: 0, fontSize: '0.9375rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {liveTranscript}
          </p>
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="summary-card" style={{ padding: '1.25rem', borderLeftColor: 'var(--accent)' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>Clinician vs Patient</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {result.processed.utterances.map((u, i) => (
                <div
                  key={i}
                  style={{
                    padding: '0.5rem 0.75rem',
                    borderRadius: 8,
                    background: u.speaker === 'clinician' ? 'var(--accent-soft)' : 'var(--match-soft)',
                    borderLeft: `4px solid ${u.speaker === 'clinician' ? 'var(--accent)' : 'var(--match)'}`,
                  }}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                    {u.speaker === 'client' ? 'Patient' : 'Clinician'}
                  </span>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.9375rem' }}>{u.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="summary-card" style={{ padding: '1.25rem', borderLeftColor: 'var(--match)' }}>
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem' }}>EMR visit notes</h3>
            <div
              style={{
                fontSize: '0.9375rem',
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}
            >
              {result.emr_notes}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
