import { SwipeStack } from './SwipeStack'
import type { SwipeStackCard } from './SwipeStack'

export interface ReviewQueueProps {
  items: SwipeStackCard[]
  onAgree: (item: SwipeStackCard) => void
  onDisagree: (item: SwipeStackCard) => void
  onReset: () => void
  /** When true, section and cards use full-screen layout (client view) */
  fullScreen?: boolean
  /** When true, interactions have no effect (e.g. clinician viewing client card) */
  disabled?: boolean
}

export function ReviewQueue({ items, onAgree, onDisagree, onReset, fullScreen, disabled }: ReviewQueueProps) {
  const handleChoice = (direction: 'left' | 'right') => {
    if (items.length === 0 || disabled) return
    const top = items[0]
    if (direction === 'left') {
      onDisagree(top)
    } else {
      onAgree(top)
    }
  }

  return (
    <div className={`review-section ${fullScreen ? 'review-section--full' : ''}`}>
      {!fullScreen && (
        <>
          <h2 className="section-title">Review queue</h2>
          <p className="section-desc">Agree if this needs attention, disagree to dismiss.</p>
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
