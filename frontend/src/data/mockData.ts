/**
 * Mock data for demo. When backend is ready, swap to api.ts:
 * - /api/cards/generate, /api/report/generate for cards and report
 * - POST patient report to backend (or keep in context for demo)
 */

export interface ReviewItem {
  id: string
  name: string
  tagline: string
  description?: string
  severity?: 'mild' | 'moderate' | 'severe'
}

export const SAMPLE_REVIEW_ITEMS: ReviewItem[] = [
  {
    id: '1',
    name: 'Headache frequency',
    tagline: 'Up ~40% since last visit; tension-type',
    description: 'Patient reports headaches 4–5 times per week, compared to 2–3 times at last visit. Mostly tension-type; no aura. Worse with stress and screen time. OTC ibuprofen helps but not as much as before.',
    severity: 'moderate',
  },
  {
    id: '2',
    name: 'Fatigue',
    tagline: 'Patient reports low energy most days',
    description: 'Low energy reported on most days over the past 2 weeks. Difficulty getting through afternoon without rest. Sleep duration adequate (6–7 hrs) but quality described as "not refreshing."',
    severity: 'mild',
  },
  {
    id: '3',
    name: 'Sleep quality',
    tagline: 'Improved per self-report; 6–7 hrs',
    description: 'Patient reports improved sleep since starting sleep hygiene changes. Averages 6–7 hours nightly. Less frequent awakenings. Still occasional difficulty falling asleep (1–2 nights per week).',
    severity: 'mild',
  },
  {
    id: '4',
    name: 'Joint pain',
    tagline: 'Knees stable; lower back slightly worse',
    description: 'Knees stable since last visit. Lower back pain has increased slightly; patient attributes to more sitting at work. No new joint swelling or redness. Heat and light stretching help.',
    severity: 'mild',
  },
  {
    id: '5',
    name: 'Medication adherence',
    tagline: 'On track; no missed doses reported',
    description: 'Patient reports taking medications as prescribed with no missed doses in the past 2 weeks. No side effects noted. Refills not due yet.',
    severity: 'mild',
  },
  {
    id: '6',
    name: 'Mood',
    tagline: 'Anxiety score up 2 points on PHQ-4',
    description: 'PHQ-4 score increased from 2 to 4 over the past 2 weeks. Patient reports more worry about work deadlines. No thoughts of self-harm. Open to discussing coping strategies if needed.',
    severity: 'moderate',
  },
  {
    id: '7',
    name: 'Blood sugar monitoring',
    tagline: 'Readings mostly in range',
    description: 'Patient reports checking glucose as advised. Most readings within target. Occasional post-meal spikes. No hypoglycemic episodes. Diet compliance improved per self-report.',
    severity: 'mild',
  },
  {
    id: '8',
    name: 'Blood pressure at home',
    tagline: 'Within normal range',
    description: 'Home BP logs show values in acceptable range. Patient monitoring 2x daily as recommended. No dizziness or medication side effects reported.',
    severity: 'mild',
  },
  {
    id: '9',
    name: 'Shortness of breath',
    tagline: 'No new respiratory symptoms',
    description: 'No increase in SOB. Rescue inhaler use unchanged. Patient denies chest tightness, wheezing at rest, or night waking due to breathing.',
    severity: 'mild',
  },
  {
    id: '10',
    name: 'Swelling or leg pain',
    tagline: 'No signs of DVT post-surgery',
    description: 'No new calf swelling, warmth, or redness. Patient aware of DVT signs. No increased pain that would suggest complication. Warfarin adherence confirmed.',
    severity: 'mild',
  },
  {
    id: '11',
    name: 'Appetite or weight change',
    tagline: 'Stable',
    description: 'No significant appetite or weight change. Patient reports eating regularly. No nausea, vomiting, or early satiety.',
    severity: 'mild',
  },
  {
    id: '12',
    name: 'Side effects from medications',
    tagline: 'None reported',
    description: 'Patient denies new or worsening side effects from current medications. No bruising, bleeding, or GI upset. Tolerating regimen well.',
    severity: 'mild',
  },
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
