/**
 * Single source of truth for the WhatsApp confirmation message.
 * Used by:
 *   - /api/admin/wa-confirm/[id] (server-generated redirect to wa.me — bypasses
 *     Gmail's URL re-encoder which corrupts 4-byte UTF-8 emojis)
 *   - src/components/admin/appointment-card.tsx (in-browser wa.me link)
 */

export type WhatsAppConfirmArgs = {
  locale: "ar" | "en";
  customerName: string;
  serviceNameEn: string;
  serviceNameAr: string;
  scheduledAt: Date;
  location: "CLINIC" | "HOME_VISIT";
  addressLine: string | null;
  appointmentId: string;
  siteUrl: string;
};

const DIVIDER = "━━━━━━━━━━━━━━━";

export function buildWhatsAppConfirmMessage(args: WhatsAppConfirmArgs): string {
  const localeTag = args.locale === "ar" ? "ar-SA" : "en-SA";
  const date = new Intl.DateTimeFormat(localeTag, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(args.scheduledAt);
  const time = new Intl.DateTimeFormat(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Riyadh",
  }).format(args.scheduledAt);
  const ref = args.appointmentId.slice(-8).toUpperCase();
  const bookingUrl = `${args.siteUrl}/${args.locale}/book/confirmed/${args.appointmentId}`;

  const whereAr =
    args.location === "HOME_VISIT"
      ? "زيارة منزلية" + (args.addressLine ? ` — ${args.addressLine}` : "")
      : "في العيادة";
  const whereEn =
    args.location === "HOME_VISIT"
      ? "Home visit" + (args.addressLine ? ` — ${args.addressLine}` : "")
      : "At the clinic";

  if (args.locale === "ar") {
    return `🌿 *مركز رزان للحجامة*
${DIVIDER}

السلام عليكم *${args.customerName}*،

موعدك مؤكد ✅

📋 *الخدمة:* ${args.serviceNameAr}
📅 *التاريخ:* ${date}
🕐 *الوقت:* ${time}
📍 *المكان:* ${whereAr}
🎫 *المرجع:* ${ref}

${DIVIDER}

عرض الحجز:
${bookingUrl}

ردّوا على هذه الرسالة إذا احتجتم لإعادة الجدولة.
نراكم قريبًا إن شاء الله 🌿`;
  }

  return `🌿 *Razan Hijama Center*
${DIVIDER}

As-salamu alaykum *${args.customerName}*,

Your appointment is confirmed ✅

📋 *Service:* ${args.serviceNameEn}
📅 *Date:* ${date}
🕐 *Time:* ${time}
📍 *Where:* ${whereEn}
🎫 *Ref:* ${ref}

${DIVIDER}

View your booking:
${bookingUrl}

Reply to this message if you need to reschedule.
See you then 🌿`;
}
