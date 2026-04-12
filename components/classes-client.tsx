"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Card } from "@/components/ui";

type ClassSession = { id: string; title: string; description: string; scheduledAt: string; isLive: boolean };

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function ClassesClient() {
  const [classes, setClasses] = useState<ClassSession[]>([]);

  useEffect(() => {
    fetch("/api/public/classes")
      .then((r) => r.json())
      .then((d) => setClasses(d.classes ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black">Classes</h1>
      <p className="mt-2 text-slate-600">Browse scheduled sessions. You must sign in to join a classroom.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {classes.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600">No classes yet.</Card>
        ) : (
          classes.map((c) => (
            <Card key={c.id} className="p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-extrabold">{c.title}</h2>
                {c.isLive ? <Badge className="bg-red-100 text-red-800">Live</Badge> : <Badge>Scheduled</Badge>}
              </div>
              <p className="mt-2 text-xs text-slate-500">{formatDate(c.scheduledAt)}</p>
              <p className="mt-3 text-sm text-slate-700 line-clamp-3">{c.description}</p>
              <Link href={`/classes/${c.id}`} className="mt-4 inline-block text-sm font-semibold">
                Open classroom →
              </Link>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
