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
          <p className="about-lead">
            Our goal is to make the clinician&apos;s job easier: automate what can be automated, and escalate when something is wrong or when the medical history shows a progression spike. We combine AI-powered analysis with clear, intuitive workflows so you can focus on patient care.
          </p>
          <ul className="about-features">
          </ul>
          <div className="about-contact">
            <span className="about-contact-label">Contact</span>
            <a href="mailto:axxess@gmail.com" className="about-contact-item">
              Email: axxess@gmail.com
            </a>
            <a href="tel:+14694129063" className="about-contact-item">
              Phone Number: 469-412-9063
            </a>
            <p className="about-address">Headquarters: 16000 Dallas Parkway, Suite 700N Dallas, TX 75248</p>
          </div>
        </div>
      </div>
      <p className="about-attribution">
        Image from <a href="https://www.freepik.com" target="_blank" rel="noopener noreferrer">Freepik</a>
      </p>
    </div>
  );
}
