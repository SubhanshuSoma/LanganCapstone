import { describe, expect, it } from "vitest";
import { parseSseBuffer } from "../api/sse";

describe("parseSseBuffer", () => {
  it("returns complete events and keeps the unfinished tail", () => {
    const buffer = 'data: {"type":"token","content":"Hi"}\n\ndata: {"type":"do';

    expect(parseSseBuffer(buffer)).toEqual({
      events: [{ type: "token", content: "Hi" }],
      rest: 'data: {"type":"do',
    });
  });

  it("parses several events in one chunk", () => {
    const buffer = 'data: {"type":"token","content":"a"}\n\ndata: {"type":"done"}\n\n';

    expect(parseSseBuffer(buffer).events).toEqual([{ type: "token", content: "a" }, { type: "done" }]);
  });
});
