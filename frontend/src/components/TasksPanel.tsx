import { useState, useCallback, useRef, useEffect } from 'react'
import type { TaskItem, TaskCategory } from '../types/tasks'
import { TASK_CATEGORIES } from '../types/tasks'

export interface TasksPanelProps {
  tasks: TaskItem[]
  completedTaskIds: Set<string>
  toggleTaskCompleted: (id: string) => void
  loading?: boolean
  onAddTask?: (category: TaskCategory, label: string) => void
}

export function TasksPanel({
  tasks,
  completedTaskIds,
  toggleTaskCompleted,
  loading = false,
  onAddTask,
}: TasksPanelProps) {
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'All'>('All')
  const [addOpen, setAddOpen] = useState(false)
  const [addValue, setAddValue] = useState('')
  const [speechListening, setSpeechListening] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const canAdd = categoryFilter !== 'All' && categoryFilter !== 'Escalation' && onAddTask

  const filteredTasks = categoryFilter === 'All' ? tasks : tasks.filter((t) => t.category === categoryFilter)
  const activeTasks = filteredTasks.filter((t) => !completedTaskIds.has(t.id))
  const completedTasks = filteredTasks.filter((t) => completedTaskIds.has(t.id))

  const submitAdd = useCallback(() => {
    if (!addValue.trim() || !canAdd) return
    onAddTask!(categoryFilter, addValue.trim())
    setAddValue('')
    setAddOpen(false)
  }, [addValue, canAdd, categoryFilter, onAddTask])

  const startSpeech = useCallback(() => {
    const SR = (window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: new () => unknown }).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR() as { start: () => void; onstart: () => void; onend: () => void; onresult: (e: { results: unknown }) => void }
    rec.onstart = () => setSpeechListening(true)
    rec.onend = () => setSpeechListening(false)
    rec.onresult = (e: { results: unknown }) => {
      const res = e.results as { [i: number]: { [j: number]: { transcript: string } } }
      const text = res[0]?.[0]?.transcript
      if (text) setAddValue((v) => (v ? `${v} ${text}` : text))
    }
    rec.start()
  }, [])

  useEffect(() => {
    if (addOpen) inputRef.current?.focus()
  }, [addOpen])

  return (
    <div className="tasks-panel">
      <h2 className="section-title">Clinician tasks</h2>
      <p className="section-desc">
        {loading ? 'Generating suggested tasks…' : "Suggested from this patient's reports and escalations. Click a category to filter."}
      </p>
      <div className="task-categories">
        <button
          type="button"
          className={`task-cat-btn ${categoryFilter === 'All' ? 'task-cat-btn--active' : ''}`}
          onClick={() => { setCategoryFilter('All'); setAddOpen(false); }}
        >
          All
        </button>
        {TASK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`task-cat-btn ${categoryFilter === cat ? 'task-cat-btn--active' : ''}`}
            onClick={() => { setCategoryFilter(cat); setAddOpen(false); }}
          >
            {cat}
          </button>
        ))}
      </div>
      {canAdd && (
        <div className="task-add-row">
          {addOpen ? (
            <div className="task-add-inline">
              <input
                ref={inputRef}
                type="text"
                className="task-add-input"
                placeholder="Task..."
                value={addValue}
                onChange={(e) => setAddValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitAdd()}
              />
              <button
                type="button"
                className="task-add-mic"
                onClick={startSpeech}
                title="Speak"
                aria-label="Speak"
              >
                {speechListening ? '◉' : '🎤'}
              </button>
              <button type="button" className="task-add-btn" onClick={submitAdd}>
                Add
              </button>
              <button type="button" className="task-add-cancel" onClick={() => { setAddOpen(false); setAddValue(''); }}>
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="task-add-trigger"
              onClick={() => setAddOpen(true)}
            >
              + Add task
            </button>
          )}
        </div>
      )}
      <ul className="task-list">
        {activeTasks.length === 0 && completedTasks.length === 0 && (
          <li className="task-empty">
            {categoryFilter === 'All' ? 'No tasks from current report.' : `No ${categoryFilter} tasks.`}
          </li>
        )}
        {activeTasks.map((t) => (
          <li key={t.id} className={`task-item task-item--${t.priority}`}>
            <button
              type="button"
              className="task-check"
              onClick={() => toggleTaskCompleted(t.id)}
              aria-label="Mark done"
            />
            <span className="task-label">{t.label}</span>
            <span className="task-source">{t.source}</span>
          </li>
        ))}
        {completedTasks.map((t) => (
          <li key={t.id} className="task-item task-item--done">
            <button
              type="button"
              className="task-check task-check--done"
              onClick={() => toggleTaskCompleted(t.id)}
              aria-label="Undo"
            />
            <span className="task-label">{t.label}</span>
            <span className="task-source">{t.source}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
