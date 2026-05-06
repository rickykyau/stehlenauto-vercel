import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number;
  sw?: number;
};

function makeIcon(d: string, opts: { fill?: boolean; viewBox?: string } = {}) {
  const Icon = ({ size = 16, sw = 1.5, ...rest }: IconProps) => (
    <svg
      width={size}
      height={size}
      viewBox={opts.viewBox ?? "0 0 24 24"}
      fill={opts.fill ? "currentColor" : "none"}
      stroke={opts.fill ? "none" : "currentColor"}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      <path d={d} />
    </svg>
  );
  return Icon;
}

export const Icons = {
  search: makeIcon("M21 21l-4.3-4.3M19 11a8 8 0 11-16 0 8 8 0 0116 0z"),
  user: makeIcon(
    "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M16 7a4 4 0 11-8 0 4 4 0 018 0z",
  ),
  cart: makeIcon(
    "M3 3h2l2.4 12.3a2 2 0 002 1.7h8.7a2 2 0 002-1.6L22 8H6M9 21a1 1 0 100-2 1 1 0 000 2zM20 21a1 1 0 100-2 1 1 0 000 2z",
  ),
  garage: makeIcon("M3 21V8l9-5 9 5v13M9 21v-7h6v7M3 12h18"),
  chevDown: makeIcon("M6 9l6 6 6-6"),
  chevRight: makeIcon("M9 6l6 6-6 6"),
  chevLeft: makeIcon("M15 6l-6 6 6 6"),
  chevUp: makeIcon("M18 15l-6-6-6 6"),
  close: makeIcon("M18 6L6 18M6 6l12 12"),
  check: makeIcon("M20 6L9 17l-5-5"),
  plus: makeIcon("M12 5v14M5 12h14"),
  minus: makeIcon("M5 12h14"),
  menu: makeIcon("M3 6h18M3 12h18M3 18h18"),
  truck: makeIcon(
    "M1 3h15v13H1zM16 8h4l3 3v5h-7M5.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM18.5 21a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  ),
  shield: makeIcon("M12 2l9 4v6c0 5-3.5 9-9 10-5.5-1-9-5-9-10V6l9-4z"),
  shipping: makeIcon(
    "M3 7h11v10H3zM14 10h4l3 3v4h-7M7 21a2 2 0 100-4 2 2 0 000 4zM18 21a2 2 0 100-4 2 2 0 000 4z",
  ),
  return: makeIcon("M3 12a9 9 0 1015-6.7L21 8M21 3v5h-5"),
  star: makeIcon(
    "M12 2l3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3 1.2-6.9-5-4.9 7-1z",
    { fill: true },
  ),
  starOutline: makeIcon(
    "M12 2l3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8l-6.3 3.3 1.2-6.9-5-4.9 7-1z",
  ),
  heart: makeIcon(
    "M20.84 4.6a5.5 5.5 0 00-7.78 0L12 5.66l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z",
  ),
  filter: makeIcon("M4 6h16M7 12h10M10 18h4"),
  phone: makeIcon(
    "M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3 19.5 19.5 0 01-6-6 19.8 19.8 0 01-3-8.7A2 2 0 014.1 2h3a2 2 0 012 1.7c.1.9.3 1.8.6 2.6a2 2 0 01-.5 2.1L8 9.6a16 16 0 006 6l1.2-1.2a2 2 0 012.1-.5c.8.3 1.7.5 2.6.6a2 2 0 011.7 2z",
  ),
  chat: makeIcon("M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"),
  arrowR: makeIcon("M5 12h14M13 5l7 7-7 7"),
  mail: makeIcon(
    "M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2zM22 6l-10 7L2 6",
  ),
  clock: makeIcon("M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2"),
  box: makeIcon("M21 8l-9-5-9 5 9 5 9-5zM3 8v8l9 5 9-5V8M12 13v8"),
  bolt: makeIcon("M13 2L3 14h9l-1 8 10-12h-9z", { fill: true }),
  cc: makeIcon("M2 7h20v12H2zM2 11h20"),
  trash: makeIcon(
    "M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6",
  ),
  grid: makeIcon("M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"),
  list: makeIcon(
    "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  ),
  alert: makeIcon(
    "M10.3 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01",
  ),
  external: makeIcon(
    "M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3",
  ),
  share: makeIcon(
    "M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13",
  ),
};

export type IconName = keyof typeof Icons;
