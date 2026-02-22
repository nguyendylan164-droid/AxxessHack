/**
 * Mock data for demo. When backend is ready, swap to api.ts:
 * - /api/cards/generate, /api/report/generate for cards and report
 * - POST patient report to backend (or keep in context for demo)
 */

export interface ReviewItem {
  id: string
  name: string
  tagline: string
  severity?: 'mild' | 'moderate' | 'severe'
}

export const SAMPLE_REVIEW_ITEMS: ReviewItem[] = [
  { id: '1', name: 'Headache frequency', tagline: 'Up ~40% since last visit; tension-type' },
  { id: '2', name: 'Fatigue', tagline: 'Patient reports low energy most days' },
  { id: '3', name: 'Sleep quality', tagline: 'Improved per self-report; 6–7 hrs' },
  { id: '4', name: 'Joint pain', tagline: 'Knees stable; lower back slightly worse' },
  { id: '5', name: 'Medication adherence', tagline: 'On track; no missed doses reported' },
  { id: '6', name: 'Mood', tagline: 'Anxiety score up 2 points on PHQ-4' },
]

export const PATIENT_SYMPTOM_LIST = [
  { id: '1', name: 'Headache', description: 'How have your headaches been?' },
  { id: '2', name: 'Fatigue', description: 'How would you rate your energy levels?' },
  { id: '3', name: 'Sleep quality', description: 'How well have you been sleeping?' },
  { id: '4', name: 'Joint pain', description: 'Any joint or muscle pain?' },
  { id: '5', name: 'Medication adherence', description: 'Have you been able to take meds as prescribed?' },
  { id: '6', name: 'Mood', description: 'How has your mood or anxiety been?' },
]

export const INITIAL_ESCALATIONS = [
  { id: 'e1', title: 'Progression spike: headache', detail: 'Frequency and intensity increased over last 2 weeks.', severity: 'medium' as const },
  { id: 'e2', title: 'Trend: anxiety', detail: 'PHQ-4 trend suggests follow-up may be needed.', severity: 'low' as const },
]

export const AI_SUMMARY =
  'Patient progress since last visit (14 days): Overall stable with two areas of concern. Headache frequency has increased and is worth discussing. Fatigue and sleep are mixed; sleep improved but energy remains low. Joint and medication adherence are on track. Anxiety scores have ticked up—consider brief check-in.'

export const AI_AUTOMATION = [
  'Progress summary generated from last 14 days',
  'Progression spikes flagged (1 high, 1 low)',
  'Symptoms trended and compared to baseline',
]

export interface PatientOption {
  id: string
  name: string
  lastVisit: string
}

export const MOCK_PATIENTS: PatientOption[] = [
  { id: '1', name: 'Maria J.', lastVisit: '12 days ago' },
  { id: '2', name: 'James K.', lastVisit: '5 days ago' },
  { id: '3', name: 'Linda M.', lastVisit: '19 days ago' },
]
