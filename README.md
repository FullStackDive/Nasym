# Noor — Islamic Learning & Live Classes (Next.js Fullstack)

A single-repo Next.js (App Router) application with:
- ✅ Responsive Islamic theme (light green + white)
- ✅ Student/Admin accounts (email/password)
- ✅ Role-based permissions (granular, assignable)
- ✅ Home posters + News board
- ✅ Live classroom (embedded video meeting) using **Jitsi Meet IFrame API**
- ✅ Recorded lessons library (video embeds)
- ✅ Quizzes (questions + scoring + attempts)
- ✅ Moderation / Reporting system (students report, admins resolve)
- ✅ Extra: Daily Reminders habit checklist (local storage starter)

## Tech stack
- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- NextAuth (Credentials provider)
- Prisma + SQLite (easy local dev)

## Quick start

### 1) Install
```bash
npm i
```

### 2) Setup env
```bash
cp .env.example .env
# set NEXTAUTH_SECRET to a strong value
```

### 3) Database migration + seed
```bash
npx prisma migrate dev --name init
npm run seed
```

### 4) Run
```bash
npm run dev
```

Open http://localhost:3000

## Demo admin account
After seeding:
- Email: `admin@example.com`
- Password: `Admin123!`

> Change this password after first login by updating the record in DB (or add a “change password” screen later).

## Live classroom notes (Jitsi)
- By default it uses the public Jitsi deployment: `meet.jit.si`
- You can set `NEXT_PUBLIC_JITSI_DOMAIN` to your own Jitsi server domain.
- Classroom join requires sign-in.

## Permissions model

New permissions added:
- `manage_lessons`
- `manage_quizzes`
- `manage_reports`

- `ADMIN` has all permissions by default.
- `STUDENT` can be assigned any subset:
  - `manage_users`
  - `manage_news`
  - `manage_posters`
  - `manage_classes`

## Production notes (recommended)
- Switch SQLite to Postgres/MySQL for production.
- Use HTTPS and configure NextAuth cookies.
- Consider adding:
  - Password reset email
  - Moderation tools & audit logs
  - Content library (lessons, quizzes)
  - Push notifications for reminders/classes


## Quiz analytics
- Public stats + leaderboard per quiz
- Signed-in users can see their attempt history
- Admin analytics dashboard: /admin/analytics

## Moderation: Ban / Suspend users
- Admin can set user status to ACTIVE / SUSPENDED (until datetime) / BANNED
- Suspended and banned users are blocked from logging in (NextAuth Credentials authorize).
- Expired suspensions are auto-cleared on next authenticated request.
