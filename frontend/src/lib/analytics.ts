import type { Agent, DailyUsage, DemoDocument } from "../types";

export const RANGES = [
  { days: 7, label: "Last 7 days" },
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
] as const;

const dayMs = 86_400_000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

export interface AgentStat {
  agent: Agent;
  conversations: number;
  lastActive: string | null;
}

export interface Bucket {
  start: string;
  end: string;
  conversations: number;
}

export interface Analytics {
  from: string;
  to: string;
  conversations: number;
  activeAgents: number;
  documentsTotal: number;
  documentsAdded: number;
  agentStats: AgentStat[];
  buckets: Bucket[];
}

export function computeAnalytics(
  days: number,
  asOf: string,
  agents: Agent[],
  usage: DailyUsage[],
  documents: DemoDocument[],
): Analytics {
  const endMs = Date.parse(asOf);
  const from = iso(endMs - (days - 1) * dayMs);
  const inRange = usage.filter((u) => u.date >= from && u.date <= asOf);

  const agentStats = agents
    .map<AgentStat>((agent) => {
      const rows = inRange.filter((u) => u.agentId === agent.id);
      return {
        agent,
        conversations: rows.reduce((s, r) => s + r.conversations, 0),
        lastActive: rows.reduce<string | null>((m, r) => (m === null || r.date > m ? r.date : m), null),
      };
    })
    .sort((a, b) => b.conversations - a.conversations || a.agent.name.localeCompare(b.agent.name));

  // Daily buckets up to 30 days, weekly beyond that.
  const size = days <= 30 ? 1 : 7;
  const buckets: Bucket[] = [];
  for (let offset = 0; offset < days; offset += size) {
    const start = iso(endMs - (days - 1 - offset) * dayMs);
    const last = Math.min(offset + size - 1, days - 1);
    const end = iso(endMs - (days - 1 - last) * dayMs);
    const conversations = inRange
      .filter((u) => u.date >= start && u.date <= end)
      .reduce((s, u) => s + u.conversations, 0);
    buckets.push({ start, end, conversations });
  }

  return {
    from,
    to: asOf,
    conversations: agentStats.reduce((s, a) => s + a.conversations, 0),
    activeAgents: agentStats.filter((a) => a.conversations > 0).length,
    documentsTotal: documents.length,
    documentsAdded: documents.filter((d) => d.addedOn >= from && d.addedOn <= asOf).length,
    agentStats,
    buckets,
  };
}

export function matchesAgent(agent: Agent, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [agent.name, agent.professional, agent.discipline, agent.role, ...agent.expertise].some((f) =>
    f.toLowerCase().includes(q),
  );
}
