export type PageId = "chat" | "documents";

const PAGES: { id: PageId; label: string }[] = [
  { id: "chat", label: "Chat" },
  { id: "documents", label: "Documents" },
];

interface Props {
  current: PageId;
}

export function AppNav({ current }: Props) {
  return (
    <nav className="app-nav">
      <span className="app-nav__brand">Langan Knowledge Bot</span>
      <ul>
        {PAGES.map((page) => (
          <li key={page.id}>
            <a href={`#/${page.id}`} aria-current={page.id === current ? "page" : undefined}>
              {page.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
