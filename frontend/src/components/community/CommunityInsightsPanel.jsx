import React, { useState, useCallback, useMemo } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import "./CommunityInsightsPanel.scss";

const STORAGE_KEY_PREFIX = "community:";
const MAX_SUBMISSIONS_PER_DAY = 3;
const NOTE_MAX_LENGTH = 280;

function getStorageKey(extensionId) {
  return `${STORAGE_KEY_PREFIX}${extensionId}`;
}

function loadEntries(extensionId) {
  try {
    const raw = localStorage.getItem(getStorageKey(extensionId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(extensionId, entries) {
  try {
    localStorage.setItem(getStorageKey(extensionId), JSON.stringify(entries));
  } catch {
    // ignore
  }
}

function countEmojis(text) {
  if (!text || typeof text !== "string") return 0;
  const match = text.match(/\p{Emoji}/gu);
  return match ? match.length : 0;
}

function isSpamNote(note) {
  if (!note || !note.trim()) return false;
  if (/https?:\/\//i.test(note)) return true;
  if (note.includes("@")) return true;
  if (countEmojis(note) > 2) return true;
  return false;
}

function submissionsToday(entries) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return entries.filter((e) => e.createdAt && new Date(e.createdAt).getTime() >= todayStart);
}

/**
 * CommunityInsightsPanel - Vote, safety note, safer alternative (localStorage)
 * Spam guard: no http(s)/@ in note, max 2 emojis. Rate limit: 3 per 24h per extension.
 */
const CommunityInsightsPanel = ({ extensionId }) => {
  const [vote, setVote] = useState(null);
  const [note, setNote] = useState("");
  const [alternative, setAlternative] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [entries, setEntries] = useState(() => loadEntries(extensionId));

  const entriesSorted = useMemo(() => {
    return [...entries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [entries]);

  const recentEntries = entriesSorted.slice(0, 3);
  const todayCount = useMemo(() => submissionsToday(entries).length, [entries]);
  const atRateLimit = todayCount >= MAX_SUBMISSIONS_PER_DAY;

  const spamError = useMemo(() => {
    if (!note.trim()) return null;
    if (isSpamNote(note)) return "Links and handles aren't allowed yet.";
    return null;
  }, [note]);

  const canSubmit = useCallback(() => {
    if (atRateLimit) return false;
    if (spamError) return false;
    const hasVote = vote != null && vote !== "";
    const hasNote = note.trim().length > 0;
    const hasAlternative = alternative.trim().length > 0;
    return hasVote || hasNote || hasAlternative;
  }, [vote, note, alternative, atRateLimit, spamError]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      setSubmitError("");
      if (!canSubmit()) return;
      if (atRateLimit) {
        setSubmitError("You've hit today's limit for this extension.");
        return;
      }
      if (spamError) {
        setSubmitError(spamError);
        return;
      }

      const newEntry = {
        createdAt: new Date().toISOString(),
        vote: vote ?? null,
        note: note.trim() || null,
        alternative: alternative.trim() || null,
      };

      const next = [newEntry, ...entries];
      setEntries(next);
      saveEntries(extensionId, next);

      setVote(null);
      setNote("");
      setAlternative("");
    },
    [extensionId, vote, note, alternative, entries, canSubmit, atRateLimit, spamError]
  );

  if (!extensionId) return null;

  return (
    <section
      className="community-insights-panel"
      aria-labelledby="community-insights-title"
    >
      <h2 id="community-insights-title" className="community-insights-title">
        Community Insights
      </h2>

      <form onSubmit={handleSubmit} className="community-insights-form" noValidate>
        <div className="community-insights-field">
          <span id="vote-label" className="field-label">
            Would you install this?
          </span>
          <div
            className="vote-buttons"
            role="group"
            aria-labelledby="vote-label"
          >
            {[
              { value: "yes", label: "Yes" },
              { value: "no", label: "No" },
              { value: "unsure", label: "Unsure" },
            ].map(({ value, label }) => (
              <Button
                key={value}
                type="button"
                variant={vote === value ? "default" : "outline"}
                size="sm"
                aria-pressed={vote === value}
                onClick={() => setVote((v) => (v === value ? null : value))}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>

        <div className="community-insights-field">
          <label htmlFor="community-safety-note" className="field-label">
            Add a safety note
          </label>
          <Textarea
            id="community-safety-note"
            maxLength={NOTE_MAX_LENGTH}
            placeholder="Optional — no links or @handles"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={spamError ? "community-input-error" : ""}
            aria-invalid={!!spamError}
            aria-describedby={spamError ? "community-note-error" : undefined}
          />
          <span className="char-count" aria-live="polite">
            {note.length}/{NOTE_MAX_LENGTH}
          </span>
          {spamError && (
            <p id="community-note-error" className="field-error" role="alert">
              {spamError}
            </p>
          )}
        </div>

        <div className="community-insights-field">
          <label htmlFor="community-alternative" className="field-label">
            Suggest a safer alternative
          </label>
          <Input
            id="community-alternative"
            type="text"
            placeholder="Extension URL or ID (optional)"
            value={alternative}
            onChange={(e) => setAlternative(e.target.value)}
            aria-describedby={submitError ? "community-submit-error" : undefined}
          />
        </div>

        {submitError && (
          <p id="community-submit-error" className="field-error" role="alert">
            {submitError}
          </p>
        )}

        {atRateLimit && (
          <p className="field-error rate-limit-msg" role="alert">
            You've hit today's limit for this extension.
          </p>
        )}

        <Button
          type="submit"
          variant="default"
          disabled={!canSubmit()}
          className="community-submit-btn"
        >
          Submit
        </Button>
      </form>

      {recentEntries.length > 0 && (
        <div className="community-recent-notes">
          <h3 className="recent-notes-title">Recent notes (local)</h3>
          <ul className="recent-notes-list">
            {recentEntries.map((entry, i) => (
              <li key={entry.createdAt + i} className="recent-note-item">
                <span className="recent-note-meta">
                  {entry.vote && (
                    <span className="recent-note-vote">{entry.vote}</span>
                  )}
                  {entry.createdAt && (
                    <time dateTime={entry.createdAt}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </time>
                  )}
                </span>
                {(entry.note || entry.alternative) && (
                  <span className="recent-note-text">
                    {entry.note}
                    {entry.note && entry.alternative && " · "}
                    {entry.alternative && `Alternative: ${entry.alternative}`}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default CommunityInsightsPanel;
