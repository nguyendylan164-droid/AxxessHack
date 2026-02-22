export function About() {
  return (
    <div className="about-page">
      <div className="about-container">
        <div className="about-left">
          <img
            src="/about-hero.png"
            alt="Healthcare technology and online medical consultation"
            className="about-image"
          />
        </div>
        <div className="about-right">
          <span className="about-pretitle">CLINICIAN SUPPORT</span>
          <h1 className="about-title">
            About <span className="about-title-accent">Us</span>
          </h1>
          <p className="about-lead">
            This application takes patient-reported symptom data and turns it into actionable insights for clinicians. By tracking symptoms over time, it helps identify trends, detect concerning changes, and escalate when necessary.
          </p>
          <div className="about-contact">
            <a href="mailto:axxess@gmail.com" className="about-contact-item">
              Our Email: axxess@gmail.com
            </a>
            <a href="tel:+14694129063" className="about-contact-item">
              Phone Number: 469-412-9063
            </a>
          </div>
        </div>
      </div>
      <p className="about-attribution">
        Image from <a href="https://www.freepik.com" target="_blank" rel="noopener noreferrer">Freepik</a>
      </p>
    </div>
  );
}
