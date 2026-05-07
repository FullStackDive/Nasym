"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import NotificationBell from "./notification-bell";

/* ===== Icon set ===== */
type IconName =
  | "home" | "book" | "video" | "users" | "user" | "newspaper" | "bell"
  | "settings" | "search" | "play" | "pause" | "mic" | "mic-off" | "cam"
  | "cam-off" | "hand" | "send" | "rec" | "chat" | "poll" | "notes"
  | "trophy" | "flame" | "star" | "leaf" | "calendar" | "clock" | "check"
  | "plus" | "filter" | "more" | "shield" | "globe" | "lock" | "mail"
  | "moon" | "arrow-right" | "trend" | "download" | "upload" | "edit"
  | "trash" | "eye" | "key" | "wind";

interface IconProps { name: IconName; size?: number; stroke?: number; }

export const Icon = ({ name, size = 18, stroke = 1.6 }: IconProps) => {
  const p = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: stroke,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "home":      return <svg {...p}><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>;
    case "book":      return <svg {...p}><path d="M4 4h10a4 4 0 014 4v12H8a4 4 0 01-4-4V4z" /><path d="M4 4v12" /></svg>;
    case "video":     return <svg {...p}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /></svg>;
    case "users":     return <svg {...p}><circle cx="9" cy="8" r="3.5" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="17" cy="9" r="2.5" /><path d="M21 19c0-2.5-1.7-4.5-4-4.9" /></svg>;
    case "user":      return <svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>;
    case "newspaper": return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h6M7 13h6M7 17h4" /><path d="M16 9h2v8h-2" /></svg>;
    case "bell":      return <svg {...p}><path d="M6 16V11a6 6 0 0112 0v5l1.5 2H4.5L6 16z" /><path d="M10 20a2 2 0 004 0" /></svg>;
    case "settings":  return <svg {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3 1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8 1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>;
    case "search":    return <svg {...p}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>;
    case "play":      return <svg {...p}><path d="M8 5l11 7-11 7V5z" fill="currentColor" /></svg>;
    case "pause":     return <svg {...p}><rect x="6" y="5" width="4" height="14" fill="currentColor" /><rect x="14" y="5" width="4" height="14" fill="currentColor" /></svg>;
    case "mic":       return <svg {...p}><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg>;
    case "mic-off":   return <svg {...p}><path d="M3 3l18 18" /><path d="M9 9v3a3 3 0 005.5 1.7M15 12V6a3 3 0 00-6 0v1" /><path d="M5 11a7 7 0 0010.7 5.9M19 11a7 7 0 01-1 3.5" /></svg>;
    case "cam":       return <svg {...p}><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3" /></svg>;
    case "cam-off":   return <svg {...p}><path d="M3 3l18 18" /><path d="M16 10l5-3v10l-5-3" /><path d="M3 6h11l2 2v8H4a1 1 0 01-1-1V6z" /></svg>;
    case "hand":      return <svg {...p}><path d="M9 11V5a1.5 1.5 0 113 0v6" /><path d="M12 11V4a1.5 1.5 0 113 0v8" /><path d="M15 11V6a1.5 1.5 0 113 0v8a6 6 0 01-6 6 6 6 0 01-6-6v-3a1.5 1.5 0 113 0v1" /></svg>;
    case "send":      return <svg {...p}><path d="M22 2L11 13" /><path d="M22 2L15 22l-4-9-9-4 20-7z" /></svg>;
    case "rec":       return <svg {...p}><circle cx="12" cy="12" r="6" fill="currentColor" /></svg>;
    case "chat":      return <svg {...p}><path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" /></svg>;
    case "poll":      return <svg {...p}><rect x="4" y="11" width="3" height="9" /><rect x="10.5" y="6" width="3" height="14" /><rect x="17" y="14" width="3" height="6" /></svg>;
    case "notes":     return <svg {...p}><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9z" /><path d="M14 3v6h6" /><path d="M8 13h8M8 17h6" /></svg>;
    case "trophy":    return <svg {...p}><path d="M8 4h8v5a4 4 0 11-8 0V4z" /><path d="M4 5h4M16 5h4M9 13v3a2 2 0 01-2 2H5v2h14v-2h-2a2 2 0 01-2-2v-3" /></svg>;
    case "flame":     return <svg {...p}><path d="M12 3s5 4 5 9a5 5 0 01-10 0c0-2 1-4 1-4s2 2 3 2c0-3 1-5 1-7z" /></svg>;
    case "star":      return <svg {...p}><path d="M12 3l2.6 5.4 6 .8-4.3 4.2 1 6L12 16.8 6.7 19.4l1-6L3.4 9.2l6-.8L12 3z" /></svg>;
    case "leaf":      return <svg {...p}><path d="M21 4c0 9-6 16-15 16-1 0-2 0-3-.4 0-9 6-15.6 15-15.6 1 0 2 0 3 0z" /><path d="M3 20c5-5 9-7 14-12" /></svg>;
    case "calendar":  return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
    case "clock":     return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "check":     return <svg {...p}><path d="M5 12l5 5 9-11" /></svg>;
    case "plus":      return <svg {...p}><path d="M12 5v14M5 12h14" /></svg>;
    case "filter":    return <svg {...p}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" /></svg>;
    case "more":      return <svg {...p}><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></svg>;
    case "shield":    return <svg {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z" /></svg>;
    case "globe":     return <svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>;
    case "lock":      return <svg {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 118 0v4" /></svg>;
    case "mail":      return <svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>;
    case "moon":      return <svg {...p}><path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z" /></svg>;
    case "arrow-right":return <svg {...p}><path d="M5 12h14M13 5l7 7-7 7" /></svg>;
    case "trend":     return <svg {...p}><path d="M3 17l6-6 4 4 7-8" /><path d="M14 7h6v6" /></svg>;
    case "download":  return <svg {...p}><path d="M12 3v12M6 11l6 5 6-5" /><path d="M3 21h18" /></svg>;
    case "upload":    return <svg {...p}><path d="M12 19V7M6 11l6-6 6 6" /><path d="M3 21h18" /></svg>;
    case "edit":      return <svg {...p}><path d="M4 20h4l10-10-4-4L4 16v4z" /><path d="M14 6l4 4" /></svg>;
    case "trash":     return <svg {...p}><path d="M3 6h18" /><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" /><path d="M5 6l1 14a2 2 0 002 2h8a2 2 0 002-2l1-14" /></svg>;
    case "eye":       return <svg {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>;
    case "key":       return <svg {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12l9-9 2 2-2 2 2 2-2 2-2-2-2 2-3-3" /></svg>;
    case "wind":      return <svg {...p}><path d="M3 8h12a3 3 0 100-6 3 3 0 00-3 3" /><path d="M3 14h17a3 3 0 110 6 3 3 0 01-3-3" /><path d="M3 11h6" /></svg>;
    default: return null;
  }
};

/* ===== Logo ===== */
export const LogoMark = ({ size = 38 }: { size?: number }) => (
  <span className="logo-mark" style={{ width: size, height: size }}>
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden>
      <path d="M4 38 Q 22 30 32 36 T 60 32" stroke="var(--c-mid)" strokeOpacity="0.45" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M6 46 Q 22 40 34 44 T 60 42" stroke="var(--c-mid)" strokeOpacity="0.3" strokeWidth="1" strokeLinecap="round" fill="none" />
      <text x="6" y="46" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="48" fontWeight="600" fill="var(--brand-700)" letterSpacing="-1">R</text>
      <text x="28" y="46" fontFamily="Cormorant Garamond, Georgia, serif" fontSize="48" fontWeight="500" fill="var(--c-mid)" letterSpacing="-1">N</text>
      <path d="M44 28 q 4 -2 6 1 q -2 4 -6 -1 z" fill="#7BA85C" />
      <path d="M22 36 q 3 -1.5 5 1 q -1.5 3 -5 -1 z" fill="#9CC078" />
    </svg>
  </span>
);

export const Logo = ({ size = 38, compact = false }: { size?: number; compact?: boolean }) => (
  <div className="logo">
    <LogoMark size={size} />
    {!compact && (
      <span className="serif" style={{ fontSize: 17, fontWeight: 600, letterSpacing: "0.04em", color: "var(--ink)", whiteSpace: "nowrap" }}>NASYM UR RAHMAH</span>
    )}
  </div>
);

/* ===== Avatar ===== */
export const Avatar = ({ name = "?", size = 36, src }: { name?: string; size?: number; src?: string }) => {
  const initials = name.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase();
  const seed = name.charCodeAt(0) % 3;
  const grads = [
    "linear-gradient(135deg, #285260, #1E3F4A)",
    "linear-gradient(135deg, #548C92, #285260)",
    "linear-gradient(135deg, #AB9072, #8E754C)",
  ];
  return (
    <span className="avatar" style={{
      width: size, height: size, fontSize: size * 0.38,
      background: src ? `url(${src}) center/cover` : grads[seed],
    }}>{!src && initials}</span>
  );
};

/* ===== App bar ===== */
type Role = "STUDENT" | "ADMIN";
interface AppBarProps {
  active?: string;
  onNav?: (key: string) => void;
  role?: Role;
  showSearch?: boolean;
  userName?: string;
}

const STUDENT_ROUTES: Record<string, string> = {
  home: "/",
  dashboard: "/dashboard",
  classes: "/classes",
  lessons: "/lessons",
  news: "/news",
};

export const AppBar = ({ active, onNav, role = "STUDENT", showSearch = true, userName }: AppBarProps) => {
  const router = useRouter();
  const items: [string, string][] = role === "ADMIN"
    ? [["overview", "Overview"], ["users", "Users"], ["content", "Content"], ["analytics", "Analytics"], ["reports", "Reports"]]
    : [["home", "Home"], ["dashboard", "Dashboard"], ["classes", "Classes"], ["lessons", "Lessons"], ["news", "News"]];

  const handleNav = (k: string) => {
    if (role === "STUDENT" && STUDENT_ROUTES[k]) {
      router.push(STUDENT_ROUTES[k]);
    }
    onNav?.(k);
  };

  return (
    <div className="appbar">
      <span style={{ cursor: "pointer" }} onClick={() => router.push(role === "ADMIN" ? "/admin" : "/")}>
        <Logo />
      </span>
      <nav style={{ marginLeft: 12 }}>
        {items.map(([k, label]) => (
          <a key={k} className={active === k ? "active" : ""} style={{ cursor: "pointer" }} onClick={() => handleNav(k)}>{label}</a>
        ))}
      </nav>
      <div style={{ flex: 1 }} />
      {showSearch && (
        <div style={{ position: "relative", width: 300 }}>
          <span style={{ position: "absolute", left: 14, top: 11, color: "var(--ink-3)" }}><Icon name="search" size={16} /></span>
          <input className="input" placeholder="Search lessons, ayāt, classes…" style={{ paddingLeft: 38, height: 40, borderRadius: 999 }} />
          <span style={{ position: "absolute", right: 8, top: 9, display: "flex", gap: 4 }}>
            <span className="kbd">⌘K</span>
          </span>
        </div>
      )}
      <NotificationBell />
      <span style={{ cursor: "pointer" }} onClick={() => router.push("/profile")}>
        <Avatar name={userName ?? (role === "ADMIN" ? "Imam Yusuf" : "Aisha Khan")} size={36} />
      </span>
    </div>
  );
};

/* ===== Stat card ===== */
interface StatProps { label: string; value: ReactNode; sub?: string; accent?: string; icon?: IconName; }
export const Stat = ({ label, value, sub, accent = "brand", icon }: StatProps) => (
  <div className="surface" style={{ padding: 22 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div className="eyebrow">{label}</div>
      {icon && <span style={{ color: `var(--${accent}-600)` }}><Icon name={icon} size={16} /></span>}
    </div>
    <div className="serif" style={{ marginTop: 8, fontSize: 36, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--brand-800)" }}>{value}</div>
    {sub && <div style={{ marginTop: 4, fontSize: 13, color: "var(--ink-3)" }}>{sub}</div>}
  </div>
);

/* ===== Placeholder (for missing images) ===== */
export const Placeholder = ({ label, h = 160, ratio }: { label: string; h?: number; ratio?: string }) => (
  <div style={{
    width: "100%", height: ratio ? "auto" : h,
    aspectRatio: ratio || undefined,
    borderRadius: 14,
    background: "repeating-linear-gradient(135deg, color-mix(in oklch, var(--brand-500) 8%, var(--bg-soft)) 0 8px, var(--bg-soft) 8px 16px)",
    border: "1px solid var(--hairline)",
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "var(--ink-3)", fontFamily: "JetBrains Mono, monospace", fontSize: 12, letterSpacing: ".06em",
  }}>{label}</div>
);

/* ===== Legacy compat shims =====
   The old ui.tsx exported these. Other unreplaced pages still import them.
   Re-skinned to the coastal palette so they compose with the new design. */

export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
}) {
  const variantClass: Record<ButtonVariant, string> = {
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
    ghost: "btn btn-ghost",
    danger: "btn btn-danger",
    accent: "btn btn-accent",
  };
  const sizeClass: Record<ButtonSize, string> = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };
  return <button className={cn(variantClass[variant], sizeClass[size], className)} {...props} />;
}

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("input", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("textarea", className)} {...props} />;
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card card-pad", className)} {...props} />;
}

type BadgeVariant = "brand" | "accent" | "muted";
export function Badge({
  className,
  variant = "brand",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  const variantClass: Record<BadgeVariant, string> = {
    brand: "chip chip-brand",
    accent: "chip chip-camel",
    muted: "chip",
  };
  return <span className={cn(variantClass[variant], className)} {...props} />;
}
