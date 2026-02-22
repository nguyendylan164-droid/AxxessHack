import type { EscalationItem } from '../types/tasks'

export interface EscalationsPanelProps {
  escalations: EscalationItem[]
}

export function EscalationsPanel({ escalations }: EscalationsPanelProps) {
  return (
    <aside className="escalations-panel">
      <h2 className="panel-title">Notice</h2>
      <p className="panel-desc">Items you agreed need attention, plus check-in alerts.</p>
      <ul className="escalation-list">
        {escalations.map((e) => (
          <li key={e.id} className={`escalation-item escalation-item--${e.severity}`}>
            <span className="escalation-item-title">{e.title}</span>
            <span className="escalation-item-detail">{e.detail}</span>
          </li>
        ))}
      </ul>
      {escalations.length === 0 && <p className="panel-empty">No notices yet.</p>}
    </aside>
  )
}
