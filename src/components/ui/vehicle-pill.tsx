import { Icons } from "./icons";
import { YmmButton } from "@/components/fitment/ymm-button";

export type Vehicle = {
  id?: string;
  year: string;
  make: string;
  model: string;
};

export function VehiclePill({
  vehicle,
  compact = false,
}: {
  vehicle?: Vehicle;
  compact?: boolean;
}) {
  // Cycle 14Z (Mike-O5 NF-4): both pill states were 36/40px — under the
  // 44px WCAG / Apple HIG minimum. Bump to 44 (compact still 36 for the
  // few inline contexts that need a smaller pill).
  if (!vehicle) {
    return (
      <YmmButton
        ariaLabel="Select your vehicle"
        className="btn"
        style={{ height: compact ? 36 : 44, minHeight: compact ? 36 : 44, fontSize: 11, padding: "0 14px", gap: 6 }}
      >
        <Icons.truck size={14} />
        <span>SELECT VEHICLE</span>
      </YmmButton>
    );
  }
  return (
    <YmmButton
      ariaLabel="Change vehicle"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        height: compact ? 36 : 44,
        minHeight: compact ? 36 : 44,
        padding: "0 6px 0 14px",
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-md)",
        color: "var(--color-foreground)",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: "var(--color-success)",
          flexShrink: 0,
        }}
      />
      <span className="mono" style={{ fontSize: 11, letterSpacing: "0.08em" }}>
        {vehicle.year} {vehicle.make.toUpperCase()} {vehicle.model.toUpperCase()}
      </span>
      <span
        style={{
          display: "inline-flex",
          height: 24,
          width: 24,
          alignItems: "center",
          justifyContent: "center",
          background: "var(--color-surface-3)",
          borderRadius: 2,
        }}
      >
        <Icons.chevDown size={12} />
      </span>
    </YmmButton>
  );
}
