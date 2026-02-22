export function About() {
  return (
    <div className="about-page">
      <h1>About</h1>
      <p className="about-lead">
        This application helps clinicians track patient progress between visits by taking in the
        patient&apos;s medical record and feeding back a clear view of progress—with AI doing as much of
        the work as possible.
      </p>
      <ul className="about-features">
        <li>
          <strong>Progress tracking</strong> — See how the patient is doing between visits, with summaries and trends.
        </li>
        <li>
          <strong>AI automation</strong> — Summaries, trend detection, and flagging are automated so you can focus on decisions.
        </li>
        <li>
          <strong>Escalation</strong> — Progression spikes and concerning changes are escalated so nothing slips through.
        </li>
      </ul>
      <p className="about-close">
        The goal is to make the clinician&apos;s job easier: automate what can be automated, and
        escalate when something is wrong or when the medical history shows a progression spike.
      </p>
    </div>
  )
}
