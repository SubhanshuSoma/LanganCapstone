import type { StreamEvent } from "../types";

/**
 * Splits buffered server-sent-event text into complete events. Network chunks
 * can end mid-event, so the unfinished tail is returned to prepend next time.
 */
export function parseSseBuffer(buffer: string): { events: StreamEvent[]; rest: string } {
  const blocks = buffer.split("\n\n");
  const rest = blocks.pop() ?? "";
  const events = blocks.flatMap((block) =>
    block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => JSON.parse(line.slice("data:".length).trim()) as StreamEvent),
  );
  return { events, rest };
}
