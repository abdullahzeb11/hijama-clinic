import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SERVICES = [
  {
    slug: "classic",
    nameEn: "Classic Hijama",
    nameAr: "الحجامة الكلاسيكية",
    shortEn: "Sunnah points · prevention focus",
    shortAr: "نقاط السنة · للوقاية",
    descriptionEn:
      "Wet cupping at the primary sunnah points (kahil & akhda'ayn). Ideal for prevention, headaches, and neck tension.",
    descriptionAr:
      "جلسة حجامة رطبة على نقاط السنة الأساسية (الكاهل والأخدعان)، مناسبة للوقاية وللصداع وآلام الرقبة.",
    priceSar: 280,
    durationMinutes: 45,
    icon: "Stethoscope",
    featured: false,
    homeVisit: false,
    sortOrder: 1,
  },
  {
    slug: "therapeutic",
    nameEn: "Therapeutic Hijama",
    nameAr: "الحجامة العلاجية",
    shortEn: "Targeted protocol · 10–14 points",
    shortAr: "بروتوكول مخصّص · ١٠–١٤ نقطة",
    descriptionEn:
      "A tailored protocol for back, shoulder, and sciatic pain — paired with adjunct massage and a personal point-map.",
    descriptionAr:
      "بروتوكول مخصّص لآلام الظهر والكتف وعرق النسا، مع تدليك مرافق وخريطة نقاط شخصية.",
    priceSar: 450,
    durationMinutes: 75,
    icon: "Sparkles",
    featured: true,
    homeVisit: false,
    sortOrder: 2,
  },
  {
    slug: "home",
    nameEn: "Home Visit",
    nameAr: "زيارة منزلية",
    shortEn: "We come to you · Riyadh",
    shortAr: "نأتي إليك · داخل الرياض",
    descriptionEn:
      "We come to you in Riyadh. The same protocol as the clinic, with the highest sterilization standards and total privacy.",
    descriptionAr:
      "نأتي إليك في الرياض. نفس بروتوكول العيادة بأعلى معايير التعقيم وفي خصوصية تامّة.",
    priceSar: 650,
    durationMinutes: 90,
    icon: "Home",
    featured: false,
    homeVisit: true,
    sortOrder: 3,
  },
];

const CATEGORIES = [
  { slug: "wellness",        nameEn: "Wellness",         nameAr: "الصحة العامة" },
  { slug: "sunnah",          nameEn: "Sunnah Tradition", nameAr: "من السنة" },
  { slug: "pain-management", nameEn: "Pain Management",  nameAr: "إدارة الألم" },
  { slug: "lifestyle",       nameEn: "Lifestyle",        nameAr: "نمط الحياة" },
  { slug: "patient-stories", nameEn: "Patient Stories",  nameAr: "قصص المرضى" },
];

const POSTS = [
  {
    slug: "three-sunnah-days-practitioner-note",
    locale: "en",
    categorySlug: "sunnah",
    title: "The three sunnah days — a practitioner's note",
    excerpt:
      "The 17th, 19th, and 21st of each Hijri month carry a quiet weight in our clinic schedule. Here's what we see, and why we still keep them.",
    coverImage: "https://picsum.photos/seed/hijama-sunnah/1600/900",
    readingMinutes: 4,
    body: `The Prophet ﷺ guided us toward specific days for hijama — the 17th, 19th, and 21st of every Hijri month. Twelve years into our practice, we still build the clinic schedule around them.

## What the tradition says

The narration is well known: hijama on these days carries a particular blessing. Generations of practitioners — from the early scholars to our own teachers — kept this rhythm without needing modern science to validate it.

## What we see in our chairs

We do not claim a study. We claim a pattern. Across **roughly 6,000 sessions** logged in our system, patients booked on these three days consistently report:

- Deeper sleep for the following 2–3 nights
- Faster relief from chronic neck and lower-back tension
- A calmer recovery — less of the second-day tenderness some patients describe

Is it the day? Is it the patient's *intention* on a sunnah day? Is it both? We don't pretend to know. But we book accordingly.

> "Indeed, the best of remedies you have is hijama." — Sahih al-Bukhari & Muslim

## How we schedule

We open **extra slots** on the 17th, 19th, and 21st. Mornings book fastest — the Maghrib slot tends to have late availability. If you want the sunnah days, book at the start of each Hijri month.

If you cannot make those dates, every day is fine. The therapy works. The tradition simply offers a recommended cadence — not a requirement.

## A small request

Come hydrated. Eat lightly two hours before. Wear something loose around the neck and shoulders. Bring questions — we'd rather spend an extra five minutes answering than leave you uncertain.

---

*See you in the chair.*
`,
  },
  {
    slug: "five-things-night-before-session",
    locale: "en",
    categorySlug: "wellness",
    title: "Five things to do the night before your session",
    excerpt:
      "Small, simple choices the evening before hijama make a real difference to how the session feels — and what you take away from it.",
    coverImage: "https://picsum.photos/seed/hijama-evening/1600/900",
    readingMinutes: 3,
    body: `A good hijama session starts the night before. None of these are rituals — they're small choices that consistently improve how patients feel during and after.

## 1. Eat earlier, eat lighter

Aim for a calm dinner around 7 PM. Avoid heavy meat, heavy oil, and large portions. A bowl of soup, grilled fish, or a simple salad is ideal.

## 2. Hydrate properly

Two extra glasses of water in the evening, one more first thing in the morning. Well-hydrated tissue responds better to cupping and recovers faster.

## 3. Skip caffeine after 4 PM

Caffeine raises baseline vascular tension. You'll feel the session more if your system is already wired.

## 4. Sleep, don't optimize

Don't *try* to sleep eight hours. Just stop scrolling early, dim the lights, and let your body settle. **Six calm hours beats eight restless ones**.

## 5. Choose your clothing

Wear something with:

- An open neckline or open back
- Loose fabric — not stretchy gym wear
- Layers, in case the clinic feels cool

> A relaxed body responds twice as well as a tense one. Spend the night helping it relax.

That's it. Five small choices. We'll handle the rest.
`,
  },
  {
    slug: "ma-yumayyiz-jalsat-al-hijama-al-ilajiya",
    locale: "ar",
    categorySlug: "pain-management",
    title: "ما الذي يميز جلسة الحجامة العلاجية؟",
    excerpt:
      "ليست كل جلسة حجامة متشابهة. الجلسة العلاجية تبدأ بتقييم سريري دقيق، وتُبنى حول خريطة نقاط شخصية لكل مريض.",
    coverImage: "https://picsum.photos/seed/hijama-therapy/1600/900",
    readingMinutes: 4,
    body: `الفرق بين الحجامة الكلاسيكية والحجامة العلاجية ليس في عدد الكؤوس، بل في **الخطّة** التي تُبنى حولها كل جلسة.

## نبدأ بالتقييم

نخصّص الخمس عشرة دقيقة الأولى لفهم حالتك:

- موقع الألم وشدّته
- مدّة الأعراض ونمطها (مستمر أم متقطع)
- المهنة والوضعيّة اليومية للجسم
- المحاولات السابقة وما نفع منها وما لم ينفع

من هذا التقييم نرسم خريطة نقاط شخصية — لا قالبًا جاهزًا.

## بروتوكول دقيق

نعتمد على **عشر إلى أربع عشرة نقطة** يتم اختيارها وفق:

- نقاط السنة الأساسية (الكاهل والأخدعان)
- نقاط الإسناد العضلي حسب موقع الألم
- نقاط إعادة الاتزان الجانبيّة

ولكل نقطة هدف واضح: تخفيف ألم، تحسين دورة دموية، أو موازنة العضلات حول مفصل متوتر.

## ما يأتي بعد الكؤوس

> الجلسة لا تنتهي عند رفع الكأس الأخير.

نعطيك:

- تدليك خفيف للمنطقة لمدة عشر دقائق
- توصيات حركيّة مكتوبة لخمسة أيام
- متابعة عبر واتساب بعد سبعة أيام

## لمن تناسب هذه الجلسة؟

- آلام أسفل الظهر المزمنة
- آلام الكتف والرقبة المرتبطة بالعمل المكتبي
- عرق النسا في مراحله المبكرة
- الصداع التوتري المتكرر

## ما الذي لا تَعِد به

نحن لا نَعِد بالشفاء التام من جلسة واحدة. نَعِد بـ:

1. تقييم صادق
2. بروتوكول مبني على حالتك أنت
3. متابعة حقيقية

هذا ما نعرفه — والباقي بإذن الله.
`,
  },
];

async function main() {
  for (const s of SERVICES) {
    await prisma.service.upsert({
      where: { slug: s.slug },
      create: s,
      update: s,
    });
    console.log(`✓ seeded service: ${s.slug}`);
  }

  for (const c of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    });
    console.log(`✓ seeded category: ${c.slug}`);
  }

  // Seed blog posts (only inserts if missing — won't overwrite your edits).
  for (const p of POSTS) {
    const category = await prisma.category.findUnique({
      where: { slug: p.categorySlug },
    });
    const existing = await prisma.post.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`· post already exists: ${p.slug} (skipping)`);
      continue;
    }
    await prisma.post.create({
      data: {
        slug: p.slug,
        locale: p.locale,
        status: "PUBLISHED",
        title: p.title,
        excerpt: p.excerpt,
        body: p.body,
        coverImage: p.coverImage,
        readingMinutes: p.readingMinutes,
        categoryId: category?.id ?? null,
        publishedAt: new Date(),
      },
    });
    console.log(`✓ seeded post: ${p.slug}`);
  }

  // Bootstrap admin from env. Skipped if ADMIN_EMAIL/ADMIN_PASSWORD aren't set.
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    // Cost factor 10 — fast enough on free-tier compute, still ~70ms to
    // verify which is the practical anti-brute-force floor for an admin tool.
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.upsert({
      where: { email },
      create: {
        email,
        passwordHash,
        role: "ADMIN",
        name: process.env.ADMIN_NAME ?? "Admin",
      },
      update: { passwordHash, role: "ADMIN" },
    });
    console.log(`✓ seeded admin: ${email}`);
  } else {
    console.log("⚠ ADMIN_EMAIL/ADMIN_PASSWORD not set — skipping admin seed");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
