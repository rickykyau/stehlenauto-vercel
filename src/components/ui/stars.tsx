import { Icons } from "./icons";

export function Stars({ rating = 5, size = 12 }: { rating?: number; size?: number }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{
            color:
              i < full || (i === full && half)
                ? "var(--color-primary)"
                : "var(--color-border-2)",
            display: "inline-flex",
          }}
        >
          <Icons.star size={size} />
        </span>
      ))}
    </span>
  );
}
