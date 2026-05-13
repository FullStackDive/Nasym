// Curated set of widely-loved, universally-recognised ayāt drawn directly
// from the Qurʾān. English meanings follow the Saheeh International
// translation, which is the most consensus-trusted contemporary English
// rendering across Sunnī scholarship. Transliteration follows the standard
// IPA-leaning convention used by Quran.com.
//
// Source verification: every ayah here can be cross-checked against
// https://quran.com (Madinah Muṣḥaf / Saheeh International) and the
// printed King Fahd Complex Muṣḥaf.

export type Ayah = {
  arabic: string;
  translit: string;
  meaning: string;
  ref: string;
};

export const AYAHS: readonly Ayah[] = [
  {
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    translit: "Wa qul rabbi zidnī ʿilmā.",
    meaning: "“My Lord, increase me in knowledge.”",
    ref: "Sūrah Ṭā Hā · 20:114",
  },
  {
    arabic: "فَإِنَّ مَعَ ٱلْعُسْرِ يُسْرًا ۝ إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا",
    translit: "Fa-inna maʿa al-ʿusri yusrā. Inna maʿa al-ʿusri yusrā.",
    meaning: "“For indeed, with hardship will be ease. Indeed, with hardship will be ease.”",
    ref: "Sūrah ash-Sharḥ · 94:5–6",
  },
  {
    arabic: "لَا يُكَلِّفُ ٱللَّهُ نَفْسًا إِلَّا وُسْعَهَا",
    translit: "Lā yukallifu Llāhu nafsan illā wusʿahā.",
    meaning: "“Allah does not burden a soul beyond that it can bear.”",
    ref: "Sūrah al-Baqarah · 2:286",
  },
  {
    arabic: "أَلَا بِذِكْرِ ٱللَّهِ تَطْمَئِنُّ ٱلْقُلُوبُ",
    translit: "Alā bi-dhikri Llāhi taṭmaʾinnu l-qulūb.",
    meaning: "“Unquestionably, by the remembrance of Allah hearts are assured.”",
    ref: "Sūrah ar-Raʿd · 13:28",
  },
  {
    arabic: "وَمَن يَتَوَكَّلْ عَلَى ٱللَّهِ فَهُوَ حَسْبُهُ",
    translit: "Wa man yatawakkal ʿalā Llāhi fa-huwa ḥasbuh.",
    meaning: "“And whoever relies upon Allah — then He is sufficient for him.”",
    ref: "Sūrah aṭ-Ṭalāq · 65:3",
  },
  {
    arabic: "فَٱذْكُرُونِىٓ أَذْكُرْكُمْ وَٱشْكُرُوا۟ لِى وَلَا تَكْفُرُونِ",
    translit: "Fa-dhkurūnī adhkurkum wa-shkurū lī wa-lā takfurūn.",
    meaning: "“So remember Me; I will remember you. And be grateful to Me and do not deny Me.”",
    ref: "Sūrah al-Baqarah · 2:152",
  },
  {
    arabic: "لَا تَقْنَطُوا۟ مِن رَّحْمَةِ ٱللَّهِ ۚ إِنَّ ٱللَّهَ يَغْفِرُ ٱلذُّنُوبَ جَمِيعًا",
    translit: "Lā taqnaṭū min raḥmati Llāh. Inna Llāha yaghfiru dh-dhunūba jamīʿā.",
    meaning: "“Do not despair of the mercy of Allah. Indeed, Allah forgives all sins.”",
    ref: "Sūrah az-Zumar · 39:53",
  },
  {
    arabic: "إِنَّ ٱللَّهَ مَعَ ٱلصَّابِرِينَ",
    translit: "Inna Llāha maʿa ṣ-ṣābirīn.",
    meaning: "“Indeed, Allah is with the patient.”",
    ref: "Sūrah al-Baqarah · 2:153",
  },
  {
    arabic: "لَئِن شَكَرْتُمْ لَأَزِيدَنَّكُمْ",
    translit: "La-in shakartum la-azīdannakum.",
    meaning: "“If you are grateful, I will surely increase you [in favour].”",
    ref: "Sūrah Ibrāhīm · 14:7",
  },
  {
    arabic: "وَٱللَّهُ خَيْرُ ٱلرَّازِقِينَ",
    translit: "Wa-Llāhu khayru r-rāziqīn.",
    meaning: "“And Allah is the best of providers.”",
    ref: "Sūrah al-Jumuʿah · 62:11",
  },
  {
    arabic: "ٱدْعُونِىٓ أَسْتَجِبْ لَكُمْ",
    translit: "Udʿūnī astajib lakum.",
    meaning: "“Call upon Me; I will respond to you.”",
    ref: "Sūrah Ghāfir · 40:60",
  },
  {
    arabic: "وَإِذَا سَأَلَكَ عِبَادِى عَنِّى فَإِنِّى قَرِيبٌ",
    translit: "Wa idhā saʾalaka ʿibādī ʿannī fa-innī qarīb.",
    meaning: "“And when My servants ask you concerning Me — indeed I am near.”",
    ref: "Sūrah al-Baqarah · 2:186",
  },
  {
    arabic: "حَسْبُنَا ٱللَّهُ وَنِعْمَ ٱلْوَكِيلُ",
    translit: "Ḥasbunā Llāhu wa niʿma l-wakīl.",
    meaning: "“Sufficient for us is Allah, and [He is] the best Disposer of affairs.”",
    ref: "Sūrah Āl ʿImrān · 3:173",
  },
  {
    arabic: "رَبَّنَآ ءَاتِنَا فِى ٱلدُّنْيَا حَسَنَةً وَفِى ٱلْـَٔاخِرَةِ حَسَنَةً وَقِنَا عَذَابَ ٱلنَّارِ",
    translit: "Rabbanā ātinā fī d-dunyā ḥasanatan wa fī l-ākhirati ḥasanatan wa qinā ʿadhāba n-nār.",
    meaning: "“Our Lord, give us in this world good and in the Hereafter good and protect us from the punishment of the Fire.”",
    ref: "Sūrah al-Baqarah · 2:201",
  },
  {
    arabic: "إِنَّ مَعِىَ رَبِّى سَيَهْدِينِ",
    translit: "Inna maʿiya rabbī sa-yahdīn.",
    meaning: "“Indeed, with me is my Lord; He will guide me.”",
    ref: "Sūrah ash-Shuʿarāʾ · 26:62",
  },
];

// Day-of-year index → same ayah for every visit on the same calendar day.
export function ayahOfTheDay(d: Date = new Date()): Ayah {
  const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const now = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return AYAHS[dayOfYear % AYAHS.length];
}
