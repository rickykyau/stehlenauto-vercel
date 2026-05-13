"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icons } from "@/components/ui/icons";

const QUICK_PROMPTS = [
  "Will this fit my vehicle?",
  "Track an order",
  "Install help",
  "Talk to a human",
];

const INITIAL_GREETING =
  "morning. i'm RIG — Stehlen's install assistant. ask me about fitment, install steps, returns, or order status.";

export function ChatAssistant() {
  const [open, setOpen] = useState(false);
  // Cycle 14Z (Mike-O5 NF-1): unread was hardcoded to 1 on every mount, so
  // the FAB always showed a "1" badge — fake notification bait. Removed.
  // When real chat events come back from the agent we can re-enable an
  // actual unread counter driven by message arrivals.
  const [unread, setUnread] = useState(0);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();

  // Cycle 14AA (Mike-O14AA F-3 MAJOR): RIG used to reply "what are you
  // looking at?" when asked "will this fit?" from a PDP, even though we
  // were already on the product page and the saved vehicle was in cookie.
  // Thread the current page context (PDP handle, collection handle) into
  // every chat request so the API can inject product info into the
  // system prompt before the model thinks about the question.
  const pageContext = useMemo(() => {
    const ctx: { productHandle?: string; collectionHandle?: string; pathname: string } = {
      pathname: pathname ?? "/",
    };
    if (pathname?.startsWith("/products/")) {
      ctx.productHandle = pathname.replace("/products/", "").split("/")[0] || undefined;
    } else if (pathname?.startsWith("/collections/")) {
      ctx.collectionHandle = pathname.replace("/collections/", "").split("/")[0] || undefined;
    }
    return ctx;
  }, [pathname]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ messages, body }) => ({
          body: { ...body, messages, pageContext },
        }),
      }),
    [pageContext],
  );

  const { messages, sendMessage, status, error } = useChat({ transport });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, status, open]);

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    sendMessage({ text: trimmed });
    setInput("");
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setUnread(0);
        }}
        aria-label="Open chat"
        className="chat-fab"
        style={{
          position: "fixed",
          // Lift above the mobile sticky ATC bar when present (var set by
          // <MobileStickyAtc>; falls back to 24 elsewhere). Jordan regression.
          bottom: "calc(var(--stehlen-sticky-atc-height, 0px) + 24px)",
          right: 16,
          zIndex: 80,
          background: "var(--color-primary)",
          color: "var(--color-background)",
          border: 0,
          width: 60,
          height: 60,
          borderRadius: 30,
          boxShadow:
            "0 12px 40px rgba(245,168,35,0.35), 0 4px 16px rgba(0,0,0,0.4)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icons.chat size={26} sw={2.4} />
        {unread > 0 && (
          <span
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              minWidth: 22,
              height: 22,
              padding: "0 6px",
              background: "#0a0a0a",
              color: "var(--color-primary)",
              borderRadius: 11,
              border: "2px solid var(--color-primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              fontFamily: "var(--font-display)",
            }}
          >
            {unread}
          </span>
        )}
      </button>
    );
  }

  const isLoading = status === "streaming" || status === "submitted";
  const showGreeting = messages.length === 0;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label="Chat assistant"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 100,
        width: 400,
        height: 600,
        maxHeight: "calc(100vh - 48px)",
        maxWidth: "calc(100vw - 32px)",
        background: "var(--color-background)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-surface)",
        }}
      >
        <div>
          <div
            className="mono"
            style={{
              fontSize: 12,
              letterSpacing: "0.14em",
              fontWeight: 700,
            }}
          >
            RIG · STEHLEN ASSISTANT
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-success)",
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--color-success)",
              }}
            />
            ONLINE
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Close chat"
          style={{
            background: "transparent",
            border: 0,
            color: "var(--color-foreground)",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Icons.close size={18} />
        </button>
      </div>

      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {showGreeting && (
          <>
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  background: "var(--color-surface)",
                  color: "var(--color-foreground)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  lineHeight: 1.5,
                }}
              >
                {INITIAL_GREETING}
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => send(p)}
                  className="chip"
                  style={{ height: 30, cursor: "pointer" }}
                >
                  {p.toUpperCase()}
                </button>
              ))}
            </div>
          </>
        )}

        {messages.map((m) => {
          const text = m.parts
            .filter((p) => p.type === "text")
            .map((p) => (p as { text: string }).text)
            .join("");
          if (!text) return null;
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "82%",
                  padding: "10px 14px",
                  background: isUser
                    ? "var(--color-primary)"
                    : "var(--color-surface)",
                  color: isUser
                    ? "var(--color-primary-foreground)"
                    : "var(--color-foreground)",
                  border: isUser ? "0" : "1px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  fontSize: 13,
                  lineHeight: 1.5,
                  whiteSpace: "pre-wrap",
                }}
              >
                {text}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div style={{ display: "flex" }}>
            <div
              style={{
                padding: "10px 14px",
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                fontSize: 12,
                color: "var(--color-muted)",
              }}
            >
              RIG is typing…
            </div>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "var(--radius-sm)",
              fontSize: 12,
              color: "var(--color-destructive)",
            }}
          >
            Connection issue — try again or call 1-888-378-4536.
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        style={{
          padding: 12,
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-surface)",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about fitment, install, returns…"
          aria-label="Chat input"
          style={{
            flex: 1,
            height: 40,
            fontSize: 13,
            textTransform: "none",
            letterSpacing: 0,
          }}
          disabled={isLoading}
        />
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          style={{ height: 40 }}
          disabled={!input.trim() || isLoading}
        >
          SEND
        </button>
      </form>
    </div>
  );
}
