import { MessageInput } from "../components/MessageInput";
import { MessageList } from "../components/MessageList";
import { useChatStream } from "../hooks/useChatStream";

export function ChatPage() {
  const { messages, isStreaming, error, send, stop } = useChatStream();

  return (
    <main className="chat-page">
      <header className="chat-page__header">
        <h1>Chat</h1>
        <p>Ask questions answered from the work of retired colleagues.</p>
      </header>

      {messages.length === 0 ? (
        <p className="chat-page__empty">Start by asking a question below.</p>
      ) : (
        <MessageList messages={messages} />
      )}

      {error && (
        <p className="chat-page__error" role="alert">
          {error}
        </p>
      )}

      <MessageInput isStreaming={isStreaming} onSend={send} onStop={stop} />
    </main>
  );
}
