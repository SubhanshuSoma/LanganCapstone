export type PageId = "chat" | "documents" | "agents" | "analytics";

interface Props {
  current: PageId;
  onNewChat: () => void;
  chats: { id: number; title: string }[];
  activeChat: number;
  onSelectChat: (id: number) => void;
}

export function AppNav({ current, onNewChat, chats, activeChat, onSelectChat }: Props) {
  return (
    <aside className="app-nav">
      <a className="app-nav__brand" href="#/chat" aria-label="Langan Knowledge home">
        <img src="/langan-logo.png" alt="Langan" />
        <span className="brand-subtitle">KNOWLEDGE</span>
      </a>
      <button type="button" className="new-chat" onClick={onNewChat}><span aria-hidden="true">＋</span> New chat</button>
      <div className="nav-label">WORKSPACE</div>
      <nav aria-label="Main navigation">
        <a href="#/chat" aria-current={current === "chat" ? "page" : undefined}><span aria-hidden="true">◫</span> Chat</a>
        <a href="#/documents" aria-current={current === "documents" ? "page" : undefined}><span aria-hidden="true">▤</span> Employee files</a>
        <a href="#/agents" aria-current={current === "agents" ? "page" : undefined}><span aria-hidden="true">◧</span> Agents</a>
        <a href="#/analytics" aria-current={current === "analytics" ? "page" : undefined}><span aria-hidden="true">▥</span> Analytics</a>
      </nav>
      <div className="nav-label nav-label--recent">RECENT CHATS</div>
      <div className="recent-chats">{chats.filter((chat) => chat.title).map((chat) => <button key={chat.id} type="button" aria-current={current === "chat" && chat.id === activeChat ? "page" : undefined} onClick={() => onSelectChat(chat.id)} title={chat.title}>{chat.title}</button>)}</div>
      <div className="app-nav__footer"><span className="footer-dot" /> Internal knowledge assistant</div>
    </aside>
  );
}
