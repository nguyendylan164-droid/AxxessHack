import { useState } from 'react'
import type { TaskItem, TaskCategory } from '../types/tasks'
import { TASK_CATEGORIES } from '../types/tasks'

export interface TasksPanelProps {
  tasks: TaskItem[]
  completedTaskIds: Set<string>
  toggleTaskCompleted: (id: string) => void
}

export function TasksPanel({ tasks, completedTaskIds, toggleTaskCompleted }: TasksPanelProps) {
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'All'>('All')

  const filteredTasks = categoryFilter === 'All' ? tasks : tasks.filter((t) => t.category === categoryFilter)
  const activeTasks = filteredTasks.filter((t) => !completedTaskIds.has(t.id))
  const completedTasks = filteredTasks.filter((t) => completedTaskIds.has(t.id))

  return (
    <div className="tasks-panel">
      <h2 className="section-title">Clinician tasks</h2>
      <p className="section-desc">
        Suggested from this patient&apos;s reports and escalations. Click a category to filter.
      </p>
      <div className="task-categories">
        <button
          type="button"
          className={`task-cat-btn ${categoryFilter === 'All' ? 'task-cat-btn--active' : ''}`}
          onClick={() => setCategoryFilter('All')}
        >
          All
        </button>
        {TASK_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`task-cat-btn ${categoryFilter === cat ? 'task-cat-btn--active' : ''}`}
            onClick={() => setCategoryFilter(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
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
