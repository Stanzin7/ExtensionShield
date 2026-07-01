import React from "react";
import { Link, Navigate } from "react-router-dom";
import SEOHead from "../../components/SEOHead";
import RainfallDroplets from "../../components/RainfallDroplets";
import { getEdition, CHROME_STORE_URL } from "./editions";
import "./ChallengePage.scss";

const ICONS = {
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
};

const ChallengeEditionPage = ({ slug }) => {
  const ed = getEdition(slug);
  if (!ed) return <Navigate to="/challenge" replace />;
  const c = ed.content;

  const challengeSchema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `ExtensionShield ${ed.title}`,
    description:
      "A student security challenge: investigate real Chrome Web Store extensions, weigh the evidence, and submit an evidence-backed threat report. No coding required.",
    url: `https://extensionshield.com/challenge/${ed.slug}`,
    eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    organizer: [
      { "@type": "Organization", name: "Nexus Spring of Code" },
      { "@type": "Organization", name: "ExtensionShield", url: "https://extensionshield.com" },
    ],
    ...(ed.schedule.startDate ? { startDate: ed.schedule.startDate } : {}),
    ...(ed.schedule.endDate ? { endDate: ed.schedule.endDate } : {}),
  };

  return (
    <>
      <SEOHead
        title={ed.seo.title}
        description={ed.seo.description}
        pathname={`/challenge/${ed.slug}`}
        keywords="browser extension safety challenge, chrome extension security challenge, threat report challenge, extension permissions, student security challenge"
        schema={challengeSchema}
      />

      <div className="challenge-page">
        <RainfallDroplets />

        <div className="challenge-content">
          <Link to="/challenge" className="challenge-back">← All challenges</Link>

          {/* ---------- HEADER ---------- */}
          <header className="challenge-hero">
            <div className="challenge-chips">
              <span className="chip chip--green">No coding competition</span>
              <span className="chip chip--blue">Anyone can participate</span>
            </div>
            <div className="hero-edition">
              <span className="edition-tag">{ed.edition}</span>
              <span className={`edition-status edition-status--${ed.statusVariant}`}>{ed.status}</span>
            </div>
            <h1>ExtensionShield {ed.title}</h1>
            <p className="challenge-lede">{c.lede}</p>
            <p className="challenge-sub">{c.intro}</p>
            <div className="challenge-cta">
              <Link to="/scan" className="btn btn--primary">Open the scanner</Link>
              <a href="#playbook" className="btn btn--ghost">How it works</a>
            </div>
            <p className="challenge-hosts">Hosted by {ed.host.split(" · ")[0]} · Challenge by ExtensionShield</p>
          </header>

          {/* ---------- HOW IT WORKS ---------- */}
          <section className="challenge-section" id="playbook">
            <h2>{c.playbookHeading}</h2>
            <p className="section-intro">{c.playbookIntro}</p>
            <div className="steps-grid">
              {c.howItStarts.map((s) => (
                <div key={s.n} className="step-card">
                  <span className="step-no">{s.n}</span>
                  <span className="step-icon" style={{ color: s.color }}>{ICONS[s.icon]}</span>
                  <h4>{s.title}</h4>
                  <p>{s.text}</p>
                  <span className="step-bar" style={{ background: s.color }} />
                </div>
              ))}
            </div>
          </section>

          {/* ---------- MISSION + RISK ---------- */}
          <section className="challenge-section">
            <div className="two-col">
              <div className="panel">
                <h3 className="panel-title">The 5-step mission</h3>
                <ol className="mission-list">
                  {c.mission.map((m) => (
                    <li key={m.n} className="mission-item">
                      <span className="mission-num">{m.n}</span>
                      <div>
                        <b>{m.title}</b>
                        <p>{m.text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="panel">
                <h3 className="panel-title">Risk classification</h3>
                <div className="risk-list">
                  {c.risks.map((r) => (
                    <div key={r.level} className={`risk-row risk-row--${r.variant}`}>
                      <span className="risk-dot" />
                      <div className="risk-body">
                        <div className="risk-head">
                          <span className="risk-level">{r.level}</span>
                          <span className="risk-rec">{r.rec}</span>
                        </div>
                        <p>{r.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="risk-note">{c.riskNote}</p>
              </div>
            </div>
          </section>

          {/* ---------- JUDGING ---------- */}
          <section className="challenge-section">
            <div className="panel">
              <h3 className="panel-title">What judges look for</h3>
              <div className="judges-grid">
                {c.judges.map((j) => (
                  <div key={j.title} className="judge-item">
                    <b>{j.title}</b>
                    <p>{j.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ---------- EXTENSION (OPTIONAL) ---------- */}
          <section className="challenge-section">
            <div className="panel panel--soft">
              <div className="panel-head">
                <h3 className="panel-title">Work faster with the extension</h3>
                <span className="tag-optional">Optional</span>
              </div>
              <div className="features-grid">
                {c.features.map((f) => (
                  <div key={f.title} className="feature-item">
                    <b>{f.title}</b>
                    <span>{f.text}</span>
                  </div>
                ))}
              </div>
              <a className="link-inline" href={CHROME_STORE_URL} target="_blank" rel="noopener noreferrer">
                Add ExtensionShield to Chrome ↗
              </a>
            </div>
          </section>

          {/* ---------- INTEGRITY + PRIZES ---------- */}
          <section className="challenge-section">
            <div className="two-col">
              <div className="panel">
                <h3 className="panel-title">Submission integrity</h3>
                <p className="panel-text">{c.integrity}</p>
              </div>
              <div className="panel panel--prize">
                <h3 className="panel-title">Cash prizes for top reports</h3>
                <p className="panel-text">{c.prizes}</p>
                <div className="medals">
                  <span>1st</span>
                  <span>2nd</span>
                  <span>3rd</span>
                </div>
              </div>
            </div>
          </section>

          {/* ---------- FINAL CTA ---------- */}
          <section className="challenge-final">
            <h3>Ready to start?</h3>
            <p>
              Free to scan. No payment required. Sign in only when you&apos;re ready to save, export,
              or submit an official report.
            </p>
            <Link to="/scan" className="btn btn--primary">Open the scanner</Link>
          </section>
        </div>
      </div>
    </>
  );
};

export default ChallengeEditionPage;
