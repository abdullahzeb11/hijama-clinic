/**
 * Single source of truth for non-translatable site data:
 * brand, contact, social, navigation, structured data.
 * All translatable strings live in /messages/*.json.
 */
export const siteConfig = {
  brand: {
    nameEn: "Al-Shifa Hijama Center",
    nameAr: "مركز الشفاء للحجامة",
    shortEn: "Al-Shifa",
    shortAr: "الشفاء",
    domain: "alshifa.sa",
  },
  url:
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://alshifa.sa",
  contact: {
    phoneDisplay: "+966 50 000 0000",
    phoneTel: "+966500000000",
    whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "966500000000",
    email: "hello@alshifa.sa",
    addressEn: "King Fahd Rd, Al-Olaya, Riyadh 12212, Saudi Arabia",
    addressAr: "طريق الملك فهد، حي العليا، الرياض ١٢٢١٢، المملكة العربية السعودية",
    geo: { lat: 24.7136, lng: 46.6753 },
    hours: {
      weekdays: { open: "09:00", close: "22:00" },
      friday: { open: "14:00", close: "22:00" },
    },
  },
  social: {
    instagram: "https://instagram.com/alshifa.sa",
    twitter: "https://twitter.com/alshifa_sa",
    tiktok: "https://tiktok.com/@alshifa.sa",
    snapchat: "https://snapchat.com/add/alshifa.sa",
    youtube: "https://youtube.com/@alshifa",
  },
  nav: [
    { key: "services", href: "#services" },
    { key: "benefits", href: "#benefits" },
    { key: "sunnah", href: "#sunnah" },
    { key: "gallery", href: "#gallery" },
    { key: "testimonials", href: "#testimonials" },
    { key: "blog", href: "/blog" },
    { key: "faq", href: "#faq" },
    { key: "contact", href: "#contact" },
  ] as const,
  stats: { rating: 4.9, reviewCount: 7200 },
} as const;

export type SiteConfig = typeof siteConfig;
