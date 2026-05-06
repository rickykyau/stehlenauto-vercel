import type { Metadata } from "next";
import { Icons } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with Stehlen Auto support, sales, or wholesale.",
  alternates: { canonical: "/help/contact" },
};

const CHANNELS = [
  {
    Icon: Icons.phone,
    label: "PHONE",
    value: "1-888-378-4536",
    sub: "Mon–Fri 9–5 PST",
    href: "tel:18883784536",
  },
  {
    Icon: Icons.mail,
    label: "EMAIL",
    value: "support@stehlenauto.com",
    sub: "We reply within 1 business day",
    href: "mailto:support@stehlenauto.com",
  },
  {
    Icon: Icons.chat,
    label: "LIVE CHAT",
    value: "Open chat",
    sub: "Mon–Fri 9–5 PST · Average wait 2 min",
    href: "#chat",
  },
];

export default function ContactPage() {
  return (
    <main
      className="container-x"
      style={{ paddingTop: 64, paddingBottom: 96 }}
    >
      <div className="eyebrow" style={{ marginBottom: 8 }}>
        CONTACT
      </div>
      <h1
        className="display-h2"
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 56,
          textTransform: "uppercase",
          letterSpacing: "-0.02em",
          lineHeight: 0.95,
          marginBottom: 16,
        }}
      >
        TALK TO US.
      </h1>
      <p
        style={{
          color: "var(--color-muted)",
          fontSize: 16,
          maxWidth: 580,
          marginBottom: 40,
        }}
      >
        Sales, fitment, install, returns — pick a channel. We&apos;re a small
        team and you&apos;ll get a real human, not a chatbot.
      </p>

      <div
        className="grid grid-cols-1 md:grid-cols-3"
        style={{ gap: 16, marginBottom: 48 }}
      >
        {CHANNELS.map((c) => (
          <a
            key={c.label}
            href={c.href}
            style={{
              background: "var(--color-surface)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-md)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div style={{ color: "var(--color-primary)" }}>
              <c.Icon size={20} />
            </div>
            <div
              className="mono"
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "var(--color-muted)",
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 600,
              }}
            >
              {c.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-muted)" }}>
              {c.sub}
            </div>
          </a>
        ))}
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-[1fr_360px]"
        style={{ gap: 32 }}
      >
        <form
          action="/api/contact"
          method="post"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 32,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div className="eyebrow">SEND A MESSAGE</div>
          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: 8 }}
          >
            <div>
              <div className="label-eyebrow">FIRST NAME</div>
              <input className="input" name="firstName" required />
            </div>
            <div>
              <div className="label-eyebrow">LAST NAME</div>
              <input className="input" name="lastName" required />
            </div>
          </div>
          <div>
            <div className="label-eyebrow">EMAIL</div>
            <input className="input" type="email" name="email" required />
          </div>
          <div>
            <div className="label-eyebrow">SUBJECT</div>
            <select className="select" name="subject">
              <option>Order question</option>
              <option>Fitment help</option>
              <option>Returns / exchanges</option>
              <option>Wholesale inquiry</option>
              <option>Press / partnerships</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <div className="label-eyebrow">MESSAGE</div>
            <textarea
              className="input"
              name="message"
              required
              rows={6}
              style={{
                height: "auto",
                paddingTop: 12,
                paddingBottom: 12,
                resize: "vertical",
              }}
            />
          </div>
          <button type="submit" className="btn btn-primary btn-lg">
            SEND MESSAGE
          </button>
        </form>

        <aside
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: 24,
            alignSelf: "start",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              fontWeight: 600,
              marginBottom: 12,
            }}
          >
            HEADQUARTERS
          </div>
          <div
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: "var(--color-muted)",
            }}
          >
            <strong style={{ color: "var(--color-foreground)" }}>
              Stehlen Auto
            </strong>
            <br />
            1160 W. Rincon St
            <br />
            Corona, CA 92878
          </div>
          <div
            style={{
              height: 1,
              background: "var(--color-border)",
              margin: "20px 0",
            }}
          />
          <div
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            HOURS
          </div>
          <div
            style={{
              fontSize: 13,
              color: "var(--color-muted)",
              lineHeight: 1.7,
            }}
          >
            Mon – Fri · 9 AM to 5 PM PST
            <br />
            Closed Sat &amp; Sun
          </div>
        </aside>
      </div>
    </main>
  );
}
