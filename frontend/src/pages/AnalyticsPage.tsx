import { useMemo, useState } from "react";
import { DEMO_AGENTS, DEMO_AS_OF, DEMO_DOCUMENTS, DEMO_USAGE } from "../data/demoData";
import { RANGES, computeAnalytics } from "../lib/analytics";

const fmt = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });

export function AnalyticsPage() {
  const [days, setDays] = useState<number>(30);
  const data = useMemo(
    () => computeAnalytics(days, DEMO_AS_OF, DEMO_AGENTS, DEMO_USAGE, DEMO_DOCUMENTS),
    [days],
  );
  const rangeLabel = RANGES.find((r) => r.days === days)?.label ?? "";
  const maxBucket = Math.max(1, ...data.buckets.map((b) => b.conversations));
  const maxAgent = Math.max(1, ...data.agentStats.map((a) => a.conversations));

  const W = 600;
  const H = 180;
  const gap = 2;
  const barW = W / data.buckets.length;

  return (
    <main className="page">
      <header className="page__header">
        <h1>Analytics</h1>
        <p>Agent usage and knowledge engagement.</p>
      </header>

      <p className="demo-note">Demo data: figures are fictional and as of {fmt(DEMO_AS_OF)}, not live usage.</p>

      <div className="toolbar">
        <label>
          Date range{" "}
          <select className="field" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {RANGES.map((r) => (
              <option key={r.days} value={r.days}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <span className="page__muted">
          {fmt(data.from)} – {fmt(data.to)}
        </span>
      </div>

      <ul className="stat-grid">
        <li className="card">
          <span className="stat__label">Conversations</span>
          <strong className="stat__value">{data.conversations}</strong>
          <span className="card__meta">{rangeLabel}</span>
        </li>
        <li className="card">
          <span className="stat__label">Active agents</span>
          <strong className="stat__value">
            {data.activeAgents} <small>of {DEMO_AGENTS.length}</small>
          </strong>
          <span className="card__meta">With a conversation in {rangeLabel.toLowerCase()}</span>
        </li>
        <li className="card">
          <span className="stat__label">Documents available</span>
          <strong className="stat__value">{data.documentsTotal}</strong>
          <span className="card__meta">
            Current total · {data.documentsAdded} added in {rangeLabel.toLowerCase()}
          </span>
        </li>
      </ul>

      <section className="card">
        <h2>Conversations over time</h2>
        <svg
          viewBox={`0 0 ${W} ${H + 20}`}
          className="chart"
          role="img"
          aria-label={`Conversations per ${days <= 30 ? "day" : "week"}, ${fmt(data.from)} to ${fmt(data.to)}. Peak ${maxBucket}.`}
        >
          {data.buckets.map((b, i) => {
            const h = (b.conversations / maxBucket) * H;
            return (
              <rect key={b.start} x={i * barW + gap / 2} y={H - h} width={barW - gap} height={h} className="chart__bar">
                <title>{`${fmt(b.start)}${b.start === b.end ? "" : ` – ${fmt(b.end)}`}: ${b.conversations}`}</title>
              </rect>
            );
          })}
          <line x1="0" y1={H} x2={W} y2={H} className="chart__axis" />
          <text x="0" y={H + 15} className="chart__label">
            {fmt(data.from)}
          </text>
          <text x={W} y={H + 15} textAnchor="end" className="chart__label">
            {fmt(data.to)}
          </text>
        </svg>
        <p className="page__muted">Peak {days <= 30 ? "day" : "week"}: {maxBucket} conversations</p>
      </section>

      <section className="card">
        <h2>Usage by agent</h2>
        <ul className="bars">
          {data.agentStats.map(({ agent, conversations }) => (
            <li key={agent.id}>
              <span>{agent.name}</span>
              <progress value={conversations} max={maxAgent} aria-label={`${agent.name} conversations`} />
              <span>{conversations}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Agent activity</h2>
        <table className="doc-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Conversations</th>
              <th>Most recent activity</th>
            </tr>
          </thead>
          <tbody>
            {data.agentStats.map(({ agent, conversations, lastActive }) => (
              <tr key={agent.id}>
                <td>{agent.name}</td>
                <td>{conversations}</td>
                <td>{lastActive ? fmt(lastActive) : "No activity in period"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
