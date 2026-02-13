import React from "react";
import "./ScoreCard.scss";

const ScoreCard = ({
  title,
  percent,
  findings,
  statusLabel,
  statusColor,
  progressColor,
  delay = 0,
  animateProgress = false
}) => {
  return (
    <article
      className="score-card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="score-card-header">
        <p className="score-card-title">{title}</p>
        <span className="score-card-percent">{percent}%</span>
      </div>

      <div className="score-card-status-row">
        <span
          className="score-card-pill"
          style={{ borderColor: statusColor, color: statusColor }}
        >
          {statusLabel}
        </span>
        <span className="score-card-findings">{findings}</span>
      </div>

      <div className="score-card-progress-track" aria-hidden="true">
        <div
          className="score-card-progress-fill"
          style={{
            width: animateProgress ? `${percent}%` : "0%",
            backgroundColor: progressColor
          }}
        />
      </div>
    </article>
  );
};

export default ScoreCard;
