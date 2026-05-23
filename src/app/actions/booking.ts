"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  appointmentInputSchema,
  normalizePhone,
  SLOT_CAPACITY,
  type AppointmentInput,
} from "@/lib/booking";
import { sendTemplate } from "@/lib/whatsapp";
import { siteConfig } from "@/lib/site-config";
import { sendEmail, emailShell, escapeHtml } from "@/lib/email";
import { waLink } from "@/lib/utils";

type Result =
  | { ok: true; id: string }
  | { ok: false; error: string; field?: keyof AppointmentInput };

export async function createAppointment(raw: unknown): Promise<Result> {
  const parsed = appointmentInputSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue.message,
      field: issue.path[0] as keyof AppointmentInput,
    };
  }
  const input = parsed.data;

  const service = await prisma.service.findUnique({
    where: { id: input.serviceId },
  });
  if (!service || !service.active) {
    return { ok: false, error: "Service not available", field: "serviceId" };
  }

  const scheduledAt = new Date(input.scheduledAt);

  // Capacity check: any overlap at the same slot is rejected.
  const overlapping = await prisma.appointment.count({
    where: {
      scheduledAt,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (overlapping >= SLOT_CAPACITY) {
    return { ok: false, error: "Slot is no longer available", field: "scheduledAt" };
  }

  const phone = normalizePhone(input.guestPhone);

  // If the booker is signed in, link the appointment to their account.
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const appointment = await prisma.appointment.create({
    data: {
      userId,
      serviceId: service.id,
      scheduledAt,
      durationMin: service.durationMinutes,
      priceSar: service.priceSar,
      location: input.location,
      locale: input.locale,
      guestName: input.guestName,
      guestPhone: phone,
      guestEmail: input.guestEmail || null,
      addressLine: input.addressLine || null,
      city: input.city || null,
      notes: input.notes || null,
      status: "PENDING",
    },
  });

  const serviceName = input.locale === "ar" ? service.nameAr : service.nameEn;

  // Fire-and-forget notifications. WhatsApp send is a no-op without Meta
  // Cloud API credentials; the email notification fires on Resend setup.
  void notifyOnBooking({
    appointmentId: appointment.id,
    customerName: input.guestName,
    customerPhone: phone,
    customerEmail: input.guestEmail || null,
    serviceName,
    serviceNameEn: service.nameEn,
    scheduledAt,
    durationMin: service.durationMinutes,
    priceSar: service.priceSar,
    location: input.location,
    addressLine: input.addressLine || null,
    notes: input.notes || null,
    locale: input.locale,
  });

  return { ok: true, id: appointment.id };
}

async function notifyOnBooking(args: {
  appointmentId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  serviceName: string;
  serviceNameEn: string;
  scheduledAt: Date;
  durationMin: number;
  priceSar: number;
  location: "CLINIC" | "HOME_VISIT";
  addressLine: string | null;
  notes: string | null;
  locale: "ar" | "en";
}) {
  const enDate = new Intl.DateTimeFormat("en-SA", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Riyadh",
  }).format(args.scheduledAt);
  const enTime = new Intl.DateTimeFormat("en-SA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Riyadh",
  }).format(args.scheduledAt);
  const customerWhen = new Intl.DateTimeFormat(
    args.locale === "ar" ? "ar-SA" : "en-SA",
    { dateStyle: "full", timeStyle: "short", timeZone: "Asia/Riyadh" },
  ).format(args.scheduledAt);

  // 1. WhatsApp via Meta Cloud API — no-op without credentials.
  void sendTemplate({
    to: args.customerPhone,
    template: "appointment_confirmation",
    language: args.locale,
    components: [
      {
        type: "body",
        parameters: [
          { type: "text", text: args.customerName },
          { type: "text", text: args.serviceName },
          { type: "text", text: customerWhen },
        ],
      },
    ],
  });

  // 2. Admin email — fires whenever Resend is configured.
  const ref = args.appointmentId.slice(-8).toUpperCase();
  const adminPanelUrl = `${siteConfig.url}/admin/appointments`;
  const waReply = waLink(
    args.customerPhone,
    args.locale === "ar"
      ? `السلام عليكم ${args.customerName}، نؤكد حجزك في مركز الشفاء — ${args.serviceName} يوم ${customerWhen}. نراك قريبًا إن شاء الله.`
      : `As-salamu alaykum ${args.customerName}, this confirms your appointment at Al-Shifa Hijama Center — ${args.serviceNameEn} on ${enDate} at ${enTime}. See you then.`,
  );

  const body = `
<table style="width:100%; border-collapse:collapse; font-size:14px; margin-bottom:16px;">
  <tr><td style="padding:6px 0; color:#666; width:110px;">Customer</td><td style="padding:6px 0;"><strong>${escapeHtml(args.customerName)}</strong></td></tr>
  <tr><td style="padding:6px 0; color:#666;">Phone</td><td style="padding:6px 0;"><a href="tel:${escapeHtml(args.customerPhone)}" style="color:#0E6E5A; text-decoration:none;">${escapeHtml(args.customerPhone)}</a></td></tr>
  ${args.customerEmail ? `<tr><td style="padding:6px 0; color:#666;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(args.customerEmail)}" style="color:#0E6E5A; text-decoration:none;">${escapeHtml(args.customerEmail)}</a></td></tr>` : ""}
  <tr><td style="padding:6px 0; color:#666;">Service</td><td style="padding:6px 0;">${escapeHtml(args.serviceNameEn)} <span style="color:#999;">· ${args.durationMin} min · ${args.priceSar} SAR</span></td></tr>
  <tr><td style="padding:6px 0; color:#666;">When</td><td style="padding:6px 0;"><strong>${escapeHtml(enDate)} · ${escapeHtml(enTime)}</strong></td></tr>
  <tr><td style="padding:6px 0; color:#666;">Where</td><td style="padding:6px 0;">${args.location === "HOME_VISIT" ? `Home visit${args.addressLine ? ` — ${escapeHtml(args.addressLine)}` : ""}` : "At the clinic"}</td></tr>
  <tr><td style="padding:6px 0; color:#666;">Ref</td><td style="padding:6px 0; font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; color:#888;">${escapeHtml(ref)}</td></tr>
</table>
${args.notes ? `<div style="margin-top:8px; padding:12px 14px; border-radius:8px; background:#fafaf7; border-left:3px solid #C9A961; white-space:pre-wrap; font-size:14px;"><strong style="color:#666; font-size:12px;">Notes:</strong><br>${escapeHtml(args.notes)}</div>` : ""}
<div style="margin-top:20px; display:flex; gap:8px; flex-direction:column;">
  <a href="${waReply}" style="display:inline-block; padding:12px 18px; background:#25D366; color:#fff; text-decoration:none; font-weight:600; border-radius:8px; text-align:center;">Send WhatsApp confirmation</a>
  <a href="${adminPanelUrl}" style="display:inline-block; padding:12px 18px; background:#fff; color:#0E6E5A; text-decoration:none; font-weight:500; border:1px solid #0E6E5A; border-radius:8px; text-align:center;">Open in admin</a>
</div>`;

  void sendEmail({
    subject: `New booking — ${args.customerName} · ${enDate} ${enTime}`,
    html: emailShell({
      eyebrow: "New appointment",
      title: "A customer just booked",
      bodyHtml: body,
    }),
    replyTo: args.customerEmail || undefined,
  });
}
