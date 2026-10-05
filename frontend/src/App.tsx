import { useEffect, useState } from "react";
import { AppNav, type PageId } from "./components/AppNav";
import { ChatPage } from "./pages/ChatPage";
import { DocumentsPage } from "./pages/DocumentsPage";

// Hash routing keeps this dependency-free; swap for react-router if pages multiply.
const pageFromHash = (): PageId => (window.location.hash === "#/documents" ? "documents" : "chat");

export default function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <>
      <AppNav current={page} />
      {page === "documents" ? <DocumentsPage /> : <ChatPage />}
    </>
  );
}
