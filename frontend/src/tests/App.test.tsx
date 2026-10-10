import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import App from "../App";

afterEach(() => {
  vi.unstubAllGlobals();
  window.location.hash = "";
});

it("keeps previous chats available after starting a new one", async () => {
  window.location.hash = "#/chat";
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(
    'data: {"type":"token","content":"A response"}\n\ndata: {"type":"done"}\n\n',
    { headers: { "Content-Type": "text/event-stream" } },
  )));
  render(<App />);
  await userEvent.type(screen.getByLabelText("Your question"), "First question{Enter}");
  expect(await screen.findByText("A response")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: /New chat/i }));
  expect(screen.getByText("How can I help?")).toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "First question" }));
  expect(screen.getByText("A response")).toBeInTheDocument();
});

it("opens the Agents and Analytics pages from the navigation", () => {
  window.location.hash = "#/agents";
  const { container } = render(<App />);
  expect(screen.getByRole("heading", { name: "Agent Directory" })).toBeInTheDocument();

  window.location.hash = "#/analytics";
  fireEvent(window, new Event("hashchange"));
  expect(screen.getByRole("heading", { name: "Analytics" })).toBeInTheDocument();
  expect(container.querySelector('a[href="#/analytics"]')).toHaveAttribute("aria-current", "page");
});
