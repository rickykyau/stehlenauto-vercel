const ITEMS = [
  "FREE GROUND SHIPPING ON EVERY ORDER — 48 STATES · NO MINIMUM",
  "FITMENT GUARANTEED OR YOUR MONEY BACK",
  // One shipping promise site-wide (banner, PDP, /legal/shipping, help):
  // ship within 1 business day, 2–6 business days ground transit.
  "IN-STOCK ORDERS SHIP WITHIN 1 BUSINESS DAY",
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
