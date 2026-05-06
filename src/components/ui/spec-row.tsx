export function SpecRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 24,
        padding: "10px 0",
        borderBottom: "1px solid var(--color-border)",
        fontSize: 13,
      }}
    >
      <span
        style={{
          color: "var(--color-muted)",
          fontFamily: "var(--font-display)",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: mono ? "var(--font-display)" : "var(--font-sans)",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
