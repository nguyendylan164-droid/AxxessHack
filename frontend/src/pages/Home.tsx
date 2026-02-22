import { useState, useCallback, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ReviewQueue } from '../components/ReviewQueue'
import { TasksPanel } from '../components/TasksPanel'
import { EscalationsPanel } from '../components/EscalationsPanel'
import type { SwipeStackCard } from '../components/SwipeStack'
import type { EscalationItem, TaskItem } from '../types/tasks'
import {
  buildTasksFromEscalationsOnly,
  loadCompletedTaskIds,
  saveCompletedTaskIds,
} from '../types/tasks'
import { getAICards, getProgressSummary, getClinicianTasks, type AICard } from '../data/api'
import {
  SAMPLE_REVIEW_ITEMS,
  AI_SUMMARY,
  AI_AUTOMATION,
} from '../data/mockData'

function escalationSeverityFromCard(severity: 'mild' | 'moderate' | 'severe' | undefined): 'low' | 'medium' | 'high' {
  if (severity === 'severe') return 'high'
  if (severity === 'moderate') return 'medium'
  return 'low'
}

function aiCardToSwipeCard(card: AICard): SwipeStackCard {
  const cat = card.category ?? ''
  const severity: 'mild' | 'moderate' | 'severe' | undefined =
    cat === 'red_flag' ? 'severe' : cat === 'symptom' ? 'moderate' : 'mild'
  return {
    id: card.id,
    name: card.title,
    tagline: card.description.slice(0, 80) + (card.description.length > 80 ? '…' : ''),
    description: card.rationale ?? card.description,
    severity,
  }
}

export function Home() {
  const { session, profile } = useAuth()
  const [patientDescription, setPatientDescription] = useState('')
  const [generateLoading, setGenerateLoading] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const [reviewItems, setReviewItems] = useState<SwipeStackCard[]>(() => [...SAMPLE_REVIEW_ITEMS])
  const [agreedItems, setAgreedItems] = useState<EscalationItem[]>([])
  const [emrText, setEmrText] = useState<string | null>(null)

  const [customTasks, setCustomTasks] = useState<TaskItem[]>([])
  const [clinicianState, setClinicianState] = useState({
    summary: AI_SUMMARY,
    summaryAutomation: AI_AUTOMATION as string[],
    summaryLoading: false,
    tasksLoading: false,
    aiTasks: [] as TaskItem[],
    completedTaskIds: loadCompletedTaskIds(),
  })

  const addCustomTask = useCallback((category: import('../types/tasks').TaskCategory, label: string) => {
    if (!label.trim()) return
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setCustomTasks((prev) => [
      ...prev,
      { id, label: label.trim(), priority: 'low', source: 'Manual', category },
    ])
  }, [])

  // Persist completed tasks for this session
  useEffect(() => {
    saveCompletedTaskIds(clinicianState.completedTaskIds)
  }, [clinicianState.completedTaskIds])

  // AI progress summary and clinician tasks - run sequentially to avoid API concurrency limit
  useEffect(() => {
    const agreedInputs = agreedItems.map((a) => ({
      title: a.title,
      detail: a.detail,
      severity: a.severity,
    }))
    let cancelled = false

    const run = async () => {
      setClinicianState((p) => ({ ...p, summaryLoading: true, tasksLoading: true }))
      try {
        const summary = await getProgressSummary(emrText, agreedInputs)
        if (cancelled) return
        setClinicianState((p) => ({
          ...p,
          summary,
          summaryAutomation: ['AI-generated from patient description and agreed cards'],
          summaryLoading: false,
        }))

        if (!emrText?.trim() && agreedItems.length === 0) {
          setClinicianState((p) => ({ ...p, aiTasks: [], tasksLoading: false }))
          return
        }
        const tasks = await getClinicianTasks(emrText, agreedInputs)
        if (cancelled) return
        const asTaskItems: TaskItem[] = tasks.map((t) => ({
          id: t.id,
          label: t.label,
          priority: t.priority,
          source: t.source,
          category: t.category,
        }))
        setClinicianState((p) => ({ ...p, aiTasks: asTaskItems, tasksLoading: false }))
      } catch (err) {
        if (cancelled) return
        setClinicianState((p) => ({
          ...p,
          summary: err instanceof Error ? `Unable to generate summary: ${err.message}` : 'Unable to generate summary',
          summaryLoading: false,
          aiTasks: [],
          tasksLoading: false,
        }))
      }
    }

    run()
    return () => { cancelled = true }
  }, [emrText, agreedItems])

  const noticesForPanel = useMemo(
    () => agreedItems,
    [agreedItems]
  )
  const escalationTasks = useMemo(
    () => buildTasksFromEscalationsOnly(noticesForPanel),
    [noticesForPanel]
  )
  const clinicianTasks = useMemo(
    () => [...customTasks, ...clinicianState.aiTasks, ...escalationTasks],
    [customTasks, clinicianState.aiTasks, escalationTasks]
  )
  const toggleClinicianTaskCompleted = useCallback((id: string) => {
    setClinicianState((prev) => {
      const next = new Set(prev.completedTaskIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { ...prev, completedTaskIds: next }
    })
  }, [])

  const onAgree = useCallback((item: SwipeStackCard) => {
    const severity = escalationSeverityFromCard(item.severity)
    setAgreedItems((prev) => [
      ...prev,
      {
        id: `agree-${item.id}`,
        title: item.name,
        detail: item.description ?? item.tagline,
        severity,
      },
    ])
    setReviewItems((prev) => prev.filter((c) => c.id !== item.id))
  }, [])

  const onDisagree = useCallback((item: SwipeStackCard) => {
    setReviewItems((prev) => prev.filter((c) => c.id !== item.id))
  }, [])

  const onReset = useCallback(() => {
    setReviewItems([...SAMPLE_REVIEW_ITEMS])
    setAgreedItems([])
    setEmrText(null)
  }, [])

  const handleGenerateCards = useCallback(async () => {
    const text = patientDescription.trim()
    if (!text) {
      setGenerateError('Please enter a patient description.')
      return
    }
    setGenerateError(null)
    setGenerateLoading(true)
    try {
      const aiCards = await getAICards(text)
      setReviewItems(aiCards.map(aiCardToSwipeCard))
      setEmrText(text)
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : 'Failed to generate cards')
      setReviewItems([...SAMPLE_REVIEW_ITEMS])
    } finally {
      setGenerateLoading(false)
    }
  }, [patientDescription])

  // Nurse must be logged in (enforced by NurseRoute)
  if (!session || !profile || profile.role !== 'clinician') {
    return null
  }

  return (
    <div className="home-page home-page--unified">
      <section className="dashboard dashboard--unified">
        {/* Left: patient description input + card review queue */}
        <div className="unified-client-section">
          <h2 className="unified-section-title">Patient cards</h2>
          <div className="patient-description-section" style={{ marginBottom: '1rem' }}>
            <label className="auth-label" htmlFor="patient-desc">
              Patient description or EMR notes
            </label>
            <textarea
              id="patient-desc"
              className="client-concerns-input"
              placeholder="Paste patient notes, visit summary, or EMR content. AI will generate follow-up cards."
              value={patientDescription}
              onChange={(e) => setPatientDescription(e.target.value)}
              rows={4}
              disabled={generateLoading}
              style={{ marginTop: '0.5rem' }}
            />
            {generateError && (
              <p className="client-checkin-error" role="alert" style={{ marginTop: '0.5rem' }}>
                {generateError}
              </p>
            )}
            <button
              type="button"
              className="auth-submit"
              onClick={handleGenerateCards}
              disabled={generateLoading || !patientDescription.trim()}
              style={{ marginTop: '0.75rem' }}
            >
              {generateLoading ? 'Generating…' : 'Generate cards'}
            </button>
          </div>
          <p className="auth-subtitle" style={{ marginBottom: '0.75rem', fontSize: '0.875rem' }}>
            Or go to <Link to="/recording" className="auth-link">Recording</Link> to record a visit and get EMR + summary.
          </p>
          <div className="client-review-full">
            <ReviewQueue
              items={reviewItems}
              onAgree={onAgree}
              onDisagree={onDisagree}
              onReset={onReset}
              fullScreen={false}
              disabled={false}
            />
          </div>
        </div>

        {/* Right: progress summary, tasks, escalations */}
        <div className="unified-dashboard-section">
          <h2 className="unified-section-title">Progress & tasks</h2>
          <div className="dashboard-columns">
            <div className="dashboard-col dashboard-col--summary">
              <div className="summary-card">
                <h2 className="summary-title">Progress summary</h2>
                <p className="summary-text">
                  {clinicianState.summaryLoading
                    ? 'Generating summary…'
                    : clinicianState.summary}
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
                loading={clinicianState.tasksLoading}
                onAddTask={addCustomTask}
              />
            </div>
            <div className="dashboard-col dashboard-col--escalations">
              <EscalationsPanel escalations={noticesForPanel} />
            </div>
          </div>
        </div>
      </section>

      <footer className="contact-section">
        <h2 className="contact-title">Contact</h2>
        <p className="contact-text">
          Built for nurses to review patient progress and surface follow-up tasks.
        </p>
        <div className="contact-links">
          <a href="mailto:hello@example.com">hello@example.com</a>
        </div>
      </footer>
    </div>
  )
}
