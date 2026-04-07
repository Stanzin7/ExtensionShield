import React from "react";
import { Link, useNavigate } from "react-router-dom";
import SEOHead from "../../components/SEOHead";
import "./ComparePage.scss";

const CompareIndexPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Best Chrome Extension Security Scanner 2026 | Spin.AI & CRXcavator Alternatives"
        description="Compare the best chrome extension security scanners. ExtensionShield vs Spin.AI, ExtensionAuditor, CRXcavator, CRXplorer. Free open-source extension risk scanner with transparent scoring, SAST, and governance."
        pathname="/compare"
        ogType="website"
        keywords="best chrome extension scanner, Spin.AI alternative, CRXcavator alternative, Extension Auditor alternative, chrome extension security scanner comparison, browser extension risk assessment tool"
      />

      <div className="compare-page">
        <div className="compare-container">
          <div className="compare-back-wrapper">
          <button type="button" className="compare-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          </div>

          <header className="compare-header">
            <h1>Best Chrome Extension Security Scanner</h1>
            <p>
              Compare chrome extension security scanners and extension risk score tools. See how ExtensionShield stacks up against CRXcavator, CRXplorer, and ExtensionAuditor — and why teams choose us for browser extension security audit and extension governance.
            </p>
          </header>

          <div className="compare-prose">
            <p>
              Choosing the right <strong>chrome extension security scanner</strong> or <strong>browser extension security scanner</strong> matters for security, privacy, and compliance. ExtensionShield provides a <strong>chrome extension risk score</strong> built on three layers (Security, Privacy, Governance), plus a <strong>chrome extension permissions checker</strong>, malware scanning, and <strong>audit chrome extension security</strong> reports — so you can <strong>check if a chrome extension is safe</strong> before installing.
            </p>

            <p>
              Looking for <strong>Spin.AI alternatives</strong> or <strong>CRXcavator alternatives</strong>? ExtensionShield is the only <strong>open-source chrome extension scanner</strong> with production-grade risk scoring. Unlike Spin.AI's opaque ML-based scoring or Extension Auditor's closed methodology, our analysis is fully transparent — every finding links to evidence, and the scoring engine is <a href="https://github.com/Stanzin7/ExtensionShield" target="_blank" rel="noopener noreferrer">open source on GitHub</a>. Below we compare ExtensionShield to every major competitor.
            </p>
          </div>

          <div className="compare-links">
            <h3>ExtensionShield vs competitors</h3>
            <ul>
              <li><Link to="/compare/spin-ai">ExtensionShield vs Spin.AI (SpinCRX)</Link></li>
              <li><Link to="/compare/extension-auditor">ExtensionShield vs ExtensionAuditor</Link></li>
              <li><Link to="/compare/crxcavator">ExtensionShield vs CRXcavator</Link></li>
              <li><Link to="/compare/crxplorer">ExtensionShield vs CRXplorer</Link></li>
            </ul>
          </div>

          <div className="compare-cta">
            <Link to="/scan">Scan an extension with ExtensionShield →</Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default CompareIndexPage;
