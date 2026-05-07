import { Icons } from "./icons";

const ITEMS = [
  {
    Icon: Icons.shipping,
    head: "FREE SHIPPING",
    sub: "Every order, no minimum, 48 states",
  },
  {
    Icon: Icons.shield,
    head: "FITMENT GUARANTEED",
    sub: "Or your money back",
  },
  {
    Icon: Icons.return,
    head: "30-DAY RETURNS",
    sub: "Hassle-free, US-based",
  },
  {
    Icon: Icons.truck,
    head: "BUILT FOR BUILDS",
    sub: "Bolt-on. Drilling-free.",
  },
];

export function TrustRow({
  vertical = false,
  condensed = false,
}: {
  vertical?: boolean;
  condensed?: boolean;
}) {
  // Cycle 11 (owner mobile QA): 4-up grid clipped "30-DAY RET..." + "Has..."
  // at 375px because 4 columns of 94px can't hold the headings + sub-copy.
  // Use a className so we can switch to 2-up on mobile / 4-up on desktop.
  return (
    <div
      className={vertical ? "trust-row trust-row--vertical" : "trust-row"}
      style={{
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {ITEMS.map((it, i) => (
        <div
          key={it.head}
          className="trust-row__cell"
          data-last={i === ITEMS.length - 1 ? "true" : "false"}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: condensed ? "14px 18px" : "22px 24px",
          }}
        >
          {/* Cycle 14X+ (partner feedback): circular yellow backplate
              behind each icon so the trust row reads as four "badges"
              instead of four headings with tiny gray icons. The badge
              shape is the same trust-signal language used by Amazon
              ("Prime"), Best Buy ("Geek Squad"), etc. */}
          <div
            style={{
              flexShrink: 0,
              width: condensed ? 36 : 44,
              height: condensed ? 36 : 44,
              borderRadius: "50%",
              background: "var(--color-primary)",
              color: "var(--color-primary-foreground, #0a0a0a)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <it.Icon size={condensed ? 18 : 22} sw={2.25} />
          </div>
          <div>
            <div
              className="mono"
              style={{ fontSize: 11, letterSpacing: "0.12em", fontWeight: 700 }}
            >
              {it.head}
            </div>
            <div
              style={{ color: "var(--color-muted)", fontSize: 12, marginTop: 2 }}
            >
              {it.sub}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
