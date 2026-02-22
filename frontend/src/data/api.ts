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
