import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { usePatientSelection } from '../contexts/PatientSelectionContext'
import { ReviewQueue } from '../components/ReviewQueue'
import { TasksPanel } from '../components/TasksPanel'
import { EscalationsPanel } from '../components/EscalationsPanel'
import type { SwipeStackCard } from '../components/SwipeStack'
import type { EscalationItem } from '../types/tasks'
import {
  buildTasksFromReports,
  loadCompletedTaskIds,
  saveCompletedTaskIds,
} from '../types/tasks'
import {
  SAMPLE_REVIEW_ITEMS,
  INITIAL_ESCALATIONS,
  AI_SUMMARY,
  AI_AUTOMATION,
} from '../data/mockData'

const APP_NAME = 'CareTrack'

type ConcernLevel = 'low' | 'medium' | 'high'

interface ReviewChoice {
  id: string
  name: string
  tagline: string
  severity?: 'mild' | 'moderate' | 'severe'
  action: 'escalate' | 'no_action'
}

function computeConcernAndFlags(
  history: ReviewChoice[],
  extraConcerns: string
): { concernLevel: ConcernLevel; redFlags: string[] } {
  const escalated = history.filter((h) => h.action === 'escalate')
  const combined = extraConcerns.toLowerCase()
  const redFlags: string[] = []
  escalated.forEach((h) => redFlags.push(`Escalated: ${h.name}`))
  const highKw = ['worse', 'severe', 'emergency', 'chest pain', 'can\'t breathe', '10/10']
  const medKw = ['worsening', 'moderate', 'concerning', 'worried', 'pain']
  if (highKw.some((kw) => combined.includes(kw))) {
    redFlags.push('High-concern wording in notes')
    return { concernLevel: 'high', redFlags }
  }
  if (escalated.some((h) => h.severity === 'severe')) {
    return { concernLevel: 'high', redFlags }
  }
  if (escalated.some((h) => h.severity === 'moderate')) {
    return { concernLevel: 'medium', redFlags }
  }
  if (medKw.some((kw) => combined.includes(kw)) || escalated.length > 0) {
    return { concernLevel: 'medium', redFlags }
  }
  return { concernLevel: 'low', redFlags }
}

function escalationSeverityFromCard(severity: 'mild' | 'moderate' | 'severe' | undefined): 'low' | 'medium' | 'high' {
  if (severity === 'severe') return 'high'
  if (severity === 'moderate') return 'medium'
  return 'low'
}

export function Home() {
  const { session, profile, loading } = useAuth()
  const { selectedPatientId } = usePatientSelection()
  const isClient = profile?.role === 'client'

  const [reviewItems, setReviewItems] = useState<SwipeStackCard[]>(() => [...SAMPLE_REVIEW_ITEMS])
  const [escalations, setEscalations] = useState<EscalationItem[]>(() => [...INITIAL_ESCALATIONS])
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(loadCompletedTaskIds)
  const [clientExtraConcerns, setClientExtraConcerns] = useState('')
  const [reviewHistory, setReviewHistory] = useState<ReviewChoice[]>([])
  const [checkInSubmitStatus, setCheckInSubmitStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [checkInError, setCheckInError] = useState<string | null>(null)

  useEffect(() => {
    saveCompletedTaskIds(completedTaskIds)
  }, [completedTaskIds])

  const tasks = useMemo(() => buildTasksFromReports(escalations), [escalations])

  const toggleTaskCompleted = useCallback((id: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const onEscalate = useCallback((item: SwipeStackCard) => {
    setReviewHistory((prev) => [
      ...prev,
      { id: item.id, name: item.name, tagline: item.tagline, severity: item.severity, action: 'escalate' },
    ])
    const severity = escalationSeverityFromCard(item.severity)
    setEscalations((prev) => [
      ...prev,
      {
        id: `esc-${item.id}`,
        title: `Escalated: ${item.name}`,
        detail: item.tagline,
        severity,
      },
    ])
    setReviewItems((prev) => prev.filter((c) => c.id !== item.id))
  }, [])

  const onNoAction = useCallback((item: SwipeStackCard) => {
    setReviewHistory((prev) => [
      ...prev,
      { id: item.id, name: item.name, tagline: item.tagline, severity: item.severity, action: 'no_action' },
    ])
    setReviewItems((prev) => prev.filter((c) => c.id !== item.id))
  }, [])

  const onReset = useCallback(() => {
    setReviewItems([...SAMPLE_REVIEW_ITEMS])
    setEscalations([...INITIAL_ESCALATIONS])
    setReviewHistory([])
  }, [])

  const submitCheckIn = useCallback(async () => {
    if (!session?.user?.id) return
    setCheckInError(null)
    setCheckInSubmitStatus('submitting')
    const { concernLevel, redFlags } = computeConcernAndFlags(reviewHistory, clientExtraConcerns)
    const responses = {
      reviewed: reviewHistory,
      extra_concerns: clientExtraConcerns.trim() || null,
    }
    const { error } = await supabase.from('aftercare_check_ins').insert({
      user_id: session.user.id,
      responses,
      concern_level: concernLevel,
      red_flags: redFlags,
    })
    if (error) {
      setCheckInError(error.message)
      setCheckInSubmitStatus('error')
      return
    }
    setCheckInSubmitStatus('done')
    setReviewHistory([])
    setClientExtraConcerns('')
  }, [session?.user?.id, reviewHistory, clientExtraConcerns])

  // —— Not signed in: welcome / landing ———
  if (!session) {
    return (
      <div className="welcome-page">
        <div className="welcome-block">
          <h1 className="welcome-title">Welcome to {APP_NAME}</h1>
          <p className="welcome-text">
            Track progress between visits and keep your care team informed.
          </p>
          <Link to="/about" className="welcome-btn">
            Learn more
          </Link>
          <p className="welcome-auth-prompt">
            Please log in or sign up to continue.
          </p>
          <div className="welcome-auth-links">
            <Link to="/login" className="welcome-link">Log in</Link>
            <span className="welcome-sep">·</span>
            <Link to="/signup" className="welcome-link">Sign up</Link>
          </div>
        </div>
      </div>
    )
  }

  // —— Session but profile not loaded yet: avoid flashing wrong role UI ———
  if (!profile) {
    return (
      <div className="welcome-page">
        <div className="welcome-block">
          <p className="welcome-text">Loading…</p>
        </div>
      </div>
    )
  }

  // —— Client view: full-screen review queue + insert message ———
  if (isClient) {
    return (
      <div className="home-page home-page--client">
        <section className="dashboard dashboard--client">
          <div className="client-review-full">
            <ReviewQueue
              items={reviewItems}
              onEscalate={onEscalate}
              onNoAction={onNoAction}
              onReset={onReset}
              fullScreen
            />
          </div>
          <div className="client-insert-message">
            <label className="auth-label" htmlFor="client-concerns">
              Any other concerns not mentioned above?
            </label>
            <textarea
              id="client-concerns"
              className="client-concerns-input"
              placeholder="Type any additional symptoms, worries, or notes for your care team…"
              value={clientExtraConcerns}
              onChange={(e) => setClientExtraConcerns(e.target.value)}
              rows={3}
              disabled={checkInSubmitStatus === 'submitting'}
            />
            {checkInError && (
              <p className="client-checkin-error" role="alert">
                {checkInError}
              </p>
            )}
            {checkInSubmitStatus === 'done' && (
              <p className="client-checkin-success">Check-in submitted. Your care team may follow up if needed.</p>
            )}
            <button
              type="button"
              className="auth-submit client-submit-btn"
              onClick={submitCheckIn}
              disabled={checkInSubmitStatus === 'submitting' || (reviewHistory.length === 0 && !clientExtraConcerns.trim())}
            >
              {checkInSubmitStatus === 'submitting' ? 'Submitting…' : 'Submit check-in'}
            </button>
          </div>
        </section>
        <footer className="contact-section">
          <h2 className="contact-title">Contact</h2>
          <p className="contact-text">
            Built to track progress between visits and surface what matters to clinicians.
          </p>
          <div className="contact-links">
            <a href="mailto:hello@example.com">hello@example.com</a>
          </div>
        </footer>
      </div>
    )
  }

  // —— Clinician view: patient dropdown in navbar (top right), 3 columns ———
  return (
    <div className="home-page">
      <section className="dashboard">
        <div className="dashboard-columns">
          <div className="dashboard-col dashboard-col--summary">
            <div className="summary-card">
              <h2 className="summary-title">Progress summary</h2>
              <p className="summary-text">{AI_SUMMARY}</p>
              <div className="automation-list">
                <span className="automation-label">Automated</span>
                <ul>
                  {AI_AUTOMATION.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="dashboard-col dashboard-col--tasks">
            <TasksPanel
              tasks={tasks}
              completedTaskIds={completedTaskIds}
              toggleTaskCompleted={toggleTaskCompleted}
            />
          </div>
          <div className="dashboard-col dashboard-col--escalations">
            <EscalationsPanel escalations={escalations} />
          </div>
        </div>
      </section>

      <footer className="contact-section">
        <h2 className="contact-title">Contact</h2>
        <p className="contact-text">
          Built to track patient progress between visits and surface what matters to clinicians.
        </p>
        <div className="contact-links">
          <a href="mailto:hello@example.com">hello@example.com</a>
        </div>
      </footer>
    </div>
  )
}
