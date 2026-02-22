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
  buildTasksFromEscalationsOnly,
  loadCompletedTaskIds,
  loadCompletedTaskIdsForClient,
  saveCompletedTaskIds,
  saveCompletedTaskIdsForClient,
} from '../types/tasks'
import { getEmr } from '../data/api'
import {
  SAMPLE_REVIEW_ITEMS,
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
  const { session, profile } = useAuth()
  const { selectedPatientId } = usePatientSelection()
  const isClient = profile?.role === 'client'
  // When client: show their own data in dashboard. When clinician: show selected dropdown client.
  const effectivePatientId = isClient ? (session?.user?.id ?? '') : selectedPatientId

  const [reviewItems, setReviewItems] = useState<SwipeStackCard[]>(() => [...SAMPLE_REVIEW_ITEMS])
  const [, setEscalations] = useState<EscalationItem[]>([])
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(loadCompletedTaskIds)
  const [clientExtraConcerns, setClientExtraConcerns] = useState('')
  const [reviewHistory, setReviewHistory] = useState<ReviewChoice[]>([])
  const [checkInSubmitStatus, setCheckInSubmitStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [checkInError, setCheckInError] = useState<string | null>(null)

  // Clinician: single state object to avoid multiple synchronous setState in effects
  const [clinicianState, setClinicianState] = useState({
    escalations: [] as EscalationItem[],
    summary: AI_SUMMARY,
    summaryAutomation: AI_AUTOMATION as string[],
    loading: false,
    completedTaskIds: new Set<string>(),
  })

  useEffect(() => {
    saveCompletedTaskIds(completedTaskIds)
  }, [completedTaskIds])

  // Load selected client's check-ins and EMR (dashboard). All updates in async callback to avoid sync setState in effect.
  useEffect(() => {
    if (!effectivePatientId) {
      setClinicianState({
        escalations: [],
        summary: AI_SUMMARY,
        summaryAutomation: AI_AUTOMATION,
        loading: false,
        completedTaskIds: new Set(),
      })
      return
    }

    setClinicianState((prev) => ({ ...prev, loading: true }))

    const mapCheckInToEscalation = (row: {
      id: string
      user_id: string
      responses: Record<string, unknown>
      concern_level: string
      red_flags: string[]
      created_at: string
    }): EscalationItem => {
      const severity = (row.concern_level === 'high' ? 'high' : row.concern_level === 'medium' ? 'medium' : 'low') as 'low' | 'medium' | 'high'
      const detail = row.red_flags?.length
        ? row.red_flags.join(' · ')
        : (typeof row.responses?.extra_concerns === 'string' ? row.responses.extra_concerns : '') || 'Check-in submitted'
      return {
        id: row.id,
        title: `Check-in: ${row.concern_level} concern`,
        detail: detail.slice(0, 120) + (detail.length > 120 ? '…' : ''),
        severity,
      }
    }

    Promise.all([
      supabase
        .from('aftercare_check_ins')
        .select('id,user_id,responses,concern_level,red_flags,created_at')
        .eq('user_id', effectivePatientId)
        .order('created_at', { ascending: false })
        .then(({ data, error }) => {
          if (error) return []
          return (data ?? []).filter((r: { concern_level: string }) => r.concern_level !== 'low').map(mapCheckInToEscalation)
        }),
      getEmr(effectivePatientId).catch(() => null),
    ])
      .then(([escalationList, emr]) => {
        let summary = 'No EMR on file for this client.'
        let summaryAutomation: string[] = []
        if (emr) {
          const parts: string[] = []
          if (emr.last_visit) parts.push(`Last visit: ${emr.last_visit}`)
          if (emr.conditions?.length) parts.push(`Conditions: ${emr.conditions.join(', ')}`)
          if (emr.medications?.length) parts.push(`Medications: ${emr.medications.join(', ')}`)
          if (emr.visit_notes) parts.push(emr.visit_notes)
          if (emr.alerts?.length) parts.push(`Alerts: ${emr.alerts.join(', ')}`)
          summary = parts.length ? parts.join('\n\n') : 'No EMR on file.'
          summaryAutomation = ['Summary from EMR', 'Check-ins from aftercare submissions']
        }
        setClinicianState({
          escalations: escalationList,
          summary,
          summaryAutomation,
          loading: false,
          completedTaskIds: loadCompletedTaskIdsForClient(effectivePatientId),
        })
      })
  }, [effectivePatientId])

  useEffect(() => {
    saveCompletedTaskIdsForClient(effectivePatientId, clinicianState.completedTaskIds)
  }, [effectivePatientId, clinicianState.completedTaskIds])

  const clinicianTasks = useMemo(
    () => buildTasksFromEscalationsOnly(clinicianState.escalations),
    [clinicianState.escalations]
  )
  const toggleClinicianTaskCompleted = useCallback((id: string) => {
    setClinicianState((prev) => {
      const next = new Set(prev.completedTaskIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...prev, completedTaskIds: next }
    })
  }, [])

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
    setEscalations([])
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

  // —— Signed-in: one page with Client (review queue + check-in) and Clinician (3 columns) in one place ———
  return (
    <div className="home-page home-page--unified">
      <section className="dashboard dashboard--unified">
        {/* Left card: for clients. Clinicians can see it but interactions have no effect. */}
        <div className={`unified-client-section ${!isClient ? 'unified-client-section--no-interact' : ''}`} aria-disabled={!isClient}>
          <h2 className="unified-section-title">
            {isClient ? 'Your check-in' : 'Review queue'}
          </h2>
          <div className="client-review-full">
            <ReviewQueue
              items={reviewItems}
              onEscalate={onEscalate}
              onNoAction={onNoAction}
              onReset={onReset}
              fullScreen={false}
              disabled={!isClient}
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
              disabled={!isClient || checkInSubmitStatus === 'submitting'}
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
              disabled={!isClient || checkInSubmitStatus === 'submitting' || (reviewHistory.length === 0 && !clientExtraConcerns.trim())}
            >
              {checkInSubmitStatus === 'submitting' ? 'Submitting…' : 'Submit check-in'}
            </button>
          </div>
        </div>

        {/* Right card: for clinicians. Clients can see it but interactions have no effect. */}
        <div className={`unified-dashboard-section ${isClient ? 'unified-dashboard-section--no-interact' : ''}`} aria-disabled={isClient}>
          <h2 className="unified-section-title">Progress & tasks</h2>
          {clinicianState.loading && (
            <p className="clinician-loading">Loading client data…</p>
          )}
          <div className="dashboard-columns">
            <div className="dashboard-col dashboard-col--summary">
              <div className="summary-card">
                <h2 className="summary-title">Progress summary</h2>
                <p className="summary-text">
                  {effectivePatientId ? clinicianState.summary : 'Select a client from the dropdown to view progress and EMR.'}
                </p>
                <div className="automation-list">
                  <span className="automation-label">Automated</span>
                  <ul>
                    {clinicianState.summaryAutomation.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="dashboard-col dashboard-col--tasks">
              <TasksPanel
                tasks={clinicianTasks}
                completedTaskIds={clinicianState.completedTaskIds}
                toggleTaskCompleted={toggleClinicianTaskCompleted}
              />
            </div>
            <div className="dashboard-col dashboard-col--escalations">
              <EscalationsPanel escalations={clinicianState.escalations} />
            </div>
          </div>
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
