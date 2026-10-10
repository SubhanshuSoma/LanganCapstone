import { useEffect, useState } from "react";
import { AppNav, type PageId } from "./components/AppNav";
import { AgentDirectoryPage } from "./pages/AgentDirectoryPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { ChatPage } from "./pages/ChatPage";
import { DocumentsPage } from "./pages/DocumentsPage";

// Hash routing keeps this dependency-free; swap for react-router if pages multiply.
const PAGE_IDS: PageId[] = ["chat", "documents", "agents", "analytics"];
const pageFromHash = (): PageId => {
  const id = window.location.hash.replace("#/", "") as PageId;
  return PAGE_IDS.includes(id) ? id : "chat";
};

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
      {page === "documents" ? (
        <DocumentsPage />
      ) : page === "agents" ? (
        <AgentDirectoryPage />
      ) : page === "analytics" ? (
        <AnalyticsPage />
      ) : (
        <ChatPage />
      )}
    </>
  );
}

