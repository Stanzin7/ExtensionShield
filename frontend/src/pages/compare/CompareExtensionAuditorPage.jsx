import React from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../../components/SEOHead";
import "./ComparePage.scss";

const CANONICAL_DOMAIN = "https://extensionshield.com";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Home", "item": `${CANONICAL_DOMAIN}/` },
    { "@type": "ListItem", "position": 2, "name": "Compare Scanners", "item": `${CANONICAL_DOMAIN}/compare` },
    { "@type": "ListItem", "position": 3, "name": "ExtensionShield vs ExtensionAuditor", "item": `${CANONICAL_DOMAIN}/compare/extension-auditor` }
  ]
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "How does ExtensionShield compare to Extension Auditor?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "ExtensionShield offers transparent three-layer risk scoring (Security 50%, Privacy 30%, Governance 20%) with SAST and VirusTotal integration. Extension Auditor uses a closed methodology with 2-hour monitoring cadence. ExtensionShield is open source, free for public scans, and provides evidence per finding — Extension Auditor starts at $299/month for business plans."
      }
    },
    {
      "@type": "Question",
      "name": "Is ExtensionShield a good Extension Auditor alternative?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. ExtensionShield provides deeper analysis (SAST + VirusTotal + governance), transparent open-source methodology, and a free tier. For developers and lean security teams, ExtensionShield delivers better transparency at lower cost than Extension Auditor."
      }
    }
  ]
};

const CompareExtensionAuditorPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="ExtensionShield vs Extension Auditor | Best Chrome Extension Security Scanner Comparison"
        description="ExtensionShield vs Extension Auditor: compare chrome extension security scanners. Open-source transparent scoring vs closed methodology. Free extension scanner with SAST, VirusTotal, and governance."
        pathname="/compare/extension-auditor"
        ogType="website"
        keywords="Extension Auditor alternative, extensionauditor.com alternative, ExtensionShield vs Extension Auditor, best chrome extension scanner, browser extension security scanner comparison"
        schema={[breadcrumbSchema, faqSchema]}
      />

      <div className="compare-page">
        <div className="compare-container">
          <div className="compare-back-wrapper">
          <button type="button" className="compare-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          </div>
          <header className="compare-header">
            <h1>ExtensionShield vs Extension Auditor</h1>
            <p>
              Extension Auditor is your most direct product competitor in browser extension security governance. Here's why developers, security researchers, and lean security teams choose ExtensionShield's open-source approach.
            </p>
          </header>

          <div className="compare-prose">
            <h2>What is Extension Auditor?</h2>
            <p>
              <strong>Extension Auditor</strong> (extensionauditor.com) positions around identifying, assessing, and blocking unsafe extensions for organizations. It claims research-backed scoring, a 2-hour monitoring cadence tracking 11 event types, and business-tier pricing starting at $299/month. It runs as a browser extension with on-device processing and supports Chrome, Edge, Opera, and Brave.
            </p>

            <h2>How ExtensionShield is different</h2>
            <p>
              <strong>ExtensionShield</strong> delivers a <strong>chrome extension risk score</strong> (0-100) with three documented layers: Security (50%), Privacy (30%), and Governance (20%). Unlike Extension Auditor's closed methodology, our scoring is fully transparent — every finding links to evidence, and the engine is <a href="https://github.com/Stanzin7/ExtensionShield" target="_blank" rel="noopener noreferrer">open source on GitHub</a>.
            </p>

            <h2>Key differences</h2>
            <div className="compare-table-wrapper">
              <table className="compare-table">
                <thead>
                  <tr>
                    <th>Capability</th>
                    <th>ExtensionShield</th>
                    <th>Extension Auditor</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>Free scans</td><td>Yes — unlimited, no signup</td><td>Limited free tier</td></tr>
                  <tr><td>Scoring transparency</td><td>Fully open, documented methodology</td><td>Closed, "research-backed"</td></tr>
                  <tr><td>Open source</td><td>Yes (GitHub)</td><td>No</td></tr>
                  <tr><td>SAST analysis</td><td>Yes (Semgrep)</td><td>Not documented</td></tr>
                  <tr><td>VirusTotal integration</td><td>Yes</td><td>Not documented</td></tr>
                  <tr><td>Private CRX/ZIP audit</td><td>Yes (Pro)</td><td>Not documented</td></tr>
                  <tr><td>Governance layer</td><td>Yes (policy, disclosure, compliance)</td><td>Extension blocking/approval</td></tr>
                  <tr><td>Web-based scanning</td><td>Yes — no install needed</td><td>Browser extension required</td></tr>
                  <tr><td>Pricing</td><td>Free / Pro / Enterprise</td><td>$299/month+ (Business)</td></tr>
                  <tr><td>Developer workflow</td><td>Pre-install, pre-release, CI gating</td><td>Organization governance focused</td></tr>
                  <tr><td>Evidence per finding</td><td>Yes — linked to specific signals</td><td>Color-coded risk levels</td></tr>
                </tbody>
              </table>
            </div>

            <h2>Why ExtensionShield wins for most teams</h2>
            <ul>
              <li><strong>Transparency:</strong> "Show me proof" beats "trust our model." Every finding links to the specific permission, code pattern, or network domain that triggered it.</li>
              <li><strong>Developer-first:</strong> Pre-install scan, pre-release CRX/ZIP audit, and CI gating — not just admin-panel governance.</li>
              <li><strong>Open source:</strong> Verify methodology, reproduce results, contribute detection rules. Closed-source tools can't offer this trust model.</li>
              <li><strong>Cost:</strong> Free public scans vs $299/month minimum. Better for startups, small IT teams, and security researchers.</li>
              <li><strong>No install required:</strong> Scan any extension via web app — Extension Auditor requires installing a browser extension to assess browser extensions.</li>
            </ul>
          </div>

          <div className="compare-links">
            <h3>More comparisons</h3>
            <ul>
              <li><Link to="/compare">Best chrome extension security scanner</Link></li>
              <li><Link to="/compare/spin-ai">ExtensionShield vs Spin.AI</Link></li>
              <li><Link to="/compare/crxcavator">ExtensionShield vs CRXcavator</Link></li>
              <li><Link to="/compare/crxplorer">ExtensionShield vs CRXplorer</Link></li>
            </ul>
          </div>

          <div className="compare-cta">
            <Link to="/scan">Try ExtensionShield free — scan any extension →</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompareExtensionAuditorPage;
