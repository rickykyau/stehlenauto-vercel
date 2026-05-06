import Image from "next/image";

export function Logo({
  height = 28,
  priority = false,
}: {
  height?: number;
  priority?: boolean;
}) {
  return (
    <Image
      src="/images/stehlen-logo.png"
      alt="Stehlen Auto"
      width={600}
      height={113}
      priority={priority}
      style={{ height, width: "auto" }}
    />
  );
}
