"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Card, Input } from "@/components/ui";

type Lesson = { id: string; title: string; description: string; videoUrl: string; tags?: string | null; createdAt: string };

export default function LessonsClient() {
  const [items, setItems] = useState<Lesson[]>([]);
  const [q, setQ] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchLessons(query: string) {
    const url = query ? `/api/public/lessons?q=${encodeURIComponent(query)}` : "/api/public/lessons";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setItems(d.lessons ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    fetchLessons("");
  }, []);

  function handleSearch(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchLessons(value), 300);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">Recorded Lessons</h1>
      <p className="mt-2 text-slate-600">Watch short lessons, learn step-by-step, and review anytime.</p>

      <div className="mt-4">
        <Input
          placeholder="Search lessons by title, topic, or tag…"
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600">{q ? "No lessons matched your search." : "No lessons yet."}</Card>
        ) : (
          items.map((l) => (
            <Card key={l.id} className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold">{l.title}</h2>
                {l.tags ? <Badge>{l.tags.split(",")[0]}</Badge> : <Badge>Lesson</Badge>}
              </div>
              <p className="mt-3 text-sm text-slate-700 line-clamp-3">{l.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <Link className="text-sm font-semibold" href={`/lessons/${l.id}`}>Open lesson →</Link>
                <span className="text-xs text-slate-500">{new Date(l.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
