const ITEMS = [
  "FREE GROUND SHIPPING ON EVERY ORDER — 48 STATES · NO MINIMUM",
  "FITMENT GUARANTEED OR YOUR MONEY BACK",
  // Cycle 14BG (Jordan F-18): "NOW DIRECT FROM STEHLENAUTO.COM" replaced —
  // a visitor already ON stehlenauto.com gains nothing from it. Copy
  // mirrors the PDP shipping-ETA math (cycle 14BE-fix3: 2PM PT cutoff →
  // 1-day processing), so the bar never promises faster than the PDP.
  "ORDER BY 2PM PT — SHIPS NEXT BUSINESS DAY",
  "30-DAY HASSLE-FREE RETURNS",
];

export function AnnouncementBar() {
  const tripled = [...ITEMS, ...ITEMS, ...ITEMS];
  return (
    <div
      style={{
        background: "var(--color-foreground)",
        color: "var(--color-background)",
        height: 32,
        overflow: "hidden",
        position: "relative",
        borderBottom: "1px solid var(--color-border)",
      }}
      aria-label="Announcements"
    >
      <div
        className="marquee-track"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: "100%",
          alignItems: "center",
        }}
      >
        {tripled.map((it, i) => (
          <span
            key={i}
            className="mono"
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
