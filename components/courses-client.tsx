"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Icon, AppBar } from "./ui";
import { KhatamPattern } from "./motifs";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  isPublished: boolean;
  createdAt: string;
  owner: { id: string; name: string };
  _count: { enrolments: number; modules: number };
};

const gradients = [
  "linear-gradient(135deg, var(--brand-700), var(--brand-900))",
  "linear-gradient(135deg, var(--c-mid), var(--brand-700))",
  "linear-gradient(135deg, var(--accent-500), var(--accent-600))",
  "linear-gradient(135deg, var(--mint-300), var(--c-mid))",
];

const CoursesClient = () => {
  const router = useRouter();
  const [tab, setTab] = useState("lessons");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/courses");
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = courses.filter(c =>
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} showSearch />
      <div className="app-scroll">
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 64px" }}>

          {/* Header */}
          <div style={{ marginBottom: 32 }}>
            <div className="eyebrow">Your learning</div>
            <h1 className="serif" style={{ fontSize: 42, fontWeight: 500, margin: "10px 0 6px" }}>Courses</h1>
            <p style={{ color: "var(--ink-3)", fontSize: 15 }}>Structured knowledge, lesson by lesson.</p>
          </div>

          {/* Search */}
          <div style={{ position: "relative", maxWidth: 420, marginBottom: 28 }}>
            <span style={{ position:"absolute", left: 14, top: "50%", transform:"translateY(-50%)", color:"var(--ink-3)", lineHeight: 0 }}>
              <Icon name="search" size={16} />
            </span>
            <input
              className="input"
              style={{ paddingLeft: 40 }}
              placeholder="Search courses…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ color: "var(--ink-3)", fontSize: 15 }}>Loading courses…</div>
          ) : filtered.length === 0 ? (
            <div className="surface" style={{ padding: 48, textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
              <div style={{ fontWeight: 600, marginBottom: 6 }}>
                {search ? "No courses match your search" : "No courses yet"}
              </div>
              <p style={{ color: "var(--ink-3)", fontSize: 14 }}>
                {search ? "Try a different search term." : "Courses you are enrolled in will appear here."}
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
              {filtered.map((course, i) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  gradient={gradients[i % gradients.length]}
                  onClick={() => router.push(`/courses/${course.id}`)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const CourseCard = ({
  course,
  gradient,
  onClick,
}: {
  course: Course;
  gradient: string;
  onClick: () => void;
}) => (
  <div
    className="surface"
    style={{ overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s" }}
    onClick={onClick}
    onMouseEnter={e => {
      (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)";
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLDivElement).style.transform = "";
      (e.currentTarget as HTMLDivElement).style.boxShadow = "";
    }}
  >
    {/* Cover */}
    <div style={{ position: "relative", height: 140, background: course.coverUrl ? undefined : gradient, overflow: "hidden" }}>
      {course.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={course.coverUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <KhatamPattern opacity={0.18} color="white" style={{ position:"absolute", inset: 0 }} />
      )}
      {!course.isPublished && (
        <span className="chip" style={{ position:"absolute", top: 10, right: 10, background:"rgba(0,0,0,0.5)", color:"white", borderColor:"transparent" }}>
          Draft
        </span>
      )}
    </div>

    {/* Body */}
    <div style={{ padding: "18px 20px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", marginBottom: 6 }}>
        {course.owner.name}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>{course.title}</h3>
      <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 14px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {course.description}
      </p>
      <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ink-3)" }}>
        <span><Icon name="book" size={12} /> {course._count.modules} module{course._count.modules !== 1 ? "s" : ""}</span>
        <span><Icon name="users" size={12} /> {course._count.enrolments} student{course._count.enrolments !== 1 ? "s" : ""}</span>
      </div>
    </div>
  </div>
);

export default CoursesClient;
