/**
 * When backend is ready, replace data/mockData usage with this module.
 *
 * Example:
 * - getReviewItems() -> GET /api/cards/generate or similar
 * - getEscalations() / getReport() -> GET /api/report/generate
 * - submitPatientReport(data) -> POST to backend
 *
 * Keep the same shapes (ReviewItem, EscalationItem, etc.) so components stay compatible.
 */

const API_BASE = (import.meta.env.VITE_API_URL as string) ?? ''

export interface ClientOption {
  id: string
  name: string
  lastVisit: string
}

export async function getClients(): Promise<ClientOption[]> {
  const res = await fetch(`${API_BASE}/api/users/clients`)
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText))
  const data = await res.json()
  return data.clients ?? []
}

export interface EmrReport {
  user_id: string
  last_visit: string | null
  conditions: string[]
  medications: string[]
  procedures: string[]
  vitals: Record<string, unknown>
  visit_notes: string | null
  alerts: string[]
}

export async function getEmr(userId: string): Promise<EmrReport | null> {
  const res = await fetch(`${API_BASE}/api/emr/${encodeURIComponent(userId)}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(await res.text().catch(() => res.statusText))
  return res.json()
}

export async function getReviewItems(): Promise<import('../data/mockData').ReviewItem[]> {
  // TODO: const res = await fetch('/api/cards/generate'); return res.json();
  const { SAMPLE_REVIEW_ITEMS } = await import('../data/mockData')
  return SAMPLE_REVIEW_ITEMS
}

export async function getEscalations(): Promise<import('../types/tasks').EscalationItem[]> {
  // TODO: fetch from /api/report/generate or similar
  const { INITIAL_ESCALATIONS } = await import('../data/mockData')
  return INITIAL_ESCALATIONS
}

export async function getAISummary(): Promise<{ summary: string; automation: string[] }> {
  // TODO: from backend
  const { AI_SUMMARY, AI_AUTOMATION } = await import('../data/mockData')
  return { summary: AI_SUMMARY, automation: AI_AUTOMATION }
}
