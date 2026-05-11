export type Dua = {
  key: string;
  arabic: string;
  english: string;
  citation: string;
};

export const DUAS: Dua[] = [
  {
    key: "knowledge",
    arabic: "رَّبِّ زِدْنِي عِلْمًا",
    english: "My Lord, increase me in knowledge.",
    citation: "Sūrah Ṭāhā · 20:114",
  },
  {
    key: "guidance",
    arabic: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    english: "Guide us to the straight path.",
    citation: "Sūrah al-Fātiḥah · 1:6",
  },
  {
    key: "good-both-worlds",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    english: "Our Lord, give us good in this world and good in the Hereafter, and protect us from the punishment of the Fire.",
    citation: "Sūrah al-Baqarah · 2:201",
  },
  {
    key: "ease",
    arabic: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي",
    english: "My Lord, expand my chest and ease my task for me.",
    citation: "Sūrah Ṭāhā · 20:25–26",
  },
  {
    key: "forgiveness",
    arabic: "رَبَّنَا اغْفِرْ لَنَا ذُنُوبَنَا وَإِسْرَافَنَا فِي أَمْرِنَا",
    english: "Our Lord, forgive us our sins and our transgressions in our affairs.",
    citation: "Sūrah Āl ʿImrān · 3:147",
  },
  {
    key: "patience",
    arabic: "رَبَّنَا أَفْرِغْ عَلَيْنَا صَبْرًا وَثَبِّتْ أَقْدَامَنَا",
    english: "Our Lord, pour upon us patience and plant firmly our feet.",
    citation: "Sūrah al-Baqarah · 2:250",
  },
  {
    key: "righteous-family",
    arabic: "رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ",
    english: "Our Lord, grant us from among our spouses and offspring comfort to our eyes.",
    citation: "Sūrah al-Furqān · 25:74",
  },
  {
    key: "reliance",
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    english: "Allah is sufficient for us, and the best Disposer of affairs.",
    citation: "Sūrah Āl ʿImrān · 3:173",
  },
  {
    key: "protection",
    arabic: "اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنَ الْهَمِّ وَالْحَزَنِ",
    english: "O Allah, I seek refuge in You from anxiety and sorrow.",
    citation: "Hadith · Bukhārī",
  },
  {
    key: "good-end",
    arabic: "اللَّهُمَّ أَحْسِنْ عَاقِبَتَنَا فِي الْأُمُورِ كُلِّهَا",
    english: "O Allah, make our outcome good in all of our affairs.",
    citation: "Hadith · Aḥmad",
  },
  {
    key: "useful-knowledge",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ عِلْمًا نَافِعًا",
    english: "O Allah, I ask You for beneficial knowledge.",
    citation: "Hadith · Ibn Mājah",
  },
  {
    key: "remembrance",
    arabic: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ",
    english: "O Allah, help me to remember You, to thank You, and to worship You well.",
    citation: "Hadith · Abū Dāwūd",
  },
];

export const DEFAULT_DUA_KEY = "knowledge";

export function getDua(key: string | null | undefined): Dua {
  if (!key) return DUAS[0];
  return DUAS.find(d => d.key === key) ?? DUAS[0];
}
