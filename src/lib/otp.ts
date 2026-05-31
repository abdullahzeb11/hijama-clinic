import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { sendEmail, emailShell, escapeHtml } from "./email";
import { siteConfig } from "./site-config";

export const OTP_TTL_MIN = 5;
export const OTP_MAX_ATTEMPTS = 5;
export const RESEND_COOLDOWN_SEC = 30;

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Request a new OTP for `email`. Returns ok always (don't leak existence). */
export async function requestOtp(
  rawEmail: string,
): Promise<{ ok: true; devCode?: string }> {
  const email = normalizeEmail(rawEmail);
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MIN * 60_000);

  // Cooldown: refuse if a non-expired code was just issued.
  const existing = await prisma.oneTimeCode.findUnique({ where: { email } });
  if (
    existing &&
    existing.createdAt > new Date(Date.now() - RESEND_COOLDOWN_SEC * 1000)
  ) {
    return { ok: true };
  }

  await prisma.oneTimeCode.upsert({
    where: { email },
    create: { email, codeHash, expiresAt, attempts: 0 },
    update: { codeHash, expiresAt, attempts: 0, consumedAt: null },
  });

  await sendCodeEmail(email, code);

  // In dev, also surface the code via console + UI for easy testing.
  if (process.env.NODE_ENV !== "production") {
    console.log(`[otp] ${email} → ${code}`);
    return { ok: true, devCode: code };
  }
  return { ok: true };
}

async function sendCodeEmail(email: string, code: string) {
  const body = `
<div style="text-align:center; padding:24px 16px;">
  <p style="font-size:14px; color:#666; margin:0 0 8px;">Your sign-in code</p>
  <p style="font-family:ui-monospace, SFMono-Regular, Menlo, monospace; font-size:36px; font-weight:600; letter-spacing:8px; color:#0E6E5A; margin:0; padding:18px 24px; background:#fafaf7; border-radius:12px; display:inline-block;">${escapeHtml(code)}</p>
  <p style="font-size:13px; color:#666; margin:18px 0 0; line-height:1.55;">
    Enter this code in the sign-in page to access your account.<br>
    The code expires in ${OTP_TTL_MIN} minutes.
  </p>
</div>
<p style="font-size:11px; color:#999; margin:0; line-height:1.5; padding-top:12px; border-top:1px solid #eee; margin-top:18px;">
  If you didn't try to sign in at ${escapeHtml(siteConfig.brand.nameEn)}, you can safely ignore this email.
</p>`;

  await sendEmail({
    to: email,
    subject: `Your sign-in code: ${code}`,
    html: emailShell({
      eyebrow: "Sign in",
      title: "Your sign-in code is ready",
      bodyHtml: body,
    }),
  });
}

export type VerifyResult =
  | { ok: true; email: string; userId: string }
  | { ok: false; error: "invalid" | "expired" | "too_many_attempts" | "no_code" };

export async function verifyOtp(
  rawEmail: string,
  code: string,
): Promise<VerifyResult> {
  const email = normalizeEmail(rawEmail);

  const otp = await prisma.oneTimeCode.findUnique({ where: { email } });
  if (!otp || otp.consumedAt) return { ok: false, error: "no_code" };
  if (otp.expiresAt < new Date()) return { ok: false, error: "expired" };
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "too_many_attempts" };
  }

  const ok = await bcrypt.compare(code, otp.codeHash);
  if (!ok) {
    await prisma.oneTimeCode.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, error: "invalid" };
  }

  await prisma.oneTimeCode.update({
    where: { email },
    data: { consumedAt: new Date() },
  });

  // Find or create the user keyed by email. Link any prior guest
  // appointments made with the same email address.
  const user = await prisma.user.upsert({
    where: { email },
    create: { email, role: "CUSTOMER" },
    update: {},
  });

  await prisma.appointment.updateMany({
    where: { userId: null, guestEmail: email },
    data: { userId: user.id },
  });

  return { ok: true, email, userId: user.id };
}
