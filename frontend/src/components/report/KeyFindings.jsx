import React from 'react';
import './KeyFindings.scss';

/**
 * KeyFindings - Displays key findings from the scan in an organized, visual way
 * 
 * Props from ReportViewModel:
 * - findings: KeyFindingVM[] - Array of key findings
 * - onViewEvidence: (evidenceIds: string[]) => void - Callback when clicking view evidence
 */
const KeyFindings = ({ 
  findings = [],
  onViewEvidence = null
}) => {
  // Don't render if no findings
  if (!findings || findings.length === 0) {
    return null;
  }

  const getSeverityConfig = (severity) => {
    switch (severity) {
      case 'high': 
        return { 
          icon: '🚨', 
          label: 'Critical', 
          color: '#EF4444',
          bgColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)'
        };
      case 'medium': 
        return { 
          icon: '⚠️', 
          label: 'Warning', 
          color: '#F59E0B',
          bgColor: 'rgba(245, 158, 11, 0.1)',
          borderColor: 'rgba(245, 158, 11, 0.3)'
        };
      case 'low': 
        return { 
          icon: '💡', 
          label: 'Info', 
          color: '#10B981',
          bgColor: 'rgba(16, 185, 129, 0.1)',
          borderColor: 'rgba(16, 185, 129, 0.3)'
        };
      default: 
        return { 
          icon: '📌', 
          label: 'Note', 
          color: '#6B7280',
          bgColor: 'rgba(107, 114, 128, 0.1)',
          borderColor: 'rgba(107, 114, 128, 0.3)'
        };
    }
  };

  const getLayerConfig = (layer) => {
    switch (layer) {
      case 'security': return { icon: '🛡️', label: 'Security', color: '#3B82F6' };
      case 'privacy': return { icon: '🔒', label: 'Privacy', color: '#8B5CF6' };
      case 'governance': return { icon: '📋', label: 'Governance', color: '#EC4899' };
      default: return { icon: '📊', label: 'General', color: '#6B7280' };
    }
  };

  const handleViewEvidence = (evidenceIds) => {
    if (onViewEvidence && evidenceIds && evidenceIds.length > 0) {
      onViewEvidence(evidenceIds);
    }
  };

  // Sort by severity (high > medium > low) and take top 3-5 for better visibility
  const sortedFindings = [...findings].sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return (severityOrder[b.severity] || 0) - (severityOrder[a.severity] || 0);
  }).slice(0, 5);

  // Don't render if no findings after filtering
  if (sortedFindings.length === 0) {
    return null;
  }

  return (
    <section className="key-findings-section">
      <div className="section-header">
        <h2 className="section-title">
          <span className="title-icon">🔍</span>
          Detailed Analysis
        </h2>
        {findings.length > sortedFindings.length && (
          <span className="findings-count-badge">
            Showing {sortedFindings.length} of {findings.length}
          </span>
        )}
      </div>

      <div className="findings-grid">
        {sortedFindings.map((finding, idx) => {
          const severityConfig = getSeverityConfig(finding.severity);
          const layerConfig = getLayerConfig(finding.layer);
          
          return (
            <div 
              key={idx} 
              className="finding-card"
              style={{
                '--severity-color': severityConfig.color,
                '--severity-bg': severityConfig.bgColor,
                '--severity-border': severityConfig.borderColor,
              }}
            >
              <div className="card-header">
                <div className="severity-badge" style={{ 
                  backgroundColor: severityConfig.bgColor,
                  borderColor: severityConfig.borderColor,
                  color: severityConfig.color
                }}>
                  <span className="severity-icon">{severityConfig.icon}</span>
                  <span className="severity-label">{severityConfig.label}</span>
                </div>
                <div className="layer-badge" style={{ color: layerConfig.color }}>
                  <span className="layer-icon">{layerConfig.icon}</span>
                  <span className="layer-label">{layerConfig.label}</span>
                </div>
              </div>

              <div className="card-content">
                <h3 className="finding-title">{finding.title}</h3>
                
                {finding.summary && finding.summary !== finding.title && (
                  <p className="finding-summary">{finding.summary}</p>
                )}
              </div>

              {finding.evidenceIds && finding.evidenceIds.length > 0 && onViewEvidence && (
                <div className="card-footer">
                  <button 
                    className="view-evidence-btn"
                    onClick={() => handleViewEvidence(finding.evidenceIds)}
                  >
                    <span className="btn-icon">📄</span>
                    <span className="btn-text">View Evidence</span>
                    <span className="btn-count">({finding.evidenceIds.length})</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default KeyFindings;

