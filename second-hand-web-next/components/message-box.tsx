"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  from: string;
  to: string;
  text: string;
  createdAt: string;
};

function getCurrentUsername(): string {
  if (typeof window === "undefined") return "";
  const raw = window.localStorage.getItem("currentUser");
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as { username?: string };
    return parsed.username || "";
  } catch {
    return "";
  }
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBox(props: { peer: string; me?: string }) {
  const me = props.me ?? getCurrentUsername();
  const peer = props.peer;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<number | null>(null);

  const canSend = useMemo(() => {
    return Boolean(me && peer && draft.trim() && !sending);
  }, [me, peer, draft, sending]);

  const fetchMessages = async () => {
    if (!me || !peer) return;
    try {
      const res = await fetch(`/api/chat?me=${encodeURIComponent(me)}&peer=${encodeURIComponent(peer)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Failed to load messages (${res.status})`);
      const data = (await res.json()) as { messages: ChatMessage[] };
      setMessages(data.messages || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    void fetchMessages();

    if (pollRef.current) window.clearInterval(pollRef.current);
    pollRef.current = window.setInterval(() => {
      void fetchMessages();
    }, 1500);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      pollRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, peer]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!canSend) return;
    const text = draft.trim();
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from: me, to: peer, text }),
      });
      if (!res.ok) throw new Error(`Send failed (${res.status})`);
      setDraft("");
      await fetchMessages();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  if (!me) {
    return (
      <div className="content-card chat-card">
        <div className="chat-top">
          <div>
            <div className="chat-title">Messages</div>
            <div className="muted">Please log in to chat.</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-card chat-card">
      <div className="chat-top">
        <div>
          <div className="chat-title">Chat with {peer}</div>
          <div className="muted">
            Signed in as <strong>{me}</strong>
          </div>
        </div>
        <button className="btn" onClick={() => void fetchMessages()} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="chat-messages" aria-busy={loading}>
        {loading ? <div className="muted chat-empty">Loading…</div> : null}
        {!loading && messages.length === 0 ? (
          <div className="muted chat-empty">No messages yet. Say hi.</div>
        ) : null}
        {messages.map((m) => {
          const mine = m.from === me;
          return (
            <div key={m.id} className={`chat-row ${mine ? "me" : "peer"}`}>
              <div className={`chat-bubble ${mine ? "me" : "peer"}`}>
                <div className="chat-text">{m.text}</div>
                <div className="chat-meta">
                  {mine ? "You" : m.from} · {formatTime(m.createdAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error ? <div className="chat-error">{error}</div> : null}

      <div className="chat-compose">
        <textarea
          rows={2}
          placeholder="Write a message… (Enter to send, Shift+Enter for newline)"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={sending}
        />
        <button className="btn btn-fill" onClick={() => void send()} disabled={!canSend}>
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
    </div>
  );
}

