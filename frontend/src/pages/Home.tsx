import { useState, useCallback, useMemo, useEffect } from 'react'
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
import { SAMPLE_REVIEW_ITEMS, INITIAL_ESCALATIONS, AI_SUMMARY, AI_AUTOMATION } from '../data/mockData'

function escalationSeverityFromCard(severity: 'mild' | 'moderate' | 'severe' | undefined): 'low' | 'medium' | 'high' {
  if (severity === 'severe') return 'high'
  if (severity === 'moderate') return 'medium'
  return 'low'
}

export function Home() {
  const [reviewItems, setReviewItems] = useState<SwipeStackCard[]>(() => [...SAMPLE_REVIEW_ITEMS])
  const [escalations, setEscalations] = useState<EscalationItem[]>(() => [...INITIAL_ESCALATIONS])
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(loadCompletedTaskIds)

  useEffect(() => {
    saveCompletedTaskIds(completedTaskIds)
  }, [completedTaskIds])

  const tasks = useMemo(() => buildTasksFromReports(escalations), [escalations])
  const activeTaskCount = tasks.filter((t) => !completedTaskIds.has(t.id)).length

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

  return (
    <div className="home-page">
      <section className="dashboard">
        <header className="dashboard-header">
          <div className="patient-context">
            <span className="patient-label">Patient</span>
            <span className="patient-name">Maria J.</span>
            <span className="patient-meta">Last visit 12 days ago · Record loaded</span>
          </div>
          <div className="dashboard-stats">
            <span className="stat stat--escalations">
              {escalations.length} escalation{escalations.length !== 1 ? 's' : ''}
            </span>
            <span className="stat stat--tasks">
              {activeTaskCount} task{activeTaskCount !== 1 ? 's' : ''}
            </span>
            <span className="stat stat--queue">{reviewItems.length} in queue</span>
          </div>
        </header>

        <div className="dashboard-grid">
          <div className="dashboard-main">
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

            <div className="dashboard-row">
              <ReviewQueue
                items={reviewItems}
                onEscalate={onEscalate}
                onNoAction={onNoAction}
                onReset={onReset}
              />
              <TasksPanel
                tasks={tasks}
                completedTaskIds={completedTaskIds}
                toggleTaskCompleted={toggleTaskCompleted}
              />
            </div>
          </div>

          <EscalationsPanel escalations={escalations} />
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
