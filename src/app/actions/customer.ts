"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { requestOtp as requestOtpLib } from "@/lib/otp";
import { SLOT_CAPACITY } from "@/lib/booking";

async function requireCustomer() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

/* ─── OTP request (no session required) ──────────────────────────────── */

const emailRequestSchema = z.object({ email: z.string().email().max(254) });

export async function requestOtp(input: z.infer<typeof emailRequestSchema>) {
  const parsed = emailRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid email" };
  const res = await requestOtpLib(parsed.data.email);
  // Surface dev-only code so the login UI can hint where to look.
  return res.devCode
    ? { ok: true as const, devCode: res.devCode }
    : { ok: true as const };
}

/* ─── Appointment actions ────────────────────────────────────────────── */

export async function cancelMyAppointment(appointmentId: string) {
  const user = await requireCustomer();

  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt || appt.userId !== user.id) {
    return { ok: false as const, error: "Not found" };
  }
  if (appt.status === "CANCELLED" || appt.status === "COMPLETED") {
    return { ok: false as const, error: "Cannot cancel" };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELLED", cancelReason: "Cancelled by customer" },
  });

  revalidatePath("/[locale]/account", "page");
  return { ok: true as const };
}

const rescheduleSchema = z.object({
  id: z.string().min(1),
  scheduledAt: z.string().refine((v) => !Number.isNaN(Date.parse(v))),
});

export async function rescheduleMyAppointment(input: z.infer<typeof rescheduleSchema>) {
  const user = await requireCustomer();
  const parsed = rescheduleSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  const appt = await prisma.appointment.findUnique({ where: { id: parsed.data.id } });
  if (!appt || appt.userId !== user.id) {
    return { ok: false as const, error: "Not found" };
  }
  if (appt.status === "CANCELLED" || appt.status === "COMPLETED") {
    return { ok: false as const, error: "Cannot reschedule" };
  }

  const newAt = new Date(parsed.data.scheduledAt);

  const conflict = await prisma.appointment.count({
    where: {
      id: { not: appt.id },
      scheduledAt: newAt,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });
  if (conflict >= SLOT_CAPACITY) {
    return { ok: false as const, error: "Slot is no longer available" };
  }

  await prisma.appointment.update({
    where: { id: appt.id },
    data: { scheduledAt: newAt, status: "PENDING" },
  });

  revalidatePath("/[locale]/account", "page");
  return { ok: true as const };
}

/* ─── Profile ────────────────────────────────────────────────────────── */

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional(),
});

export async function updateProfile(input: z.infer<typeof profileSchema>) {
  const user = await requireCustomer();
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid input" };

  await prisma.user.update({
    where: { id: user.id },
    data: {
      name: parsed.data.name ?? undefined,
      phone: parsed.data.phone ? parsed.data.phone : null,
      city: parsed.data.city ?? undefined,
    },
  });

  revalidatePath("/[locale]/account", "page");
  return { ok: true as const };
}

/**
 * One-shot helper used by the OTP login flow to seed the customer's name
 * the very first time they sign in. Subsequent calls are no-ops if the
 * user already has a name set.
 */
const seedNameSchema = z.object({ name: z.string().trim().min(2).max(80) });
export async function seedNameIfMissing(input: z.infer<typeof seedNameSchema>) {
  const user = await requireCustomer();
  const parsed = seedNameSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid name" };

  const current = await prisma.user.findUnique({
    where: { id: user.id },
    select: { name: true },
  });
  if (current?.name && current.name.trim().length >= 2) {
    return { ok: true as const, alreadySet: true as const };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
  });
  return { ok: true as const, alreadySet: false as const };
}
