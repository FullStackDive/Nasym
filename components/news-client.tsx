"use client";

import { useEffect, useState } from "react";
import { Badge, Card } from "@/components/ui";

type News = { id: string; title: string; body: string; pinned: boolean; createdAt: string };

export default function NewsClient() {
  const [posts, setPosts] = useState<News[]>([]);

  useEffect(() => {
    fetch("/api/admin/news") // public GET (by design)
      .then((r) => r.json())
      .then((d) => setPosts(d.posts ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">News</h1>
      <p className="mt-2 text-slate-600">Announcements, reminders, and updates.</p>

      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600">No posts yet.</Card>
        ) : (
          posts.map((n) => (
            <Card key={n.id} className="p-5">
              <div className="flex flex-wrap items-center gap-2">
                {n.pinned && <Badge>Pinned</Badge>}
                <h2 className="text-lg font-extrabold">{n.title}</h2>
                <span className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleString()}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{n.body}</p>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
