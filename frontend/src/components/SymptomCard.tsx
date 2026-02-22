import './SymptomCard.css'

interface SymptomCardProps {
  subject: string
  description: string
  onYes?: () => void
  onNo?: () => void
}

export function SymptomCard({ subject, description, onYes, onNo }: SymptomCardProps) {
  return (
    <div className="symptom-card">
      <h3 className="symptom-card__subject">{subject}</h3>
      <p className="symptom-card__description">{description}</p>
      <div className="symptom-card__actions">
        <button
          className="symptom-card__btn symptom-card__btn--yes"
          onClick={onYes}
        >
          Yes
        </button>
        <button
          className="symptom-card__btn symptom-card__btn--no"
          onClick={onNo}
        >
          No
        </button>
      </div>
    </div>
  )
}
