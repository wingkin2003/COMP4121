"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { MessageBox } from "@/components/message-box";

export default function MessageThreadPage() {
  const params = useParams<{ peer: string }>();
  const peer = decodeURIComponent(params.peer || "");

  return (
    <div className="page-shell">
      <AppNav />
      <main className="page-content">
        <div className="section-header">
          <h1>Messages</h1>
          <p className="muted">
            Chatting with <strong>{peer}</strong>.{" "}
            <Link className="back-link" href="/messages">
              Switch user
            </Link>
          </p>
        </div>
        <MessageBox peer={peer} />
      </main>
    </div>
  );
}

