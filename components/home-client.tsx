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
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2 md:items-center">
          <div>
            <Badge className="mb-3">For Youth • Clear • Kind</Badge>
            <h1 className="text-3xl font-black leading-tight tracking-tight text-slate-900 md:text-5xl">
              Learn Islam. Join live classes. Build good habits.
            </h1>
            <p className="mt-4 max-w-xl text-slate-700">
              Nasym-ur-Rahmah is an Islamic learning space designed for young people — live classrooms, reminders, and a positive community.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/classes"><Button>Browse classes</Button></Link>
              <Link href="/lessons"><Button variant="secondary">Recorded lessons</Button></Link>
              <Link href="/quizzes"><Button variant="secondary">Quizzes</Button></Link>
              <Link href="/reminders"><Button variant="secondary">Daily reminders</Button></Link>
            </div>

            <Card className="mt-8 p-5">
              <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Ayah of the Day</p>
              <p className="mt-1 text-sm font-semibold text-brand-800">{ayah.ref}</p>
              <p className="mt-2 text-xl font-extrabold text-slate-900">{ayah.arabic}</p>
              <p className="mt-2 text-sm text-slate-600">{ayah.translit}</p>
              <p className="mt-3 text-sm text-slate-700">{ayah.meaning}</p>
            </Card>
          </div>

          <div className="relative">
            <div className="absolute -inset-2 rounded-3xl bg-brand-100 blur-2xl opacity-60" />
            <Card className="relative overflow-hidden">
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
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                  <div className="absolute bottom-0 p-5">
                    <p className="text-white/90 text-sm font-semibold">Featured</p>
                    <h2 className="mt-1 text-white text-2xl font-black">{posters[0].title}</h2>
                    {posters[0].ctaHref && (
                      <Link href={posters[0].ctaHref} className="mt-3 inline-block">
                        <Button>{posters[0].ctaText ?? "Open"}</Button>
                      </Link>
                    )}
                  </div>
                </div>
              ) : (
                <div className="aspect-[16/10] w-full bg-brand-50 p-8">
                  <p className="text-slate-700">No posters yet. Admins can add posters from the Admin panel.</p>
                </div>
              )}
            </Card>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {posters.slice(1, 5).map((p) => (
                <Card key={p.id} className="overflow-hidden">
                  <div className="relative aspect-[16/10] w-full">
                    <Image src={p.imageUrl} alt={p.title} fill className="object-cover" sizes="(max-width: 768px) 50vw, 25vw" />
                    <div className="absolute inset-0 bg-black/35" />
                    <div className="absolute bottom-0 p-3">
                      <p className="text-xs font-bold text-white line-clamp-2">{p.title}</p>
                    </div>
                  </div>
                </Card>
              ))}
              {posters.length <= 1 && (
                <Card className="col-span-2 p-4 text-sm text-slate-600">
                  Add more posters to create an attractive home slider.
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Hadith of the Day */}
      <section className="mx-auto max-w-6xl px-4 pb-2 pt-6">
        <Card className={cn("p-6 bg-brand-50 border-brand-200")}>
          <p className="text-xs font-semibold text-brand-700 uppercase tracking-wider">Hadith of the Day</p>
          <p className="mt-3 text-base font-semibold text-slate-800">&ldquo;{hadith.text}&rdquo;</p>
          <p className="mt-2 text-xs text-slate-500">{hadith.source}</p>
        </Card>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3">
        <Card className="p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold">News Board</h3>
            <Link href="/news" className="text-sm font-semibold">View all</Link>
          </div>
          <div className="mt-4 space-y-4">
            {news.length === 0 ? (
              <p className="text-sm text-slate-600">No news posts yet.</p>
            ) : (
              news.slice(0, 5).map((n) => (
                <div key={n.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    {n.pinned && <Badge>Pinned</Badge>}
                    <p className="text-sm font-extrabold text-slate-900">{n.title}</p>
                    <span className="text-xs text-slate-500">{new Date(n.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="mt-2 text-sm text-slate-700 line-clamp-3">{n.body}</p>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="text-lg font-extrabold">Upcoming Classes</h3>
          <p className="mt-1 text-sm text-slate-600">Join live sessions (video + chat) with your teacher.</p>

          <div className="mt-4 space-y-3">
            {classes.length === 0 ? (
              <p className="text-sm text-slate-600">No scheduled classes yet.</p>
            ) : (
              classes.slice(0, 4).map((c) => (
                <div key={c.id} className="rounded-2xl border border-slate-100 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{c.title}</p>
                    {c.isLive ? <Badge className="bg-red-100 text-red-800">Live</Badge> : <Badge>Scheduled</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(c.scheduledAt)}</p>
                  <p className="mt-2 text-sm text-slate-700 line-clamp-2">{c.description}</p>
                  <Link href={`/classes/${c.id}`} className="mt-3 inline-block text-sm font-semibold">
                    Open classroom →
                  </Link>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <section className="bg-brand-50">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Card className="p-6">
            <h3 className="text-lg font-extrabold">Personal Habit Tracker</h3>
            <p className="mt-2 text-sm text-slate-700">
              Track daily goals like Salah, Qur&apos;an reading, and good deeds. Sign in to sync your progress across devices.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/reminders"><Button>Open Reminders</Button></Link>
              <Link href="/auth/register"><Button variant="secondary">Create student account</Button></Link>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
