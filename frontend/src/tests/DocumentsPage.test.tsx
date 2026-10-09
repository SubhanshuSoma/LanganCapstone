import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentsPage } from "../pages/DocumentsPage";
import type { DocumentRecord } from "../types";

const doc: DocumentRecord = {
  id: "1",
  filename: "site-report.pdf",
  size_bytes: 2048,
  status: "indexed",
  uploaded_at: "2026-10-01T12:00:00Z",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("DocumentsPage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lists documents from the server", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json([doc])));

    render(<DocumentsPage />);

    expect(await screen.findByText("site-report.pdf")).toBeInTheDocument();
    expect(screen.getByText("2.0 KB")).toBeInTheDocument();
    expect(screen.getByText("indexed")).toBeInTheDocument();
  });

  it("uploads a chosen file and refreshes the list", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(json([]))
      .mockResolvedValueOnce(json({ ...doc, status: "uploaded" }))
      .mockResolvedValueOnce(json([{ ...doc, status: "uploaded" }]));
    vi.stubGlobal("fetch", fetchMock);

    render(<DocumentsPage />);
    expect(await screen.findByText(/No documents yet/)).toBeInTheDocument();

    const file = new File(["%PDF"], "site-report.pdf", { type: "application/pdf" });
    await userEvent.upload(screen.getByLabelText("Upload documents"), file);
    await userEvent.type(screen.getByPlaceholderText("Employee name"), "Morgan Lee");
    await userEvent.click(screen.getByRole("button", { name: "Upload 1 file" }));

    expect(await screen.findByText("site-report.pdf")).toBeInTheDocument();
    const [url, init] = fetchMock.mock.calls[1];
    expect(url).toMatch(/\/api\/documents$/);
    expect(init.method).toBe("POST");
    expect((init.body as FormData).get("file")).toBe(file);
    expect((init.body as FormData).get("employee_name")).toBe("Morgan Lee");
  });

  it("shows the server's error detail", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ detail: "Not Found" }, 404)));

    render(<DocumentsPage />);

    expect(await screen.findByRole("alert")).toHaveTextContent("Not Found");
  });

  it("filters filenames by employee and project", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json([
      { ...doc, id: "1", employee: "Morgan Lee", project: "P-12" },
      { ...doc, id: "2", filename: "bridge-notes.pdf", employee: "Alex Kim", project: "P-20" },
    ])));
    render(<DocumentsPage />);
    expect(await screen.findByText("bridge-notes.pdf")).toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Filter by employee"), "Morgan Lee");
    expect(screen.getByText("site-report.pdf")).toBeInTheDocument();
    expect(screen.queryByText("bridge-notes.pdf")).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByLabelText("Filter by project"), "P-20");
    expect(screen.getByText("No files match these filters.")).toBeInTheDocument();
  });
});
