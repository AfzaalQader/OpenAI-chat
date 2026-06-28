import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage, listConversations, getConversation } from "./api";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  const refreshConversations = useCallback(async () => {
    try {
      const data = await listConversations();
      setConversations(data);
    } catch {
      // history is non-critical; ignore load errors silently
    }
  }, []);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const isNewConversation = conversationId == null;
    setError(null);
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setLoading(true);

    try {
      const data = await sendMessage(text, conversationId);
      setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply.content },
      ]);
      // Refresh the sidebar so new threads / updated order appear.
      if (isNewConversation) {
        refreshConversations();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadConversation(id) {
    if (id === conversationId || loadingHistory) return;
    setError(null);
    setLoadingHistory(true);
    try {
      const data = await getConversation(id);
      setConversationId(data.id);
      setMessages(
        data.messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingHistory(false);
    }
  }

  function newChat() {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <button className="new-chat" onClick={newChat} type="button">
          + New chat
        </button>
        <div className="history">
          <p className="history-title">History</p>
          {conversations.length === 0 && (
            <p className="history-empty">No conversations yet.</p>
          )}
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  className={c.id === conversationId ? "active" : ""}
                  onClick={() => loadConversation(c.id)}
                >
                  {c.title || "Untitled chat"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <div className="chat">
        <header className="header">
          <h1>OpenAI Chat</h1>
        </header>

        <main className="messages">
          {messages.length === 0 && !loading && !loadingHistory && (
            <p className="empty">Ask the assistant anything to get started.</p>
          )}

          {loadingHistory && <p className="empty">Loading conversation…</p>}

          {messages.map((m, i) => (
            <div key={i} className={`bubble ${m.role}`}>
              <span className="role">
                {m.role === "user" ? "You" : "Assistant"}
              </span>
              <p>{m.content}</p>
            </div>
          ))}

          {loading && (
            <div className="bubble assistant">
              <span className="role">Assistant</span>
              <p className="typing">Thinking…</p>
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <div ref={bottomRef} />
        </main>

        <form className="composer" onSubmit={handleSubmit}>
          <input
            type="text"
            value={input}
            placeholder="Type your message…"
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading || !input.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
