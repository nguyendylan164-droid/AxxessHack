import type { EscalationItem } from '../types/tasks'

export interface EscalationsPanelProps {
  escalations: EscalationItem[]
}

export function EscalationsPanel({ escalations }: EscalationsPanelProps) {
  return (
    <aside className="escalations-panel">
      <h2 className="panel-title">Escalations</h2>
      <p className="panel-desc">Issues and progression spikes for follow-up.</p>
      <ul className="escalation-list">
        {escalations.map((e) => (
          <li key={e.id} className={`escalation-item escalation-item--${e.severity}`}>
            <span className="escalation-item-title">{e.title}</span>
            <span className="escalation-item-detail">{e.detail}</span>
          </li>
        ))}
      </ul>
      {escalations.length === 0 && <p className="panel-empty">No escalations.</p>}
    </aside>
  )
}
