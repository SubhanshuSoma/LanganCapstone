import { useCallback, useEffect, useState } from "react";
import { deleteDocument, listDocuments, uploadArchive, uploadDocument } from "../api/documents";
import type { DocumentRecord } from "../types";

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSummary, setUploadSummary] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      setDocuments(await listDocuments());
      setError(null);
    } catch (err) {
      setError(message(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const upload = useCallback(
    async (files: File[], employeeName: string, projectNo: string) => {
      setIsUploading(true);
      setError(null);
      setUploadSummary(null);
      let uploadError: string | null = null;
      try {
        let imported = 0;
        let skipped = 0;
        const failed: string[] = [];
        for (const file of files) {
          if (file.name.toLowerCase().endsWith(".zip")) {
            const result = await uploadArchive(file, employeeName, projectNo);
            imported += result.documents.filter((document) => document.status !== "failed").length;
            failed.push(...result.documents.filter((document) => document.status === "failed").map((document) => document.filename));
            skipped += result.skipped.length;
          } else {
            const document = await uploadDocument(file, employeeName, projectNo);
            if (document.status === "failed") failed.push(document.filename);
            else imported++;
          }
        }
        setUploadSummary(`Processed ${imported} ${imported === 1 ? "document" : "documents"}${skipped ? `; skipped ${skipped} unsupported or empty ${skipped === 1 ? "file" : "files"}` : ""}.`);
        if (failed.length) throw new Error(`Could not process: ${failed.join(", ")}`);
        return true;
      } catch (err) {
        uploadError = message(err);
        return false;
      } finally {
        setIsUploading(false);
        await refresh();
        if (uploadError) setError(uploadError);
      }
    },
    [refresh],
  );

  const remove = useCallback(async (id: string) => {
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
    } catch (err) {
      setError(message(err));
    }
  }, []);

  return { documents, isLoading, isUploading, error, uploadSummary, refresh, upload, remove };
}
