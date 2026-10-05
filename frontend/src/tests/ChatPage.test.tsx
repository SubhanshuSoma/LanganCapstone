import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatPage } from "../pages/ChatPage";

/** A fetch response that streams the given text chunks, like the backend does. */
function streamingResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
  return new Response(body, { headers: { "Content-Type": "text/event-stream" } });
}

describe("ChatPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends the question and shows the streamed reply", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      streamingResponse([
        'data: {"type":"token","content":"Use a "}\n\ndata: {"type":"tok',
        'en","content":"pile foundation."}\n\ndata: {"type":"done"}\n\n',
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    render(<ChatPage />);
    await userEvent.type(screen.getByLabelText("Your question"), "What foundation was used?{Enter}");

    expect(await screen.findByText("Use a pile foundation.")).toBeInTheDocument();
    expect(screen.getByText("What foundation was used?")).toBeInTheDocument();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toEqual({ messages: [{ role: "user", content: "What foundation was used?" }] });
  });

  it("shows an error streamed by the server", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        streamingResponse(['data: {"type":"error","message":"Could not reach Ollama"}\n\n']),
      ),
    );

    render(<ChatPage />);
    await userEvent.type(screen.getByLabelText("Your question"), "Hello{Enter}");

    expect(await screen.findByRole("alert")).toHaveTextContent("Could not reach Ollama");
    expect(screen.queryByText("Thinking…")).not.toBeInTheDocument();
  });
});
