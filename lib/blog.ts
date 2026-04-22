export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  authorRole: string;
  imageUrl: string;
  featured?: boolean;
  content: {
    lead: string;
    sections: Array<{
      heading?: string;
      paragraphs?: string[];
      list?: string[];
      quote?: { text: string; author?: string };
    }>;
  };
}

export const BLOG_CATEGORIES = [
  "Barchasi",
  "Sog'lom hayot",
  "Vitaminlar",
  "Sport",
  "Bolalar salomatligi",
  "Ovqatlanish",
] as const;

export const BLOG_POSTS: BlogPost[] = [
  {
    id: 1,
    slug: "immunitetni-qishga-tayyorlash",
    title: "Immunitetni qishga qanday tayyorlash kerak?",
    excerpt:
      "Qish mavsumida kasalliklarga chalinmaslik va immunitetni yuqori darajada ushlash sirlari. Asosiy vitaminlar va kundalik odatlar.",
    category: "Sog'lom hayot",
    date: "14 Oktabr, 2023",
    readTime: "5 daqiqa",
    author: "Nuvita Expert",
    authorRole: "Sog'lomlashtirish mutaxassisi",
    imageUrl:
      "https://images.unsplash.com/photo-1505576399279-565b52d4ac71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    featured: true,
    content: {
      lead:
        "Qish mavsumida organizmimiz turli virus va bakteriyalarga nisbatan zaifroq bo'ladi. Oldindan tayyorgarlik ko'rish orqali kasalliklardan himoyalanish mumkin.",
      sections: [
        {
          heading: "Nega immunitet qishda pasayadi?",
          paragraphs: [
            "Qish kunlarining qisqarishi, quyosh nurining kamayishi va issiq xonada ko'p vaqt o'tkazish organizmga salbiy ta'sir qiladi. D vitamini yetishmovchiligi, suv iste'molining kamayishi va jismoniy faollikning susayishi ham immunitetga ta'sir qiladi.",
          ],
        },
        {
          heading: "Kundalik odatlar",
          list: [
            "Har kuni kamida 2 litr toza suv iste'mol qiling",
            "Ertalab 15 daqiqa jismoniy mashq bajaring",
            "Kechasi 7-8 soat sifatli uyqu",
            "Mavsumiy meva va sabzavotlarni ratsioningizga qo'shing",
            "Toza havoda kuniga 30 daqiqa yuring",
          ],
        },
        {
          heading: "Qo'shimcha vitaminlar",
          paragraphs: [
            "Vitamin C, D, sink va magniy — qishda eng ko'p talab qilinadigan elementlardir. Bular immun tizimini qo'llab-quvvatlaydi, yallig'lanishga qarshi ta'sir ko'rsatadi va organizmning umumiy tonusini oshiradi.",
          ],
          quote: {
            text:
              "Sog'ligingiz — boyligingiz. Unga bugundan sarmoya kiritishni boshlang!",
            author: "Nuvita jamoasi",
          },
        },
      ],
    },
  },
  {
    id: 2,
    slug: "vitamin-d-roli",
    title: "Vitamin D ning organizmdagi roli",
    excerpt:
      "Nima uchun quyosh nuri va D vitamini bizning organizmimiz uchun juda muhim? Uni yetishmovchiligini qanday aniqlash mumkin?",
    category: "Vitaminlar",
    date: "02 Noyabr, 2023",
    readTime: "4 daqiqa",
    author: "Shifokor Maslahati",
    authorRole: "Endokrinolog",
    imageUrl:
      "https://images.unsplash.com/photo-1559757175-5700dde675bc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    content: {
      lead:
        "D vitamini — suyak to'qimalari, immun tizimi va umumiy salomatlik uchun eng muhim elementlardan biri. Lekin aholining aksariyati uning yetishmovchiligidan azob chekadi.",
      sections: [
        {
          heading: "D vitamini nima uchun kerak?",
          paragraphs: [
            "D vitamini kalsiy va fosforning so'rilishini ta'minlaydi, suyak va tishlarni mustahkamlaydi. Shuningdek, u kayfiyatga, muskul funksiyasiga va immun tizimining normal ishlashiga ham ta'sir qiladi.",
          ],
        },
        {
          heading: "Yetishmovchilik belgilari",
          list: [
            "Surunkali charchoq va holsizlik",
            "Tez-tez sovuqlash",
            "Suyak va bo'g'imlarda og'riqlar",
            "Kayfiyatning tushishi, depressiya",
            "Soch to'kilishi va tirnoqlarning sinishi",
          ],
        },
        {
          heading: "Qayerdan olish mumkin?",
          paragraphs: [
            "Eng asosiy manba — quyosh nuri. Kuniga 15-20 daqiqa quyoshda yurish yetarli. Oziq-ovqatdan: yog'li baliq (losos, skumbriya), tuxum sarig'i, jigar. Qishda esa vitamin D qo'shimchalari tavsiya etiladi.",
          ],
        },
      ],
    },
  },
  {
    id: 3,
    slug: "sportchilar-uchun-qoshimchalar",
    title: "Sportchilar uchun qo'shimchalar qanday tanlanadi?",
    excerpt:
      "Faol hayot tarzi bilan shug'ullanadigan insonlar va sportchilar uchun eng kerakli oziq-ovqat qo'shimchalari ro'yxati.",
    category: "Sport",
    date: "15 Dekabr, 2023",
    readTime: "6 daqiqa",
    author: "Sport Murabbiyi",
    authorRole: "Sport ovqatlanishi mutaxassisi",
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    content: {
      lead:
        "Intensiv mashg'ulotlar paytida organizm tezroq tiklanishi va muskul massasi oshishi uchun qo'shimcha oziqlarga muhtoj bo'ladi.",
      sections: [
        {
          heading: "Eng muhim 5 ta qo'shimcha",
          list: [
            "Oqsil (protein) — muskul tiklanishi uchun",
            "Omega-3 — bo'g'imlar va yurak salomatligi",
            "Kreatin — kuchni oshirish",
            "Magniy — qisqarish va asab tizimi uchun",
            "Vitamin kompleks — umumiy energiya",
          ],
        },
        {
          heading: "Qachon qabul qilish kerak?",
          paragraphs: [
            "Oqsil mashg'ulotdan keyin 30 daqiqa ichida eng samarali. Kreatin esa muntazam — har kuni 3-5 g. Omega-3 ovqat bilan birga qabul qilinsa yaxshi so'riladi.",
          ],
        },
      ],
    },
  },
  {
    id: 4,
    slug: "bolalar-uchun-vitaminlar",
    title: "Bolalar uchun vitaminlar qancha yoshdan kerak?",
    excerpt:
      "Sog'lom va baquvvat ulg'ayishlari uchun bolalarga vitamin komplekslarini to'g'ri berish tartibi.",
    category: "Bolalar salomatligi",
    date: "05 Yanvar, 2024",
    readTime: "3 daqiqa",
    author: "Pediatr",
    authorRole: "Bolalar shifokori",
    imageUrl:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    content: {
      lead:
        "Bola ulg'ayishi davomida organizm jadal rivojlanadi. To'g'ri tanlangan vitaminlar uning sog'lom o'sishiga yordam beradi.",
      sections: [
        {
          heading: "Yosh bo'yicha ehtiyoj",
          list: [
            "1 yoshgacha — faqat shifokor tavsiyasi bilan",
            "1-3 yosh — D vitamini va kalsiy",
            "3-6 yosh — multivitamin kompleksi",
            "7-12 yosh — maktab yoshi uchun maxsus komplekslar",
          ],
        },
        {
          heading: "Qabul qilish qoidalari",
          paragraphs: [
            "Har qanday qo'shimchani berishdan oldin pediatr bilan maslahatlashing. Ortiqcha doza — yetishmovchilikdan ko'ra xavfliroq. Vitaminlarni ovqat bilan birga berish eng yaxshi yo'l.",
          ],
        },
      ],
    },
  },
  {
    id: 5,
    slug: "omega-3-foydasi",
    title: "Omega-3 — miyaning eng yaxshi do'sti",
    excerpt:
      "Omega-3 yog' kislotalari yurak, miya va terini qanday himoya qilishi haqida batafsil.",
    category: "Vitaminlar",
    date: "20 Fevral, 2024",
    readTime: "5 daqiqa",
    author: "Dietolog",
    authorRole: "Klinik ovqatlanish mutaxassisi",
    imageUrl:
      "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    content: {
      lead:
        "Omega-3 kislotalari organizmda ishlab chiqarilmaydi, shuning uchun ular ovqat yoki qo'shimchalar orqali olinishi kerak.",
      sections: [
        {
          heading: "Asosiy foydalari",
          list: [
            "Yurak-qon tomir salomatligi",
            "Miya va xotira faolligini oshiradi",
            "Yallig'lanishga qarshi ta'sir",
            "Ko'z salomatligi (quruq ko'z sindromiga qarshi)",
            "Teri va sochlar uchun foydali",
          ],
        },
        {
          heading: "Qayerda ko'p?",
          paragraphs: [
            "Yog'li baliqlar (losos, sardina, skumbriya), chia urug'lari, yong'oq va zig'ir urug'lari eng boy manbalar. Agar baliq yeyish imkoni kam bo'lsa, Omega-3 kapsulalari yaxshi alternativa.",
          ],
        },
      ],
    },
  },
  {
    id: 6,
    slug: "togri-ovqatlanish-asoslari",
    title: "To'g'ri ovqatlanishning 7 oltin qoidasi",
    excerpt:
      "Sog'lom ovqatlanishga boshlash oson emas, lekin mumkin. Ushbu qoidalar kundalik hayotingizni o'zgartiradi.",
    category: "Ovqatlanish",
    date: "10 Mart, 2024",
    readTime: "4 daqiqa",
    author: "Nuvita Expert",
    authorRole: "Sog'lom ovqatlanish bo'yicha maslahatchi",
    imageUrl:
      "https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80",
    content: {
      lead:
        "To'g'ri ovqatlanish — bu dieta emas, balki hayot tarzi. Oddiy qoidalarga amal qilib siz umrbod salomatlikni saqlab qolasiz.",
      sections: [
        {
          heading: "7 ta oltin qoida",
          list: [
            "Ertalabki ovqatni hech qachon tashlab yubormang",
            "Kunlik ratsionda 5 xil rangdagi sabzavot bo'lsin",
            "Qayta ishlangan shakar va un iste'molini kamaytiring",
            "Kuniga 2 litr toza suv iching",
            "Ovqatni sekin, yaxshilab chaynab yeng",
            "Kichik porsiyalarda ovqatlaning",
            "Soat 20:00 dan keyin og'ir ovqat yemang",
          ],
        },
        {
          heading: "Nimadan boshlash kerak?",
          paragraphs: [
            "Bir vaqtning o'zida hamma narsani o'zgartirishga urinmang. Har hafta bir yangi odatni qo'shing. 2-3 oydan keyin natija sezilarli bo'ladi.",
          ],
        },
      ],
    },
  },
];

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRelatedPosts(slug: string, limit = 3): BlogPost[] {
  const current = getBlogPostBySlug(slug);
  if (!current) return [];
  return BLOG_POSTS.filter(
    (p) => p.slug !== slug && p.category === current.category,
  )
    .concat(BLOG_POSTS.filter((p) => p.slug !== slug && p.category !== current.category))
    .slice(0, limit);
}
