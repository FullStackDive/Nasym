"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";

type PermissionKey = "manage_users" | "manage_news" | "manage_posters" | "manage_classes" | "manage_lessons" | "manage_quizzes" | "manage_reports";

export default function AdminClient() {
  const [role, setRole] = useState<"ADMIN" | "STUDENT">("STUDENT");
  const [permissions, setPermissions] = useState<PermissionKey[]>([]);

  useEffect(() => {
    fetch("/api/me/permissions")
      .then((r) => r.json())
      .then((d) => {
        setRole(d.role ?? "STUDENT");
        setPermissions(d.permissions ?? []);
      })
      .catch(() => {});
  }, []);

  const can = (k: PermissionKey) => role === "ADMIN" || permissions.includes(k);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black">Admin Panel</h1>
          <p className="mt-2 text-slate-600">Manage users, news, posters, and classes.</p>
        </div>
        <Badge>{role}</Badge>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-extrabold">Users & Permissions</h3>
          <p className="mt-2 text-sm text-slate-600">Create users and assign permissions.</p>
          <Link href="/admin/users" className="mt-4 inline-block">
            <Button disabled={!can("manage_users")}>Open</Button>
          </Link>
          {!can("manage_users") && <p className="mt-2 text-xs text-red-600">No permission</p>}
        </Card>

        <Card className="p-6">
          <h3 className="font-extrabold">News Board</h3>
          <p className="mt-2 text-sm text-slate-600">Create announcements for the home/news page.</p>
          <Link href="/admin/news" className="mt-4 inline-block">
            <Button disabled={!can("manage_news")}>Open</Button>
          </Link>
          {!can("manage_news") && <p className="mt-2 text-xs text-red-600">No permission</p>}
        </Card>

        <Card className="p-6">
          <h3 className="font-extrabold">Home Posters</h3>
          <p className="mt-2 text-sm text-slate-600">Upload/attach poster images to make home attractive.</p>
          <Link href="/admin/posters" className="mt-4 inline-block">
            <Button disabled={!can("manage_posters")}>Open</Button>
          </Link>
          {!can("manage_posters") && <p className="mt-2 text-xs text-red-600">No permission</p>}
        </Card>

        <Card className="p-6">
          <h3 className="font-extrabold">Live Classes</h3>
          <p className="mt-2 text-sm text-slate-600">Create class sessions (Jitsi room names + schedule).</p>
          <Link href="/admin/classes" className="mt-4 inline-block">
            <Button disabled={!can("manage_classes")}>Open</Button>
          </Link>
          {!can("manage_classes") && <p className="mt-2 text-xs text-red-600">No permission</p>}
        </Card>


<Card className="p-6">
  <h3 className="font-extrabold">Recorded Lessons</h3>
  <p className="mt-2 text-sm text-slate-600">Create a lesson library with video embeds and tags.</p>
  <Link href="/admin/lessons" className="mt-4 inline-block">
    <Button disabled={!can("manage_lessons")}>Open</Button>
  </Link>
  {!can("manage_lessons") && <p className="mt-2 text-xs text-red-600">No permission</p>}
</Card>

<Card className="p-6">
  <h3 className="font-extrabold">Quizzes</h3>
  <p className="mt-2 text-sm text-slate-600">Create quizzes and questions linked to lessons.</p>
  <Link href="/admin/quizzes" className="mt-4 inline-block">
    <Button disabled={!can("manage_quizzes")}>Open</Button>
  </Link>
  {!can("manage_quizzes") && <p className="mt-2 text-xs text-red-600">No permission</p>}
</Card>

<Card className="p-6">
  <h3 className="font-extrabold">Moderation / Reports</h3>
  <p className="mt-2 text-sm text-slate-600">Review user reports and mark them resolved.</p>
  <Link href="/admin/reports" className="mt-4 inline-block">
    <Button disabled={!can("manage_reports")}>Open</Button>
  </Link>
  {!can("manage_reports") && <p className="mt-2 text-xs text-red-600">No permission</p>}
</Card>
      </div>
    </div>
  );
}
