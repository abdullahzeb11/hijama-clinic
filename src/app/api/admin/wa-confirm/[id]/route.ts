import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { siteConfig } from "@/lib/site-config";
import { waLink } from "@/lib/utils";
import { buildWhatsAppConfirmMessage } from "@/lib/whatsapp-confirm-message";

export const dynamic = "force-dynamic";

/**
 * Generates a fresh wa.me redirect for an appointment's WhatsApp confirmation.
 *
 * Why a redirect instead of putting the wa.me URL directly in the admin email:
 * Gmail's mobile app re-encodes URL params when opening links from inside the
 * email view, which corrupts 4-byte UTF-8 emojis (🌿 📋 etc.) and they arrive
 * in WhatsApp as `?`. By emailing a short ASCII URL that we 302-redirect
 * server-side, the wa.me URL is constructed at click time with fresh, clean
 * encoding — bypassing Gmail's URL handler entirely.
 *
 * Auth: not required. The appointment ID is a 25-char cuid (unguessable),
 * and the data shown is the same as the public /book/confirmed/[id] page.
 * No destructive action — we just generate a wa.me deep link.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const appointment = await prisma.appointment.findUnique({
    where: { id },
    include: { service: true },
  });

  if (!appointment || !appointment.guestPhone) {
    return new NextResponse("Appointment not found", { status: 404 });
  }

  const message = buildWhatsAppConfirmMessage({
    locale: (appointment.locale === "en" ? "en" : "ar") as "ar" | "en",
    customerName: appointment.guestName ?? "",
    serviceNameEn: appointment.service.nameEn,
    serviceNameAr: appointment.service.nameAr,
    scheduledAt: appointment.scheduledAt,
    location: appointment.location,
    addressLine: appointment.addressLine,
    appointmentId: appointment.id,
    siteUrl: siteConfig.url,
  });

  const waUrl = waLink(appointment.guestPhone, message);
  return NextResponse.redirect(waUrl, 302);
}
