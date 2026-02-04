import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import "./ContributePage.scss";

const ContributePage = () => {
  return (
    <>
      <Helmet>
        <title>Contribute to ExtensionShield | Open Source</title>
        <meta name="description" content="How to contribute to ExtensionShield: setup guide, contribution guidelines, code standards, and getting started with your first PR." />
        <link rel="canonical" href="https://extensionaudit.com/contribute" />
      </Helmet>

      <div className="contribute-page">
        <div className="contribute-bg">
          <div className="bg-gradient" />
        </div>

        <div className="contribute-content">
          <header className="contribute-header">
            <h1>Contribute to ExtensionShield</h1>
            <p>
              ExtensionShield is open source. We welcome contributions of all kinds—
              code, documentation, bug reports, and ideas.
            </p>
          </header>

          <section className="contribute-section">
            <h2>Getting Started</h2>
            <div className="steps-grid">
              <div className="step-card">
                <div className="step-number">1</div>
                <h3>Fork the Repository</h3>
                <p>
                  Fork <a href="https://github.com/user/ExtensionShield" target="_blank" rel="noopener noreferrer">ExtensionShield on GitHub</a> and 
                  clone your fork locally.
                </p>
                <pre className="code-block">
                  git clone https://github.com/YOUR_USERNAME/ExtensionShield.git
                </pre>
              </div>
              <div className="step-card">
                <div className="step-number">2</div>
                <h3>Set Up Development Environment</h3>
                <p>Install dependencies and start the development server.</p>
                <pre className="code-block">
{`cd ExtensionShield
make install
make dev`}
                </pre>
              </div>
              <div className="step-card">
                <div className="step-number">3</div>
                <h3>Find an Issue</h3>
                <p>
                  Browse <a href="https://github.com/user/ExtensionShield/issues" target="_blank" rel="noopener noreferrer">open issues</a>. 
                  Look for "good first issue" labels if you're new.
                </p>
              </div>
              <div className="step-card">
                <div className="step-number">4</div>
                <h3>Submit a Pull Request</h3>
                <p>
                  Create a branch, make your changes, and open a PR. 
                  Include a clear description of what you changed and why.
                </p>
              </div>
            </div>
          </section>

          <section className="contribute-section">
            <h2>Ways to Contribute</h2>
            <div className="ways-grid">
              <div className="way-card">
                <div className="way-icon">🐛</div>
                <h3>Report Bugs</h3>
                <p>Found a bug? Open an issue with steps to reproduce.</p>
              </div>
              <div className="way-card">
                <div className="way-icon">📝</div>
                <h3>Improve Docs</h3>
                <p>Help us improve documentation, tutorials, and guides.</p>
              </div>
              <div className="way-card">
                <div className="way-icon">🔍</div>
                <h3>Add Detection Rules</h3>
                <p>Contribute new Semgrep rules for detecting threats.</p>
              </div>
              <div className="way-card">
                <div className="way-icon">🧪</div>
                <h3>Write Tests</h3>
                <p>Increase test coverage and help prevent regressions.</p>
              </div>
              <div className="way-card">
                <div className="way-icon">🎨</div>
                <h3>Design & UX</h3>
                <p>Improve the user interface and experience.</p>
              </div>
              <div className="way-card">
                <div className="way-icon">💡</div>
                <h3>Suggest Features</h3>
                <p>Have an idea? Open a discussion to share it.</p>
              </div>
            </div>
          </section>

          <section className="contribute-section">
            <h2>Code Standards</h2>
            <ul className="standards-list">
              <li><strong>Python:</strong> Follow PEP 8, use type hints, run ruff/black</li>
              <li><strong>JavaScript:</strong> ESLint + Prettier, React hooks best practices</li>
              <li><strong>Tests:</strong> Write tests for new features, maintain coverage</li>
              <li><strong>Commits:</strong> Use conventional commits (feat:, fix:, docs:)</li>
              <li><strong>PRs:</strong> Keep them focused, one feature/fix per PR</li>
            </ul>
          </section>

          <div className="contribute-cta">
            <h3>Ready to get started?</h3>
            <div className="cta-buttons">
              <a 
                href="https://github.com/Stanzin7/ExtensionShield" 
                target="_blank" 
                rel="noopener noreferrer"
                className="cta-button primary"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="github-icon">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
                View on GitHub
              </a>
              <Link to="/gsoc/community" className="cta-button secondary">
                Join Community
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContributePage;

