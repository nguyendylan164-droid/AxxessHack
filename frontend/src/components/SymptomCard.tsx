/**
 * Display card for a symptom in the review stack.
 * Props align with stack card content: name, tagline, optional severity.
 */
export interface SymptomCardProps {
  name: string
  tagline: string
  severity?: 'mild' | 'moderate' | 'severe'
}

export function SymptomCard({ name, tagline, severity }: SymptomCardProps) {
  return (
    <div className="stack-card-inner">
      {severity && (
        <span className={`stack-card-severity stack-card-severity--${severity}`}>
          {severity}
        </span>
      )}
      <h3 className="stack-card-name">{name}</h3>
      <p className="stack-card-tagline">{tagline}</p>
    </div>
  )
}
