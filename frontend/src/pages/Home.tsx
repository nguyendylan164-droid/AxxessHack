import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    setReviewItems((prev) => prev.filter((c) => c.id !== item.id))
  }, [])

  const onReset = useCallback(() => {
    setReviewItems([...SAMPLE_REVIEW_ITEMS])
    setEscalations([...INITIAL_ESCALATIONS])
  }, [])

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
            />
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
