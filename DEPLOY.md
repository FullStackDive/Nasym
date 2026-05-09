# Deploying Nasym-Ur-Rahmah on a Free Stack

Target stack (all free tiers):
- **Hosting:** Vercel (Next.js native)
- **Database:** Neon Postgres (serverless, free 0.5 GB + branching)
- **File storage:** Vercel Blob (free 1 GB)
- **Email:** Resend or Brevo SMTP (free quotas)
- **Live video:** `meet.jit.si` public Jitsi (no signup)

---

## 1. Database — Neon

1. Sign up at https://console.neon.tech
2. Create a project (region close to your Vercel region).
3. From **Connection Details**:
   - Copy the **pooled** connection string → `DATABASE_URL`
   - Copy the **direct/unpooled** connection string → `DATABASE_URL_UNPOOLED`
4. Both must include `?sslmode=require`.

## 2. Vercel project

1. Push this repo to GitHub.
2. https://vercel.com/new → import the repo.
3. **Environment Variables** (Production + Preview + Development):

   | Key | Value |
   |---|---|
   | `DATABASE_URL` | pooled Neon URL |
   | `DATABASE_URL_UNPOOLED` | direct Neon URL |
   | `NEXTAUTH_URL` | `https://<project>.vercel.app` |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` output |
   | `NEXT_PUBLIC_JITSI_DOMAIN` | `meet.jit.si` |
   | `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | from Resend/Brevo |

4. **Storage** → Create → **Blob**. This auto-injects `BLOB_READ_WRITE_TOKEN`.
5. Deploy.

The build command (`prisma generate && prisma db push && next build`) provisions
the schema on first deploy. No manual migration step needed early-on.

## 3. Seed the admin user

After first successful deploy, run locally against the production DB:

```bash
DATABASE_URL="<prod pooled url>" \
DATABASE_URL_UNPOOLED="<prod direct url>" \
npm run seed
```

Default admin: `admin@example.com` / `Admin123!` — change immediately.

## 4. Email provider (free)

**Resend** (recommended, 3 000/mo):
- https://resend.com → API Keys → create
- Verify a domain (or use the `@resend.dev` sandbox sender for testing)
- SMTP creds: host `smtp.resend.com`, port `465`, user `resend`, pass `<api key>`

**Brevo** (300/day):
- https://brevo.com → SMTP & API → SMTP keys
- host `smtp-relay.brevo.com`, port `587`

## 5. Local development

```bash
cp .env.example .env
# Fill DATABASE_URL with a Neon dev branch (or local Postgres)
npm install
npx prisma db push
npm run seed
npm run dev
```

Without `BLOB_READ_WRITE_TOKEN`, file uploads fall back to `public/uploads/` and
`private/recordings/` on local disk. **These paths do not work on Vercel** — the
serverless filesystem is read-only — so production must have the Blob store
connected.

## 6. Limits to know (free tier)

- **Vercel function body:** ~4.5 MB. Recording multipart upload is capped at
  50 MB but real-world Vercel may reject anything > ~4.5 MB. For longer videos,
  upload to YouTube/Vimeo (unlisted) and paste the URL into the recording form.
- **Vercel Blob storage:** 1 GB / 10 GB bandwidth per month free.
- **Neon:** 0.5 GB storage, project auto-suspends after 5 min idle (cold starts).
- **Vercel functions:** 10 s timeout on Hobby plan. Long DB queries will fail.
- **Recordings privacy:** Vercel Blob free tier is public-URL only. The
  `/api/recordings/[id]/stream` route gates with auth then redirects to the
  blob URL — once a user has the URL they could share it. For stronger
  privacy, either embed a private YouTube/Vimeo URL, or upgrade to
  signed-URL storage.
