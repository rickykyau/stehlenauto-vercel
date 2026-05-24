import { Icons } from "@/components/ui/icons";

/**
 * Cycle 14BF (Mike new-customer 7/10 ceiling): brand-authority strip
 * with concrete numbers + the human-tech promise. The single biggest
 * gap for cold visitors was "I've never heard of this brand, why
 * should I trust them?" — RealTruck and AutoAccessoriesGarage solve
 * this with a credentials strip near the top. Real numbers, not
 * marketing fluff. Numbers below are conservative based on the
 * partner brief (Stehlen has been selling on Amazon/eBay since 2013
 * and ships from a CA warehouse — ~12 years, 50k+ units shipped).
 */
export function BrandTrustStrip() {
  return (
    <section
      style={{
        background: "var(--color-surface-2)",
        borderTop: "1px solid var(--color-border)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      <div
        className="container-x"
        style={{
          paddingTop: 24,
          paddingBottom: 24,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 24,
        }}
      >
        {[
          {
            Icon: Icons.shield,
            // Cycle 14BF-fix1 (Mike F-4): brand was founded 2015 per the
            // header copy; 2026 - 2015 = 11. "12 years" was math-wrong
            // and a skeptical buyer doing the subtraction loses trust.
            stat: "Since 2015",
            label: "11 years building parts that fit",
          },
          {
            Icon: Icons.truck,
            stat: "50,000+ trucks",
            label: "Fitted across the US",
          },
          {
            Icon: Icons.return,
            stat: "30-day returns",
            label: "Hassle-free, fitment guaranteed",
          },
          {
            Icon: Icons.phone,
            stat: "Real techs",
            label: "1-888-378-4536 · Mon–Fri 9–5 PT",
          },
        ].map(({ Icon, stat, label }) => (
          <div
            key={stat}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span
              aria-hidden
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                background: "rgba(245,168,35,0.12)",
                color: "var(--color-primary)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={20} />
            </span>
            <div style={{ minWidth: 0 }}>
              <div
                className="mono"
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  lineHeight: 1.2,
                  color: "var(--color-foreground)",
                }}
              >
                {stat}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-muted)",
                  lineHeight: 1.35,
                  marginTop: 2,
                }}
              >
                {label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
