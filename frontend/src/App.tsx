<<<<<<< Updated upstream
<<<<<<< Updated upstream
import { useState, useCallback, useMemo, useEffect } from 'react'
import { Routes, Route, Link, Outlet } from 'react-router-dom'
import './App.css'

export type TaskCategory = 'Follow-up' | 'Medication' | 'Screening' | 'Routine' | 'Escalation'

const SAMPLE_REVIEW_ITEMS = [
  { id: '1', name: 'Headache frequency', tagline: 'Up ~40% since last visit; tension-type' },
  { id: '2', name: 'Fatigue', tagline: 'Patient reports low energy most days' },
  { id: '3', name: 'Sleep quality', tagline: 'Improved per self-report; 6–7 hrs' },
  { id: '4', name: 'Joint pain', tagline: 'Knees stable; lower back slightly worse' },
  { id: '5', name: 'Medication adherence', tagline: 'On track; no missed doses reported' },
  { id: '6', name: 'Mood', tagline: 'Anxiety score up 2 points on PHQ-4' },
]

const INITIAL_ESCALATIONS = [
  { id: 'e1', title: 'Progression spike: headache', detail: 'Frequency and intensity increased over last 2 weeks.', severity: 'medium' as const },
  { id: 'e2', title: 'Trend: anxiety', detail: 'PHQ-4 trend suggests follow-up may be needed.', severity: 'low' as const },
]

interface TaskItem {
  id: string
  label: string
  priority: 'high' | 'medium' | 'low'
  source: string
  category: TaskCategory
}

function buildTasksFromReports(escalations: { id: string; title: string; severity: string }[]): TaskItem[] {
  const fromEscalations: TaskItem[] = escalations.map((e) => {
    const title = e.title.startsWith('Escalated: ') ? e.title.slice(11) : e.title
    return {
      id: `task-${e.id}`,
      label: e.severity === 'medium' || e.severity === 'high' ? `Follow up on: ${title}` : `Review: ${title}`,
      priority: e.severity === 'high' ? 'high' : e.severity === 'medium' ? 'medium' : 'low',
      source: 'Escalation',
      category: 'Escalation',
    }
  })
  const fromReport: TaskItem[] = [
    { id: 'task-r1', label: 'Discuss headache management at next visit', priority: 'medium', source: 'Progress report', category: 'Follow-up' },
    { id: 'task-r2', label: 'Consider brief anxiety check-in or screening', priority: 'low', source: 'Progress report', category: 'Screening' },
    { id: 'task-r3', label: 'Confirm medication adherence and refills', priority: 'low', source: 'Routine', category: 'Medication' },
  ]
  return [...fromEscalations, ...fromReport]
}

const TASK_CATEGORIES: TaskCategory[] = ['Follow-up', 'Medication', 'Screening', 'Routine', 'Escalation']
const EXIT_DURATION_MS = 380
const COMPLETED_TASKS_KEY = 'app-completed-task-ids'

const AI_SUMMARY =
  'Patient progress since last visit (14 days): Overall stable with two areas of concern. Headache frequency has increased and is worth discussing. Fatigue and sleep are mixed; sleep improved but energy remains low. Joint and medication adherence are on track. Anxiety scores have ticked up—consider brief check-in.'

const AI_AUTOMATION = [
  'Progress summary generated from last 14 days',
  'Progression spikes flagged (1 high, 1 low)',
  'Symptoms trended and compared to baseline',
]

function loadCompletedTaskIds(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_TASKS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

function saveCompletedTaskIds(ids: Set<string>) {
  try {
    localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

function Layout() {
  return (
    <>
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="nav-link">Clinician</Link>
          <Link to="/about" className="nav-link">About</Link>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
=======
=======
>>>>>>> Stashed changes
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import { SymptomCard } from './components/SymptomCard'
import './App.css'

function App() {
  return (
    <>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <SymptomCard
          subject="Night cough"
          description="Patient reports occasional night cough. Allergy season approaching - continue daily controller."
          onYes={() => alert('Yes')}
          onNo={() => alert('No')}
        />
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
>>>>>>> Stashed changes
    </>
  )
}

function Home() {
  const [reviewItems, setReviewItems] = useState(() => [...SAMPLE_REVIEW_ITEMS])
  const [exiting, setExiting] = useState<{ id: string; direction: 'left' | 'right' } | null>(null)
  const [escalations, setEscalations] = useState(() => [...INITIAL_ESCALATIONS])
  const [taskCategoryFilter, setTaskCategoryFilter] = useState<TaskCategory | 'All'>('All')
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<string>>(loadCompletedTaskIds)

  useEffect(() => {
    saveCompletedTaskIds(completedTaskIds)
  }, [completedTaskIds])

  const tasks = useMemo(() => buildTasksFromReports(escalations), [escalations])
  const activeTaskCount = tasks.filter((t) => !completedTaskIds.has(t.id)).length
  const filteredTasks = taskCategoryFilter === 'All' ? tasks : tasks.filter((t) => t.category === taskCategoryFilter)
  const activeTasks = filteredTasks.filter((t) => !completedTaskIds.has(t.id))
  const completedTasks = filteredTasks.filter((t) => completedTaskIds.has(t.id))

  const toggleTaskCompleted = useCallback((id: string) => {
    setCompletedTaskIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const handleChoice = useCallback((direction: 'left' | 'right') => {
    if (reviewItems.length === 0 || exiting) return
    const top = reviewItems[0]
    setExiting({ id: top.id, direction })
    window.setTimeout(() => {
      setReviewItems((prev) => prev.filter((c) => c.id !== top.id))
      if (direction === 'left') {
        setEscalations((prev) => [
          ...prev,
          { id: `esc-${top.id}`, title: `Escalated: ${top.name}`, detail: top.tagline, severity: 'low' as const },
        ])
      }
      setExiting(null)
    }, EXIT_DURATION_MS)
  }, [reviewItems, exiting])

  const handleReset = useCallback(() => {
    setReviewItems([...SAMPLE_REVIEW_ITEMS])
    setEscalations([...INITIAL_ESCALATIONS])
    setExiting(null)
  }, [])

  const visibleStack = reviewItems.slice(0, 3)

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
            <span className="stat stat--escalations">{escalations.length} escalation{escalations.length !== 1 ? 's' : ''}</span>
            <span className="stat stat--tasks">{activeTaskCount} task{activeTaskCount !== 1 ? 's' : ''}</span>
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
              <div className="review-section">
                <h2 className="section-title">Review queue</h2>
                <p className="section-desc">Confirm on track or escalate for follow-up.</p>
                <div className="card-stack-wrap">
                  <div className="card-stack">
                    {visibleStack.map((card, index) => {
                      const isTop = index === 0
                      const isExiting = exiting?.id === card.id
                      const exitDir = exiting?.direction
                      return (
                        <div
                          key={card.id}
                          className={`stack-card ${isTop ? 'stack-card--top' : 'stack-card--back'} ${isExiting ? `stack-card--exit-${exitDir}` : ''}`}
                          style={isExiting ? { transitionDuration: `${EXIT_DURATION_MS}ms` } : undefined}
                        >
                          <div className="stack-card-inner">
                            <h3 className="stack-card-name">{card.name}</h3>
                            <p className="stack-card-tagline">{card.tagline}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  {reviewItems.length === 0 ? (
                    <div className="card-empty">
                      <p className="card-empty-text">Queue clear</p>
                      <button type="button" className="btn-reset" onClick={handleReset}>
                        Reload sample
                      </button>
                    </div>
                  ) : (
                    <div className="card-actions">
                      <button
                        type="button"
                        className="card-btn card-btn--nope"
                        onClick={() => handleChoice('left')}
                        disabled={!!exiting}
                        aria-label="Escalate"
                      >
                        <span className="card-btn-label">Escalate</span>
                      </button>
                      <button
                        type="button"
                        className="card-btn card-btn--match"
                        onClick={() => handleChoice('right')}
                        disabled={!!exiting}
                        aria-label="No action needed"
                      >
                        <span className="card-btn-label">No action</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="tasks-panel">
                <h2 className="section-title">Clinician tasks</h2>
                <p className="section-desc">Suggested from this patient&apos;s reports and escalations. Click a category to filter.</p>
                <div className="task-categories">
                  <button
                    type="button"
                    className={`task-cat-btn ${taskCategoryFilter === 'All' ? 'task-cat-btn--active' : ''}`}
                    onClick={() => setTaskCategoryFilter('All')}
                  >
                    All
                  </button>
                  {TASK_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`task-cat-btn ${taskCategoryFilter === cat ? 'task-cat-btn--active' : ''}`}
                      onClick={() => setTaskCategoryFilter(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <ul className="task-list">
                  {activeTasks.length === 0 && completedTasks.length === 0 && (
                    <li className="task-empty">
                      {taskCategoryFilter === 'All' ? 'No tasks from current report.' : `No ${taskCategoryFilter} tasks.`}
                    </li>
                  )}
                  {activeTasks.map((t) => (
                    <li key={t.id} className={`task-item task-item--${t.priority}`}>
                      <button type="button" className="task-check" onClick={() => toggleTaskCompleted(t.id)} aria-label="Mark done" />
                      <span className="task-label">{t.label}</span>
                      <span className="task-source">{t.source}</span>
                    </li>
                  ))}
                  {completedTasks.map((t) => (
                    <li key={t.id} className="task-item task-item--done">
                      <button type="button" className="task-check task-check--done" onClick={() => toggleTaskCompleted(t.id)} aria-label="Undo" />
                      <span className="task-label">{t.label}</span>
                      <span className="task-source">{t.source}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <aside className="escalations-panel">
            <h2 className="panel-title">Escalations</h2>
            <p className="panel-desc">Issues and progression spikes for follow-up.</p>
            <ul className="escalation-list">
              {escalations.map((e) => (
                <li key={e.id} className={`escalation-item escalation-item--${e.severity}`}>
                  <span className="escalation-item-title">{e.title}</span>
                  <span className="escalation-item-detail">{e.detail}</span>
                </li>
              ))}
            </ul>
            {escalations.length === 0 && (
              <p className="panel-empty">No escalations.</p>
            )}
          </aside>
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

function About() {
  return (
    <div className="about-page">
      <h1>About</h1>
      <p className="about-lead">
        This application helps clinicians track patient progress between visits by taking in the
        patient&apos;s medical record and feeding back a clear view of progress—with AI doing as much of
        the work as possible.
      </p>
      <ul className="about-features">
        <li><strong>Progress tracking</strong> — See how the patient is doing between visits, with summaries and trends.</li>
        <li><strong>AI automation</strong> — Summaries, trend detection, and flagging are automated so you can focus on decisions.</li>
        <li><strong>Escalation</strong> — Progression spikes and concerning changes are escalated so nothing slips through.</li>
      </ul>
      <p className="about-close">
        The goal is to make the clinician&apos;s job easier: automate what can be automated, and
        escalate when something is wrong or when the medical history shows a progression spike.
      </p>
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Route>
    </Routes>
  )
}

export default App
