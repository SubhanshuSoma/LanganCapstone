import { useCallback, useEffect, useState } from "react";
import { deleteDocument, listDocuments, uploadDocument } from "../api/documents";
import type { DocumentRecord } from "../types";

const message = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      try {
        // One request per file so a single bad file does not block the rest.
        for (const file of files) await uploadDocument(file, employeeName, projectNo);
        return true;
      } catch (err) {
        setError(message(err));
        return false;
      } finally {
        setIsUploading(false);
        await refresh();
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

  return { documents, isLoading, isUploading, error, refresh, upload, remove };
}
