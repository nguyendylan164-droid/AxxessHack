import { useState, useCallback } from 'react'
import { SymptomCard } from './SymptomCard'

const EXIT_DURATION_MS = 380

export interface SwipeStackCard {
  id: string
  name: string
  tagline: string
  description?: string
  severity?: 'mild' | 'moderate' | 'severe'
}

export interface SwipeStackProps {
  cards: SwipeStackCard[]
  onChoice: (direction: 'left' | 'right') => void
  disabled?: boolean
  fullScreen?: boolean
}

export function SwipeStack({ cards, onChoice, disabled, fullScreen }: SwipeStackProps) {
  const [exiting, setExiting] = useState<{ id: string; direction: 'left' | 'right' } | null>(null)

  const handleChoice = useCallback(
    (direction: 'left' | 'right') => {
      if (cards.length === 0 || exiting || disabled) return
      const top = cards[0]
      setExiting({ id: top.id, direction })
      window.setTimeout(() => {
        onChoice(direction)
        setExiting(null)
      }, EXIT_DURATION_MS)
    },
    [cards, exiting, disabled, onChoice]
  )

  const visibleStack = cards.slice(0, 3)

  return (
    <div className={`card-stack-wrap ${fullScreen ? 'card-stack-wrap--full' : ''}`}>
      <div className={`card-stack ${fullScreen ? 'card-stack--full' : ''}`}>
        {visibleStack.map((card, index) => {
          const isTop = index === 0
          const isExiting = exiting?.id === card.id
          const exitDir = exiting?.direction
          return (
            <div
              key={card.id}
              className={`stack-card ${isTop ? 'stack-card--top' : 'stack-card--back'} ${isExiting ? `stack-card--exit-${exitDir}` : ''}`}
              style={isExiting ? { transitionDuration: `${EXIT_DURATION_MS}ms` } : undefined}
            >
              <SymptomCard name={card.name} tagline={card.tagline} description={card.description} severity={card.severity} />
            </div>
          )
        })}
      </div>
      {cards.length === 0 ? null : (
        <div className="card-actions">
          <button
            type="button"
            className="card-btn card-btn--nope"
            onClick={() => handleChoice('left')}
            disabled={!!exiting || !!disabled}
            aria-label="Disagree"
          >
            <span className="card-btn-label">Disagree</span>
          </button>
          <button
            type="button"
            className="card-btn card-btn--match"
            onClick={() => handleChoice('right')}
            disabled={!!exiting || !!disabled}
            aria-label="Agree"
          >
            <span className="card-btn-label">Agree</span>
          </button>
        </div>
      )}
    </div>
  )
}
