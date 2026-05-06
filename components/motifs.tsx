"use client";

import { CSSProperties } from "react";

/* Decorative breeze SVG — three thin arcs evoking the logo */
export const Breeze = ({
  opacity = 0.15,
  color = "var(--c-mid)",
  style,
}: {
  opacity?: number;
  color?: string;
  style?: CSSProperties;
}) => (
  <svg
    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none", ...style }}
    viewBox="0 0 800 400"
    preserveAspectRatio="none"
    aria-hidden
  >
    <g fill="none" stroke={color} strokeWidth="1.4" strokeLinecap="round">
      <path d="M-20 100 Q 200 40 400 110 T 820 90" />
      <path d="M-20 200 Q 220 140 420 210 T 820 190" />
      <path d="M-20 300 Q 200 240 400 310 T 820 290" />
    </g>
  </svg>
);

/* Subtle leaf cluster */
export const LeafSprig = ({ size = 28, color = "#7BA85C", style }: { size?: number; color?: string; style?: CSSProperties }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden style={style}>
    <path d="M16 28 Q 16 18 22 12 Q 26 9 28 6" stroke={color} strokeWidth="0.8" strokeLinecap="round" />
    <path d="M22 12 q 4 -1 5 2 q -2 4 -5 -2 z" fill={color} opacity="0.85" />
    <path d="M19 18 q 3 -1 4 1.5 q -1.5 3 -4 -1.5 z" fill={color} opacity="0.7" />
    <path d="M16 24 q -3 -1 -4 1.5 q 1.5 3 4 -1.5 z" fill={color} opacity="0.6" />
  </svg>
);

/* Khatam — eight-point geometric */
export const KhatamPattern = ({
  opacity = 0.05,
  color = "var(--brand-700)",
  style,
}: {
  opacity?: number;
  color?: string;
  style?: CSSProperties;
}) => (
  <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity, pointerEvents: "none", ...style }} aria-hidden>
    <defs>
      <pattern id="khatam-pat" width="80" height="80" patternUnits="userSpaceOnUse">
        <g fill="none" stroke={color} strokeWidth="1">
          <path d="M40 4l8 28 28 8-28 8-8 28-8-28-28-8 28-8z" />
          <path d="M40 4l-8 28-28 8 28 8 8 28 8-28 28-8-28-8z" transform="rotate(22.5 40 40)" />
        </g>
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#khatam-pat)" />
  </svg>
);
