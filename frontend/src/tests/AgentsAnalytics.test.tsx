import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { DEMO_AGENTS, DEMO_AS_OF, DEMO_DOCUMENTS, DEMO_USAGE } from "../data/demoData";
import { computeAnalytics } from "../lib/analytics";
import { AgentDirectoryPage } from "../pages/AgentDirectoryPage";
import { AnalyticsPage } from "../pages/AnalyticsPage";

describe("AgentDirectoryPage", () => {
  it("filters by search and clears", async () => {
    const user = userEvent.setup();
    render(<AgentDirectoryPage />);
    await user.type(screen.getByLabelText("Search agents"), "stormwater");
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    await user.clear(screen.getByLabelText("Search agents"));
    await user.type(screen.getByLabelText("Search agents"), "zzz");
    await user.click(screen.getAllByRole("button", { name: "Clear filters" })[1]);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(DEMO_AGENTS.length);
  });

  it("opens a details panel", async () => {
    const user = userEvent.setup();
    render(<AgentDirectoryPage />);
    await user.click(screen.getByRole("button", { name: "View details for Structural Sage" }));
    expect(within(screen.getByRole("dialog")).getByText("Margaret Ellison, PE")).toBeInTheDocument();
  });
});

describe("analytics", () => {
  it("totals match the underlying records", () => {
    const d = computeAnalytics(90, DEMO_AS_OF, DEMO_AGENTS, DEMO_USAGE, DEMO_DOCUMENTS);
    expect(d.conversations).toBe(DEMO_USAGE.reduce((s, u) => s + u.conversations, 0));
    expect(d.buckets.reduce((s, b) => s + b.conversations, 0)).toBe(d.conversations);
    expect(d.documentsTotal).toBe(DEMO_DOCUMENTS.length);
  });

  it("updates when the date range changes", async () => {
    const user = userEvent.setup();
    render(<AnalyticsPage />);
    const week = computeAnalytics(7, DEMO_AS_OF, DEMO_AGENTS, DEMO_USAGE, DEMO_DOCUMENTS);
    const month = computeAnalytics(30, DEMO_AS_OF, DEMO_AGENTS, DEMO_USAGE, DEMO_DOCUMENTS);
    expect(week.conversations).toBeLessThan(month.conversations);
    expect(screen.getByText(String(month.conversations))).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText(/Date range/), "7");
    expect(screen.getByText(String(week.conversations))).toBeInTheDocument();
  });
});
