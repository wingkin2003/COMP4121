import { NextResponse } from "next/server";

type ChatMessage = {
  id: string;
  from: string;
  to: string;
  text: string;
  createdAt: string;
};

type ChatStore = {
  messages: ChatMessage[];
};

function getStore(): ChatStore {
  const g = globalThis as unknown as { __chatStore?: ChatStore };
  if (!g.__chatStore) {
    g.__chatStore = { messages: [] };
  }
  return g.__chatStore;
}

function conversationKey(a: string, b: string) {
  return [a, b].sort().join("::");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const me = (url.searchParams.get("me") || "").trim();
  const peer = (url.searchParams.get("peer") || "").trim();
  if (!me || !peer) {
    return NextResponse.json({ messages: [] satisfies ChatMessage[] });
  }

  const key = conversationKey(me, peer);
  const store = getStore();
  const messages = store.messages.filter(
    (m) => conversationKey(m.from, m.to) === key,
  );

  return NextResponse.json({ messages });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { from?: string; to?: string; text?: string }
    | null;

  const from = (body?.from || "").trim();
  const to = (body?.to || "").trim();
  const text = (body?.text || "").trim();

  if (!from || !to || !text) {
    return NextResponse.json(
      { error: "from, to, and text are required" },
      { status: 400 },
    );
  }

  const msg: ChatMessage = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    from,
    to,
    text,
    createdAt: new Date().toISOString(),
  };

  const store = getStore();
  store.messages.push(msg);
  if (store.messages.length > 1000) {
    store.messages.splice(0, store.messages.length - 1000);
  }

  return NextResponse.json({ message: msg });
}

