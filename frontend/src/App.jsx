import { useState, useRef, useEffect } from "react";
import { sendMessage } from "./api";
import "./App.css";

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(event) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

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
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    setMessages([]);
    setConversationId(null);
    setError(null);
  }

  return (
    <div className="app">
      <header className="header">
        <h1>OpenAI Chat</h1>
        <button className="new-chat" onClick={newChat} type="button">
          New chat
        </button>
      </header>

      <main className="messages">
        {messages.length === 0 && !loading && (
          <p className="empty">Ask the assistant anything to get started.</p>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <span className="role">{m.role === "user" ? "You" : "Assistant"}</span>
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
  );
}

export default App;
