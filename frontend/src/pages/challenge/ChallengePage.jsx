import React from "react";
import { Link } from "react-router-dom";
import SEOHead from "../../components/SEOHead";
import RainfallDroplets from "../../components/RainfallDroplets";
import { EDITIONS } from "./editions";
import "./ChallengePage.scss";

/**
 * /challenge — the challenge program hub. Lists editions as cards; each links to
 * its full brief at /challenge/<slug>. Kept intentionally light: the detailed
 * content lives on the edition page.
 */
const ChallengePage = () => {
  const active = EDITIONS.find((e) => e.statusVariant === "active") || EDITIONS[0];

  return (
    <>
      <SEOHead
        title="Threat Report Challenge — Browser Extension Safety | ExtensionShield"
        description="The ExtensionShield Threat Report Challenge: learn to spot risky browser extensions, investigate permissions and privacy signals responsibly, and submit an evidence-backed report. Free to scan, no coding required."
        pathname="/challenge"
        keywords="browser extension safety challenge, chrome extension security challenge, threat report challenge, student security challenge"
      />

      <div className="challenge-page">
        <RainfallDroplets />

        <div className="challenge-content">
          {/* ---------- HERO ---------- */}
          <header className="challenge-hero">
            <div className="challenge-chips">
              <span className="chip chip--green">No coding competition</span>
              <span className="chip chip--blue">Anyone can participate</span>
            </div>
            <h1>ExtensionShield Threat Report Challenge</h1>
            <p className="challenge-lede">Secure yourself from harmful browser extensions.</p>
            <p className="challenge-sub">
              Learn to spot risky browser extensions, investigate their permissions and privacy
              signals responsibly, and turn what you find into a fair, evidence-backed report — then
              help people make safer browser choices.
            </p>
            <div className="challenge-cta">
              {active && (
                <Link to={`/challenge/${active.slug}`} className="btn btn--primary">View the challenge</Link>
              )}
              <Link to="/scan" className="btn btn--ghost">Open the scanner</Link>
            </div>
            <p className="challenge-hosts">Free to scan · No coding required · Evidence first</p>
          </header>

          {/* ---------- EDITIONS ---------- */}
          <section className="challenge-section">
            <h2 className="section-eyebrow">Current challenge</h2>
            <div className="editions-grid">
              {EDITIONS.map((ed) => (
                <Link key={ed.slug} to={`/challenge/${ed.slug}`} className="edition-card edition-card--link">
                  <div className="edition-head">
                    <span className="edition-tag">{ed.edition}</span>
                    <span className={`edition-status edition-status--${ed.statusVariant}`}>{ed.status}</span>
                  </div>
                  <h3>{ed.title}</h3>
                  <p className="edition-host">{ed.host}</p>
                  <p className="edition-desc">{ed.summary}</p>
                  <span className="link-inline">View challenge →</span>
                </Link>
              ))}
            </div>
            <p className="challenge-note">
              Future editions will appear here as the challenge program grows.
            </p>
          </section>
        </div>
      </div>
    </>
  );
};

export default ChallengePage;
