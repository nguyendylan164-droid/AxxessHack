import { SwipeStack } from './SwipeStack'
import type { SwipeStackCard } from './SwipeStack'

export interface ReviewQueueProps {
  items: SwipeStackCard[]
  onEscalate: (item: SwipeStackCard) => void
  onNoAction: (item: SwipeStackCard) => void
  onReset: () => void
  /** When true, section and cards use full-screen layout (client view) */
  fullScreen?: boolean
  /** When true, interactions have no effect (e.g. clinician viewing client card) */
  disabled?: boolean
}

export function ReviewQueue({ items, onEscalate, onNoAction, onReset, fullScreen, disabled }: ReviewQueueProps) {
  const handleChoice = (direction: 'left' | 'right') => {
    if (items.length === 0 || disabled) return
    const top = items[0]
    if (direction === 'left') {
      onEscalate(top)
    } else {
      onNoAction(top)
    }
  }

  return (
    <div className={`review-section ${fullScreen ? 'review-section--full' : ''}`}>
      {!fullScreen && (
        <>
          <h2 className="section-title">Review queue</h2>
          <p className="section-desc">Confirm on track or escalate for follow-up.</p>
        </>
      )}
      {items.length === 0 ? (
        <div className="card-empty">
          <p className="card-empty-text">Queue clear</p>
          <button type="button" className="btn-reset" onClick={onReset} disabled={disabled}>
            Reload sample
          </button>
        </div>
      ) : (
        <SwipeStack cards={items} onChoice={handleChoice} fullScreen={fullScreen} disabled={disabled} />
      )}
    </div>
  )
}
