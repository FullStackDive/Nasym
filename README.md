# Nasym-ur-Rahmah — Islamic Learning & Live Classes

Next.js (App Router) fullstack platform for an Islamic learning community.

## Features

- Public admissions form (Google Form) + announcements + reflections (blog)
- Auth (NextAuth Credentials) — Admin, Teacher, Student, Parent roles
- Courses — active enrolment vs past batches; modules, materials, announcements
- Lessons library — search, filters, tags, real `<video>` player with progress save, offline cache, notes, transcript, discussion, linked quizzes
- Live classrooms (Jitsi IFrame)
- Quizzes with attempts + per-quiz analytics + leaderboard
- Granular per-user permissions assigned by admins
- In-app + email notifications, password reset, audit log

## Stack

- Next.js (App Router, Turbopack) + React 19 + TypeScript
- Prisma ORM + Postgres (Neon or Supabase free tier)
- NextAuth Credentials
- Vercel Blob for file storage
- Tailwind v4 + custom design tokens

## Local quick start

```bash
# 1) Install
npm install --ignore-scripts

# 2) Provision a free Postgres
#    Option A: https://console.neon.tech  → copy pooled + direct URLs
#    Option B: https://supabase.com → Project Settings → Database → Connection string
#      Use Transaction pooler (6543) for DATABASE_URL
#      Use Direct connection (5432) for DATABASE_URL_UNPOOLED

# 3) Configure .env  (copy .env.example then edit)
cp .env.example .env

# 4) Push schema + seed
./node_modules/.bin/prisma generate
./node_modules/.bin/prisma db push
npm run seed

# 5) Run
./node_modules/.bin/next dev
```

Open http://localhost:3000

Default admin from seed:
- Email: `admin@example.com`
- Password: `Admin123!`  ← change immediately via Profile → Settings → Password

## Deploy to Vercel

See [DEPLOY.md](DEPLOY.md) for the full Neon + Vercel Blob + SMTP walkthrough.
Build command (set in `package.json`):

```
prisma generate && prisma db push --accept-data-loss --skip-generate && next build
```

## Social + admissions

Configured in [lib/site.ts](lib/site.ts):

- Instagram — https://www.instagram.com/nasymurrahmah
- Facebook — https://www.facebook.com/share/1BMx3nmeGg/
- Admissions form — https://forms.gle/mhM624tZ9sDqXAPZA

Course-specific admissions URLs can be set per-course via the `enrolmentFormUrl`
field (admin/teacher PATCH on `/api/courses/[id]`).

## Permissions

`ADMIN` has every permission implicitly. Other roles can be granted any subset:

- `manage_users`
- `manage_news`
- `manage_posters`
- `manage_classes`
- `manage_lessons`
- `manage_quizzes`
- `manage_reports`

## Notes

- Long videos (>4 MB) should be hosted on YouTube/Vimeo (unlisted) and embedded by URL — Vercel function body limit is ~4.5 MB.
- Free Neon/Supabase tiers cold-start after idle; first request may take a few seconds.
- Recordings on Vercel Blob free tier are public-URL only; the streaming route gates with auth but the URL itself is shareable. Use unlisted YouTube/Vimeo for stronger privacy.
