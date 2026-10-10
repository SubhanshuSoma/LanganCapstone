import { useEffect, useRef, useState } from "react";
import { AgentDirectoryPage } from "./pages/AgentDirectoryPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AppNav, type PageId } from "./components/AppNav";
import { ChatPage } from "./pages/ChatPage";
import { DocumentsPage } from "./pages/DocumentsPage";

// Hash routing keeps this dependency-free; swap for react-router if pages multiply.
const pageFromHash = (): PageId => (window.location.hash === "#/documents" ? "documents" : "chat");

export default function App() {
  const [page, setPage] = useState<PageId>(pageFromHash);
  const [chats, setChats] = useState([{ id: 0, title: "" }]);
  const [activeChat, setActiveChat] = useState(0);
  const nextChatId = useRef(0);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <div className="app-shell">
      <AppNav current={page} chats={chats} activeChat={activeChat} onNewChat={() => { const id = ++nextChatId.current; setChats((current) => [{ id, title: "" }, ...current]); setActiveChat(id); window.location.hash = "#/chat"; setPage("chat"); }} onSelectChat={(id) => { setActiveChat(id); window.location.hash = "#/chat"; setPage("chat"); }} />
      <div className="app-shell__main">
        <div className="topbar"><span>{({ chat: "Chat", documents: "Employee files", agents: "Agents", analytics: "Analytics" })[page]}</span><span className="topbar__right">LANGAN / KNOWLEDGE</span></div>
        {chats.map((chat) => <div key={chat.id} hidden={page !== "chat" || chat.id !== activeChat} className="chat-host"><ChatPage onTitle={(title) => setChats((current) => current.map((entry) => entry.id === chat.id ? { ...entry, title } : entry))} /></div>)}
        {page === "documents" && <DocumentsPage />}
        {page === "agents" && <AgentDirectoryPage />}
        {page === "analytics" && <AnalyticsPage />}
      </div>
    </div>
  );
}
