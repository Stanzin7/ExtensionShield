import React from 'react';
import './SummaryPanel.scss';
import { normalizeHighlights } from '../../utils/normalizeScanResult';

/**
 * SummaryPanel - Human-readable summary using LLM-generated content when available
 * 
 * Shows:
 * - One-liner summary (from LLM if available)
 * - Key points (from LLM why_this_score or fallback to deterministic)
 * - Key findings (top 2-3 findings, no tags)
 * - What to watch (if available)
 * 
 * Props:
 * - scores: ScoresVM - Contains decision and reasons
 * - factorsByLayer: FactorsByLayerVM - All factors
 * - rawScanResult: RawScanResult - Raw scan data to access LLM summary
 * - keyFindings: KeyFindingVM[] - Key findings to display
 * - onViewEvidence: (evidenceIds: string[]) => void - Callback for viewing evidence
 */
const SummaryPanel = ({ 
  scores = {},
  factorsByLayer = {},
  rawScanResult = null,
  keyFindings = [],
  onViewEvidence = null
}) => {
  // Use unified normalization helper for highlights
  const { oneLiner, keyPoints, whatToWatch } = normalizeHighlights(rawScanResult);

  // If we have no oneLiner and no keyPoints, it's really empty
  if (!oneLiner && keyPoints.length === 0) {
    return null;
  }

  const getDecisionBadge = () => {
    const decision = scores?.decision;
    if (!decision) return null;

    const badges = {
      'ALLOW': { label: 'Safe', color: '#10B981', icon: '✓' },
      'WARN': { label: 'Review', color: '#F59E0B', icon: '⚡' },
      'BLOCK': { label: 'Blocked', color: '#EF4444', icon: '✕' },
    };

    const badge = badges[decision] || badges['WARN'];
    return (
      <span 
        className="decision-badge"
        style={{ backgroundColor: badge.color }}
      >
        <span className="badge-icon">{badge.icon}</span>
        <span className="badge-text">{badge.label}</span>
      </span>
    );
  };

  return (
    <section className="summary-panel">
      <div className="summary-header">
        <h2 className="summary-title">
          <span className="title-icon">✨</span>
          Quick Summary
        </h2>
        {getDecisionBadge()}
      </div>

      <div className="summary-content">
        {/* One-liner summary - Prominent */}
        {oneLiner && (
          <div className="summary-one-liner-wrapper">
            <p className="summary-one-liner">
              {oneLiner}
            </p>
          </div>
        )}

        {/* Key Points - Visual cards */}
        {keyPoints.length > 0 && (
          <div className="summary-section key-points">
            <h3 className="section-subtitle">
              <span className="subtitle-icon">📌</span>
              Why This Score
            </h3>
            <div className="key-points-grid">
              {keyPoints.map((point, idx) => (
                <div key={idx} className="key-point-card">
                  <span className="point-number">{idx + 1}</span>
                  <p className="point-text">{point}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What to Watch - Compact warnings */}
        {whatToWatch.length > 0 && (
          <div className="summary-section what-to-watch">
            <h3 className="section-subtitle">
              <span className="subtitle-icon">👀</span>
              What to Watch
            </h3>
            <div className="watch-items">
              {whatToWatch.map((item, idx) => (
                <div key={idx} className="watch-item">
                  <span className="watch-icon">⚠️</span>
                  <span className="watch-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SummaryPanel;

