"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge, Button, Card, cn } from "@/components/ui";

type Poster = { id: string; title: string; imageUrl: string; ctaText?: string | null; ctaHref?: string | null };
type News = { id: string; title: string; body: string; pinned: boolean; createdAt: string };
type ClassSession = { id: string; title: string; description: string; scheduledAt: string; isLive: boolean };

const ayahPool = [
  { arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا", translit: "Wa qur rabbi zidni 'ilma", ref: "Qur'an 20:114", meaning: "\"My Lord, increase me in knowledge.\"" },
  { arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا", translit: "Inna ma'al 'usri yusra", ref: "Qur'an 94:6", meaning: "\"With hardship comes ease.\"" },
  { arabic: "وَأَقِيمُوا الصَّلَاةَ", translit: "Wa aqeemus-salah", ref: "Qur'an 2:43", meaning: "\"Establish prayer.\"" },
  { arabic: "وَاعْتَصِمُوا بِحَبْلِ اللَّهِ جَمِيعًا", translit: "Wa'tasimoo bihablillahi jami'an", ref: "Qur'an 3:103", meaning: "\"Hold firmly to the rope of Allah all together, and do not become divided.\"" },
  { arabic: "إِنَّ أَكْرَمَكُمْ عِندَ اللَّهِ أَتْقَاكُمْ", translit: "Inna akramakum 'indallahi atqakum", ref: "Qur'an 49:13", meaning: "\"The most noble of you in the sight of Allah is the most righteous.\"" },
  { arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ", translit: "Fadhkurooni adhkurkum", ref: "Qur'an 2:152", meaning: "\"Remember Me, and I will remember you.\"" },
  { arabic: "لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا", translit: "La yukallifu Allahu nafsan illa wus'aha", ref: "Qur'an 2:286", meaning: "\"Allah does not burden a soul beyond that it can bear.\"" },
  { arabic: "قُلْ يَا عِبَادِيَ الَّذِينَ أَسْرَفُوا عَلَىٰ أَنفُسِهِمْ لَا تَقْنَطُوا مِن رَّحْمَةِ اللَّهِ", translit: "Qul ya 'ibadiyalladhina asrafu 'ala anfusihim la taqnatu min rahmatillah", ref: "Qur'an 39:53", meaning: "\"Do not despair of the mercy of Allah.\"" },
  { arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ", translit: "La'in shakartum la'azeedannakum", ref: "Qur'an 14:7", meaning: "\"If you are grateful, I will surely increase you in favour.\"" },
  { arabic: "وَسَارِعُوا إِلَىٰ مَغْفِرَةٍ مِّن رَّبِّكُمْ", translit: "Wasari'u ila maghfiratin min rabbikum", ref: "Qur'an 3:133", meaning: "\"Race toward forgiveness from your Lord.\"" },
  { arabic: "اتْلُ مَا أُوحِيَ إِلَيْكَ مِنَ الْكِتَابِ وَأَقِمِ الصَّلَاةَ", translit: "Utlu ma uhiya ilayka minal kitabi wa aqimis salah", ref: "Qur'an 29:45", meaning: "\"Recite what has been revealed to you of the Book and establish prayer.\"" },
  { arabic: "وَبِالْوَالِدَيْنِ إِحْسَانًا", translit: "Wa bilwalidayni ihsana", ref: "Qur'an 2:83", meaning: "\"Be good to parents.\"" },
  { arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ", translit: "Innallaha ma'as sabireen", ref: "Qur'an 2:153", meaning: "\"Indeed, Allah is with the patient.\"" },
  { arabic: "خُذِ الْعَفْوَ وَأْمُرْ بِالْعُرْفِ", translit: "Khudh al-'afwa wa'mur bil-'urf", ref: "Qur'an 7:199", meaning: "\"Show forgiveness, enjoin good, and turn away from the ignorant.\"" },
  { arabic: "وَتَعَاوَنُوا عَلَى الْبِرِّ وَالتَّقْوَىٰ", translit: "Wata'awanu 'ala al-birri wat-taqwa", ref: "Qur'an 5:2", meaning: "\"Cooperate in righteousness and piety.\"" },
];

const hadithPool = [
  { text: "The best of you are those who learn the Qur'an and teach it.", source: "Sahih Bukhari 5027" },
  { text: "Actions are judged by intentions.", source: "Sahih Bukhari 1" },
  { text: "None of you truly believes until he loves for his brother what he loves for himself.", source: "Sahih Bukhari 13" },
  { text: "Speak good or remain silent.", source: "Sahih Bukhari 6018" },
  { text: "The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry.", source: "Sahih Bukhari 6114" },
  { text: "Make things easy and do not make them difficult; give glad tidings and do not repel people.", source: "Sahih Bukhari 69" },
  { text: "Smiling at your brother is an act of charity.", source: "Jami' at-Tirmidhi 1956" },
  { text: "Every act of kindness is charity.", source: "Sahih Bukhari 2989" },
  { text: "The most beloved of deeds to Allah are those that are most consistent, even if they are small.", source: "Sahih Bukhari 6464" },
  { text: "Whoever believes in Allah and the Last Day should speak good or remain silent.", source: "Sahih Bukhari 6136" },
  { text: "He who does not thank people does not thank Allah.", source: "Sunan Abu Dawud 4811" },
  { text: "Seek knowledge from the cradle to the grave.", source: "Attributed hadith" },
  { text: "The world is a prison for the believer and a paradise for the disbeliever.", source: "Sahih Muslim 2956" },
  { text: "Do not be angry, and Paradise is yours.", source: "Musnad Ahmad 9579" },
  { text: "Whoever removes a worldly hardship from a believer, Allah will remove one of the hardships of the Day of Resurrection from him.", source: "Sahih Muslim 2699" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function dayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  return Math.floor((now.getTime() - start.getTime()) / 86400000);
}

export default function HomeClient() {
  const [posters, setPosters] = useState<Poster[]>([]);
  const [news, setNews] = useState<News[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [ayah] = useState(() => ayahPool[dayOfYear() % ayahPool.length]);
  const [hadith] = useState(() => hadithPool[(dayOfYear() + 1) % hadithPool.length]);

  useEffect(() => {
    fetch("/api/public/home")
      .then((r) => r.json())
      .then((d) => {
        setPosters(d.posters ?? []);
        setNews(d.news ?? []);
        setClasses(d.upcomingClasses ?? []);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/80 via-white to-white dark:from-brand-950/40 dark:via-slate-950 dark:to-slate-950"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full bg-accent-200/40 blur-3xl dark:bg-accent-700/10"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-brand-200/50 blur-3xl dark:bg-brand-700/10"
        />

        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center md:py-16">
          <div>
            <Badge variant="accent" className="mb-3">For Youth • Clear • Kind</Badge>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-slate-900 dark:text-slate-50 md:text-5xl">
              Learn Islam.{" "}
              <span className="bg-gradient-to-r from-brand-700 to-brand-500 bg-clip-text text-transparent">
                Join live classes.
              </span>{" "}
              Build good habits.
            </h1>
            <p className="mt-4 max-w-xl text-slate-700 dark:text-slate-300">
              Nasym-ur-Rahmah is an Islamic learning space designed for young people — live classrooms, reminders, and a positive community.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/classes"><Button size="lg">Browse classes</Button></Link>
              <Link href="/lessons"><Button variant="secondary" size="lg">Recorded lessons</Button></Link>
              <Link href="/quizzes"><Button variant="ghost" size="lg">Quizzes</Button></Link>
              <Link href="/reminders"><Button variant="ghost" size="lg">Daily reminders</Button></Link>
            </div>

            <Card className="mt-8 p-6 ring-1 ring-brand-100/70 dark:ring-brand-900/40">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent-500" />
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700 dark:text-brand-300">Ayah of the Day</p>
              </div>
              <p className="mt-1 text-sm font-semibold text-brand-800 dark:text-brand-200">{ayah.ref}</p>
              <p className="arabic mt-3 text-2xl font-extrabold text-slate-900 dark:text-slate-50" dir="rtl">{ayah.arabic}</p>
              <p className="mt-2 text-sm italic text-slate-600 dark:text-slate-400">{ayah.translit}</p>
              <p className="mt-3 text-sm text-slate-700 dark:text-slate-300">{ayah.meaning}</p>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-brand-200/60 via-accent-100/40 to-transparent blur-2xl opacity-70 dark:from-brand-700/20 dark:via-accent-700/10" />
            <Card className="relative overflow-hidden ring-1 ring-brand-100/70 dark:ring-brand-900/40">
              {posters.length > 0 ? (
                <div className="relative aspect-[16/10] w-full">
                  <Image
                    src={posters[0].imageUrl}
                    alt={posters[0].title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-0 p-5">
                    <Badge variant="accent" className="mb-2">Featured</Badge>
                    <h2 className="mt-1 text-white text-2xl font-black drop-shadow">{posters[0].title}</h2>
                    {posters[0].ctaHref && (
                      <Link href={posters[0].ctaHref} className="mt-3 inline-block">
                        <Button variant="accent">{posters[0].ctaText ?? "Open"}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative aspect-[16/10] w-full overflow-hidden p-8 bg-brand-gradient text-white">
                  <div aria-hidden className="absolute inset-0 opacity-20" style={{
                    backgroundImage:
                      "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.5) 0, transparent 40%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.35) 0, transparent 45%)"
                  }} />
                  <div className="relative">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Welcome</p>
                    <h2 className="mt-2 text-2xl font-black">A peaceful place to learn.</h2>
                    <p className="mt-2 max-w-sm text-sm text-white/90">
                      Admins can showcase posters here from the Admin panel.
                    </p>
                  </div>
                </div>
              )}
            </Card>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {posters.slice(1, 5).map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="relative aspect-[16/10] w-full">
                    <Image src={p.imageUrl} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 to-transparent" />
                    <div className="absolute bottom-0 p-3">
                      <p className="text-xs font-bold text-white line-clamp-2">{p.title}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {posters.length <= 1 && (
                <Card className="col-span-2 p-4 text-sm text-slate-600 dark:text-slate-300">
                  Add more posters to create an attractive home slider.
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Hadith of the Day */}
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-6">
        <Card className={cn("relative overflow-hidden p-6 ring-1 ring-accent-100/70 dark:ring-accent-900/30")}>
          <div aria-hidden className="absolute inset-y-0 left-0 w-1.5 bg-accent-gradient" />
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-700 dark:text-accent-300">Hadith of the Day</p>
          </div>
          <p className="mt-3 text-base font-semibold text-slate-800 dark:text-slate-100">&ldquo;{hadith.text}&rdquo;</p>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hadith.source}</p>
        </Card>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <Card className="p-6 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold tracking-tight">News Board</h3>
            <Link href="/news" className="text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">View all →</Link>
          </div>
          <div className="mt-4 space-y-4">
            {news.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No news posts yet.</p>
            ) : (
              news.slice(0, 5).map((n) => (
                <div key={n.id} className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-brand-800/60 dark:hover:bg-brand-950/30">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.pinned && <Badge variant="accent">Pinned</Badge>}
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">{n.title}</p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 line-clamp-3 dark:text-slate-300">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-extrabold tracking-tight">Upcoming Classes</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Join live sessions (video + chat) with your teacher.</p>

          <div className="mt-4 space-y-3">
            {classes.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No scheduled classes yet.</p>
            ) : (
              classes.slice(0, 4).map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-200/70 bg-white/60 p-4 transition hover:border-brand-200 hover:bg-brand-50/40 dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-brand-800/60 dark:hover:bg-brand-950/30">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900 dark:text-slate-100">{c.title}</p>
                    {c.isLive ? (
                      <Badge className="bg-red-100 text-red-800 ring-red-200 dark:bg-red-900/40 dark:text-red-100 dark:ring-red-700/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="muted">Scheduled</Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatDate(c.scheduledAt)}</p>
                  <p className="mt-2 text-sm text-slate-700 line-clamp-2 dark:text-slate-300">{c.description}</p>
                  <Link href={`/classes/${c.id}`} className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800 dark:text-brand-300">
                    Open classroom →
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="relative">
        <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-brand-50 via-white to-accent-50 dark:from-brand-950/40 dark:via-slate-950 dark:to-accent-950/30" />
        <div className="mx-auto max-w-6xl px-4 py-12">
          <Card className="relative overflow-hidden p-7">
            <div aria-hidden className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-accent-200/40 blur-2xl dark:bg-accent-700/10" />
            <div aria-hidden className="absolute -bottom-12 -left-12 h-44 w-44 rounded-full bg-brand-200/40 blur-2xl dark:bg-brand-700/10" />
            <div className="relative">
              <h3 className="text-xl font-extrabold tracking-tight">Personal Habit Tracker</h3>
              <p className="mt-2 max-w-2xl text-sm text-slate-700 dark:text-slate-300">
                Track daily goals like Salah, Qur&apos;an reading, and good deeds. Sign in to sync your progress across devices.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/reminders"><Button>Open Reminders</Button></Link>
                <Link href="/auth/register"><Button variant="accent">Create student account</Button></Link>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
