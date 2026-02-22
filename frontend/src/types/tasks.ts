export type TaskCategory = 'Follow-up' | 'Medication' | 'Screening' | 'Routine' | 'Escalation'

export interface TaskItem {
  id: string
  label: string
  priority: 'high' | 'medium' | 'low'
  source: string
  category: TaskCategory
}

export const TASK_CATEGORIES: TaskCategory[] = ['Follow-up', 'Medication', 'Screening', 'Routine', 'Escalation']

export const COMPLETED_TASKS_KEY = 'app-completed-task-ids'

export function completedTasksKeyForClient(clientId: string): string {
  return clientId ? `${COMPLETED_TASKS_KEY}-${clientId}` : COMPLETED_TASKS_KEY
}

export function loadCompletedTaskIds(): Set<string> {
  try {
    const raw = localStorage.getItem(COMPLETED_TASKS_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

export function loadCompletedTaskIdsForClient(clientId: string): Set<string> {
  if (!clientId) return new Set()
  try {
    const raw = localStorage.getItem(completedTasksKeyForClient(clientId))
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as string[]
    return new Set(Array.isArray(arr) ? arr : [])
  } catch {
    return new Set()
  }
}

export function saveCompletedTaskIds(ids: Set<string>) {
  try {
    localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

export function saveCompletedTaskIdsForClient(clientId: string, ids: Set<string>) {
  if (!clientId) return
  try {
    localStorage.setItem(completedTasksKeyForClient(clientId), JSON.stringify([...ids]))
  } catch {
    // ignore
  }
}

export interface EscalationItem {
  id: string
  title: string
  detail: string
  severity: 'low' | 'medium' | 'high'
}

export function buildTasksFromReports(escalations: EscalationItem[]): TaskItem[] {
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

/** Build tasks from escalations only (no hardcoded report tasks). Use for clinician view when data is from DB. */
export function buildTasksFromEscalationsOnly(escalations: EscalationItem[]): TaskItem[] {
  return escalations.map((e) => {
    const title = e.title.startsWith('Check-in: ') ? e.title.slice(10) : e.title.startsWith('Escalated: ') ? e.title.slice(11) : e.title
    return {
      id: `task-${e.id}`,
      label: e.severity === 'medium' || e.severity === 'high' ? `Follow up on: ${title}` : `Review: ${title}`,
      priority: e.severity === 'high' ? 'high' : e.severity === 'medium' ? 'medium' : 'low',
      source: 'Escalation',
      category: 'Escalation',
    }
  })
}
