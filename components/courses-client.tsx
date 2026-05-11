"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Icon, AppBar } from "./ui";
import { KhatamPattern } from "./motifs";
import { ENROLMENT_FORM_URL, SOCIAL_LINKS } from "@/lib/site";

type Course = {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  isOpenForEnrolment?: boolean;
  isArchived?: boolean;
  enrolmentFormUrl?: string | null;
  startsAt?: string | null;
  endsAt?: string | null;
  createdAt: string;
  owner: { id: string; name: string };
  _count: { enrolments?: number; modules?: number; lessons?: number };
};

const gradients = [
  "linear-gradient(135deg, var(--brand-700), var(--brand-900))",
  "linear-gradient(135deg, var(--c-mid), var(--brand-700))",
  "linear-gradient(135deg, var(--accent-500), var(--accent-600))",
  "linear-gradient(135deg, var(--mint-300), var(--c-mid))",
];

const CoursesClient = () => {
  const router = useRouter();
  const { status } = useSession();
  const [tab, setTab] = useState("lessons");
  const [active, setActive] = useState<Course[]>([]);
  const [past, setPast] = useState<Course[]>([]);
  const [mine, setMine] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const publicRes = await fetch("/api/public/courses").then(r => r.ok ? r.json() : null).catch(() => null);
      const list: Course[] = publicRes?.courses ?? [];
      setActive(list.filter(c => !c.isArchived && c.isOpenForEnrolment));
      setPast(list.filter(c => c.isArchived || (!c.isOpenForEnrolment && c.endsAt && new Date(c.endsAt) < new Date())));

      if (status === "authenticated") {
        const mineRes = await fetch("/api/courses").then(r => r.ok ? r.json() : null).catch(() => null);
        setMine(mineRes?.courses ?? []);
      } else {
        setMine([]);
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { if (status !== "loading") load(); }, [load, status]);

  const otherPublished = useMemo(() => {
    return active.filter(c => !active.includes(c) && !past.includes(c));
  }, [active, past]);

  function matches(c: Course) {
    const q = search.toLowerCase();
    return !q || c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
  }

  return (
    <div className="app">
      <AppBar active={tab} onNav={setTab} showSearch />
      <div className="app-scroll">
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: "40px 32px 64px" }}>

          <div style={{ marginBottom: 32 }}>
            <div className="eyebrow">Your learning</div>
            <h1 className="serif" style={{ fontSize: 42, fontWeight: 500, margin: "10px 0 6px" }}>Courses</h1>
            <p style={{ color: "var(--ink-3)", fontSize: 15 }}>Structured knowledge, lesson by lesson.</p>
          </div>

          <div style={{ position: "relative", maxWidth: 420, marginBottom: 28 }}>
            <span style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", lineHeight: 0 }}>
              <Icon name="search" size={16} />
            </span>
            <input className="input" style={{ paddingLeft: 40 }} placeholder="Search courses…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {loading ? (
            <div style={{ color: "var(--ink-3)", fontSize: 15 }}>Loading courses…</div>
          ) : (
            <>
              {status === "authenticated" && mine.length > 0 && (
                <Section
                  eyebrow="Enrolled"
                  title="My courses"
                  description="Pick up where you left off."
                >
                  <Grid>
                    {mine.filter(matches).map((c, i) => (
                      <CourseCard
                        key={c.id}
                        course={c}
                        gradient={gradients[i % gradients.length]}
                        onClick={() => router.push(`/courses/${c.id}`)}
                      />
                    ))}
                  </Grid>
                </Section>
              )}

              <Section
                eyebrow="Now open"
                title="Active enrolment"
                description="Currently running cohorts open for new students."
              >
                {active.filter(matches).length === 0 ? (
                  <EmptyOpen />
                ) : (
                  <Grid>
                    {active.filter(matches).map((c, i) => (
                      <CourseCard
                        key={c.id}
                        course={c}
                        gradient={gradients[i % gradients.length]}
                        emphasis
                        onClick={() => router.push(`/courses/${c.id}`)}
                      />
                    ))}
                  </Grid>
                )}
              </Section>

              {otherPublished.length > 0 && (
                <Section eyebrow="More" title="Other courses">
                  <Grid>
                    {otherPublished.filter(matches).map((c, i) => (
                      <CourseCard key={c.id} course={c} gradient={gradients[i % gradients.length]} onClick={() => router.push(`/courses/${c.id}`)} />
                    ))}
                  </Grid>
                </Section>
              )}

              {past.length > 0 && (
                <Section eyebrow="Past batches" title="Previous courses" description="Materials from earlier cohorts may be available on request.">
                  <Grid>
                    {past.filter(matches).map((c, i) => (
                      <CourseCard key={c.id} course={c} gradient={gradients[i % gradients.length]} archived onClick={() => router.push(`/courses/${c.id}`)} />
                    ))}
                  </Grid>
                </Section>
              )}

              {active.length === 0 && past.length === 0 && mine.length === 0 && (
                <div className="surface" style={{ padding: 48, textAlign: "center" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>No courses published yet</div>
                  <p style={{ color: "var(--ink-3)", fontSize: 14, marginBottom: 16 }}>Want to be notified when the next batch opens?</p>
                  <a href={ENROLMENT_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Register interest</a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Section = ({ eyebrow, title, description, children }: { eyebrow: string; title: string; description?: string; children: React.ReactNode }) => (
  <section style={{ marginBottom: 44 }}>
    <div style={{ marginBottom: 20 }}>
      <div className="eyebrow">{eyebrow}</div>
      <h2 className="serif" style={{ fontSize: 30, fontWeight: 500, margin: "8px 0 4px", letterSpacing: "-0.015em" }}>{title}</h2>
      {description && <p style={{ color: "var(--ink-3)", fontSize: 14, margin: 0 }}>{description}</p>}
    </div>
    {children}
  </section>
);

const Grid = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>{children}</div>
);

const EmptyOpen = () => (
  <div className="surface" style={{ padding: 32, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
    <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 14, maxWidth: 420 }}>
      No cohorts are open right now. Submit the admissions form and we&apos;ll reach out when the next batch begins, in shāʾ Allāh.
    </p>
    <a href={ENROLMENT_FORM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Apply for admission</a>
    <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ink-3)" }}>
      <a href={SOCIAL_LINKS.instagram} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-700)" }}>Instagram</a>
      <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" style={{ color: "var(--brand-700)" }}>Facebook</a>
    </div>
  </div>
);

const CourseCard = ({
  course,
  gradient,
  emphasis,
  archived,
  onClick,
}: {
  course: Course;
  gradient: string;
  emphasis?: boolean;
  archived?: boolean;
  onClick: () => void;
}) => {
  const enrolHref = course.enrolmentFormUrl || ENROLMENT_FORM_URL;
  const dateLine = course.startsAt
    ? `Starts ${new Date(course.startsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`
    : course.endsAt
      ? `Ended ${new Date(course.endsAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`
      : null;

  return (
    <div
      className="surface"
      style={{
        overflow: "hidden", transition: "transform 0.15s, box-shadow 0.15s",
        opacity: archived ? 0.85 : 1,
        border: emphasis ? "1px solid var(--mint-300)" : undefined,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(0,0,0,0.12)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ""; (e.currentTarget as HTMLDivElement).style.boxShadow = ""; }}
    >
      <div style={{ position: "relative", height: 140, background: course.coverUrl ? undefined : gradient, overflow: "hidden", cursor: "pointer" }} onClick={onClick}>
        {course.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverUrl} alt={course.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <KhatamPattern opacity={0.18} color="white" style={{ position: "absolute", inset: 0 }} />
        )}
        {emphasis && <span className="chip chip-mint" style={{ position: "absolute", top: 10, left: 10 }}>Open for enrolment</span>}
        {archived && <span className="chip" style={{ position: "absolute", top: 10, left: 10, background: "rgba(0,0,0,0.5)", color: "white", borderColor: "transparent" }}>Past batch</span>}
      </div>

      <div style={{ padding: "18px 20px 20px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--ink-3)", marginBottom: 6 }}>
          {course.owner.name}
        </div>
        <h3 onClick={onClick} style={{ fontSize: 17, fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3, cursor: "pointer" }}>{course.title}</h3>
        <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "0 0 14px", lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
          {course.description}
        </p>
        <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ink-3)", marginBottom: 12, flexWrap: "wrap" }}>
          {typeof course._count.modules === "number" && <span><Icon name="book" size={12} /> {course._count.modules} module{course._count.modules !== 1 ? "s" : ""}</span>}
          {typeof course._count.enrolments === "number" && <span><Icon name="users" size={12} /> {course._count.enrolments} student{course._count.enrolments !== 1 ? "s" : ""}</span>}
          {dateLine && <span>{dateLine}</span>}
        </div>
        {emphasis ? (
          <a href={enrolHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center" }}>Apply to enrol</a>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={onClick} style={{ width: "100%", justifyContent: "center" }}>View course</button>
        )}
      </div>
    </div>
  );
};

export default CoursesClient;
