import type { Agent, DailyUsage, DemoDocument } from "../types";

// FICTIONAL DEMO DATA: no live agent or usage API exists yet. Replace with API calls when available.
export const DEMO_AS_OF = "2026-10-08";

export const DEMO_AGENTS: Agent[] = [
  {
    id: "a-structural",
    name: "Structural Sage",
    professional: "Margaret Ellison, PE",
    discipline: "Structural Engineering",
    role: "Retired Principal, Structures",
    expertise: ["Steel framing", "Seismic retrofit", "Load calculations"],
    description: "Captures decades of lessons on framing decisions and retrofits of aging buildings.",
  },
  {
    id: "a-geotech",
    name: "Foundation Guide",
    professional: "Robert Haldane, PG",
    discipline: "Geotechnical Engineering",
    role: "Retired Senior Geotechnical Engineer",
    expertise: ["Soil borings", "Deep foundations", "Slope stability"],
    description: "Explains how to read boring logs and choose foundation systems for difficult sites.",
  },
  {
    id: "a-civil",
    name: "Site Strategist",
    professional: "Anita Brooks, PE",
    discipline: "Civil Engineering",
    role: "Retired Site Development Lead",
    expertise: ["Stormwater", "Grading", "Municipal permitting"],
    description: "Shares practical approaches to site layout, drainage design, and permit negotiations.",
  },
  {
    id: "a-environmental",
    name: "Remediation Mentor",
    professional: "Thomas Quinn, LSRP",
    discipline: "Environmental",
    role: "Retired Environmental Practice Leader",
    expertise: ["Phase I/II assessments", "Brownfields", "Groundwater"],
    description: "Walks through site assessment strategy and remediation planning from past projects.",
  },
  {
    id: "a-survey",
    name: "Survey Veteran",
    professional: "Diane Castillo, PLS",
    discipline: "Land Surveying",
    role: "Retired Survey Manager",
    expertise: ["Boundary resolution", "Topographic mapping", "Easements"],
    description: "Offers field-tested guidance on resolving boundary conflicts and survey control.",
  },
  {
    id: "a-mep",
    name: "Systems Coach",
    professional: "Walter Nguyen, PE",
    discipline: "MEP Engineering",
    role: "Retired Mechanical Director",
    expertise: ["HVAC design", "Energy modeling", "Commissioning"],
    description: "Distills building systems coordination and commissioning experience.",
  },
];

const dayMs = 86_400_000;
const toDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Deterministic pseudo-usage for the 90 days ending at DEMO_AS_OF, so totals are reproducible.
const weights = [5, 4, 3, 2, 2, 3];
const end = Date.parse(DEMO_AS_OF);

export const DEMO_USAGE: DailyUsage[] = [];
for (let d = 89; d >= 0; d--) {
  const ms = end - d * dayMs;
  const weekday = new Date(ms).getUTCDay();
  if (weekday === 0 || weekday === 6) continue;
  DEMO_AGENTS.forEach((agent, i) => {
    // Agents 4 and 5 are quiet for a stretch so "active agents" varies by range.
    if ((i === 4 && d < 60 && d > 12) || (i === 3 && d < 25 && d > 9)) return;
    const n = Math.floor(((d * 7 + i * 5) % 6) * (weights[i] / 5) + (d < 45 ? 1 : 0)) ;
    if (n > 0) DEMO_USAGE.push({ date: toDate(ms), agentId: agent.id, conversations: n });
  });
}

export const DEMO_DOCUMENTS: DemoDocument[] = DEMO_AGENTS.flatMap((agent, i) =>
  Array.from({ length: 6 + i * 2 }, (_, k) => ({
    id: `${agent.id}-doc-${k + 1}`,
    agentId: agent.id,
    addedOn: toDate(end - ((k * 13 + i * 7) % 85) * dayMs),
  })),
);
