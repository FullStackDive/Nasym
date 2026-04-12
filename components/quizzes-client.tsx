"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge, Card, Input } from "@/components/ui";

type Quiz = { id: string; title: string; description: string; createdAt: string; lesson?: { id: string; title: string } | null };

export default function QuizzesClient() {
  const [items, setItems] = useState<Quiz[]>([]);
  const [q, setQ] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function fetchQuizzes(query: string) {
    const url = query ? `/api/public/quizzes?q=${encodeURIComponent(query)}` : "/api/public/quizzes";
    fetch(url)
      .then((r) => r.json())
      .then((d) => setItems(d.quizzes ?? []))
      .catch(() => {});
  }

  useEffect(() => {
    fetchQuizzes("");
  }, []);

  function handleSearch(value: string) {
    setQ(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchQuizzes(value), 300);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-black">Quizzes</h1>
      <p className="mt-2 text-slate-600">Practice what you learned with short quizzes.</p>

      <div className="mt-4">
        <Input
          placeholder="Search quizzes by title or description…"
          value={q}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {items.length === 0 ? (
          <Card className="p-6 text-sm text-slate-600">{q ? "No quizzes matched your search." : "No quizzes yet."}</Card>
        ) : (
          items.map((quiz) => (
            <Card key={quiz.id} className="p-6">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-extrabold">{quiz.title}</h2>
                {quiz.lesson ? <Badge>{quiz.lesson.title}</Badge> : <Badge>Quiz</Badge>}
              </div>
              <p className="mt-3 text-sm text-slate-700 line-clamp-3">{quiz.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <Link className="text-sm font-semibold" href={`/quizzes/${quiz.id}`}>Open quiz →</Link>
                <span className="text-xs text-slate-500">{new Date(quiz.createdAt).toLocaleDateString()}</span>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
