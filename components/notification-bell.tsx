"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "./ui";

type Notif = {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  read: boolean;
  createdAt: string;
};

const timeAgo = (iso: string) => {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (secs < 60) return "just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
};

const NotificationBell = () => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notifications);
        setUnread(data.unreadCount);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60000); // poll every minute
    return () => clearInterval(interval);
  }, [load]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    setUnread(0);
  };

  const openOne = async (n: Notif) => {
    if (!n.read) {
      fetch(`/api/notifications/${n.id}`, { method: "PATCH" }).catch(() => {});
      setNotifs(ns => ns.map(x => x.id === n.id ? { ...x, read: true } : x));
      setUnread(u => Math.max(0, u - 1));
    }
    if (n.href) router.push(n.href);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position:"relative" }}>
      <button
        className="btn btn-ghost"
        style={{ padding: 8, position:"relative" }}
        onClick={() => setOpen(o => !o)}
        title="Notifications"
      >
        <Icon name="bell" size={18} />
        {unread > 0 && (
          <span style={{
            position:"absolute", top: 4, right: 4,
            background:"#e53e3e", color:"white",
            fontSize: 9, fontWeight: 800,
            minWidth: 16, height: 16, borderRadius: 999,
            display:"flex", alignItems:"center", justifyContent:"center",
            padding:"0 4px",
          }}>{unread > 99 ? "99+" : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position:"absolute", top:"calc(100% + 8px)", right: 0,
          width: 380, maxHeight: 500,
          background:"var(--surface)", border:"1px solid var(--hairline)",
          borderRadius: 12, boxShadow:"0 12px 32px rgba(0,0,0,0.12)",
          zIndex: 100, overflow:"hidden",
          display:"flex", flexDirection:"column",
        }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 16px", borderBottom:"1px solid var(--hairline)" }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>Notifications</div>
            {unread > 0 && (
              <button className="btn btn-ghost btn-sm" style={{ fontSize: 12, color:"var(--brand-700)" }} onClick={markAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ overflowY:"auto", flex: 1 }}>
            {notifs.length === 0 ? (
              <div style={{ padding: 32, textAlign:"center", color:"var(--ink-3)", fontSize: 13 }}>
                No notifications yet
              </div>
            ) : (
              notifs.map(n => (
                <button
                  key={n.id}
                  onClick={() => openOne(n)}
                  style={{
                    width:"100%", textAlign:"left", display:"block",
                    padding:"12px 16px",
                    background: n.read ? "transparent" : "color-mix(in oklch, var(--brand-500) 6%, transparent)",
                    border:"none", borderBottom:"1px solid var(--hairline)",
                    cursor:"pointer", fontFamily:"inherit", color:"inherit",
                  }}
                >
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: n.read ? 500 : 700, fontSize: 13, marginBottom: 4 }}>{n.title}</div>
                      <div style={{ fontSize: 12, color:"var(--ink-3)", lineHeight: 1.4, overflow:"hidden", display:"-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient:"vertical" }}>
                        {n.body}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color:"var(--ink-3)", flexShrink: 0 }}>{timeAgo(n.createdAt)}</div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
