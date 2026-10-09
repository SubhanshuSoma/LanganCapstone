import { useEffect, useMemo, useState } from "react";
import { DEMO_AGENTS } from "../data/demoData";
import { matchesAgent } from "../lib/analytics";
import type { Agent } from "../types";

const ALL = "All disciplines";
const DISCIPLINES = [ALL, ...Array.from(new Set(DEMO_AGENTS.map((a) => a.discipline))).sort()];

export function AgentDirectoryPage() {
  const [query, setQuery] = useState("");
  const [discipline, setDiscipline] = useState(ALL);
  const [selected, setSelected] = useState<Agent | null>(null);

  const agents = useMemo(
    () =>
      DEMO_AGENTS.filter(
        (a) => (discipline === ALL || a.discipline === discipline) && matchesAgent(a, query),
      ),
    [query, discipline],
  );
  const hasFilters = query !== "" || discipline !== ALL;
  const clear = () => {
    setQuery("");
    setDiscipline(ALL);
  };

  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSelected(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  return (
    <main className="page">
      <header className="page__header">
        <h1>Agent Directory</h1>
        <p>Find knowledge-capture agents built from the experience of seasoned professionals.</p>
      </header>

      <p className="demo-note">Demo data: these agents are fictional examples, not live records.</p>

      <div className="toolbar">
        <input
          type="search"
          className="field"
          placeholder="Search by name, discipline, or expertise"
          aria-label="Search agents"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="field"
          aria-label="Filter by discipline"
          value={discipline}
          onChange={(e) => setDiscipline(e.target.value)}
        >
          {DISCIPLINES.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        {hasFilters && (
          <button type="button" className="link-button" onClick={clear}>
            Clear filters
          </button>
        )}
      </div>

      <p className="page__muted" role="status">
        {agents.length} of {DEMO_AGENTS.length} agents
      </p>

      {agents.length === 0 ? (
        <div className="empty-state">
          <p>No agents match your search.</p>
          <button type="button" className="button" onClick={clear}>
            Clear filters
          </button>
        </div>
      ) : (
        <ul className="card-grid">
          {agents.map((agent) => (
            <li key={agent.id} className="card">
              <h2>{agent.name}</h2>
              <p className="card__meta">
                {agent.professional} · {agent.discipline}
              </p>
              <p>{agent.description}</p>
              <ul className="tags" aria-label="Expertise">
                {agent.expertise.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
              <button
                type="button"
                className="button"
                aria-label={`View details for ${agent.name}`}
                onClick={() => setSelected(agent)}
              >
                View details
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="panel-backdrop" onClick={() => setSelected(null)}>
          <aside
            className="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="agent-panel-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="agent-panel-title">{selected.name}</h2>
            <p className="card__meta">{selected.discipline}</p>
            <dl>
              <dt>Associated professional</dt>
              <dd>{selected.professional}</dd>
              <dt>Role</dt>
              <dd>{selected.role}</dd>
              <dt>About</dt>
              <dd>{selected.description}</dd>
              <dt>Expertise</dt>
              <dd>
                <ul className="tags">
                  {selected.expertise.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </dd>
            </dl>
            <p className="page__muted">Chatting with a specific agent is not available yet.</p>
            <button type="button" className="button" autoFocus onClick={() => setSelected(null)}>
              Close
            </button>
          </aside>
        </div>
      )}
    </main>
  );
}
