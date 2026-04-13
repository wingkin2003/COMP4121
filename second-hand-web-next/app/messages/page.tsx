"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppNav } from "@/components/app-nav";

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

export default function MessagesIndexPage() {
  const me = useMemo(() => getCurrentUsername(), []);
  const [peer, setPeer] = useState(me === "1234567" ? "alice" : "1234567");

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="section-header">
          <h1>Messages</h1>
          <p className="muted">
            Choose a user to chat with. Open the chat in another browser/incognito tab
            with a different account to simulate user-to-user messaging.
          </p>
        </div>

        <div className="content-card" style={{ maxWidth: 820 }}>
          <div className="sell-form" style={{ gap: "0.7rem" }}>
            <label>
              Your account
              <input value={me || "(not logged in)"} disabled />
            </label>
            <label>
              Chat with (peer username)
              <input
                value={peer}
                onChange={(e) => setPeer(e.target.value)}
                placeholder="e.g. alice"
              />
            </label>
            <div className="detail-actions">
              <Link className="btn btn-fill" href={`/messages/${encodeURIComponent(peer)}`}>
                Open chat
              </Link>
              <Link className="btn" href="/profile">
                Go to profile
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

