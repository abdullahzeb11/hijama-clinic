import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyOtp } from "@/lib/otp";
import { authConfig } from "./auth.config";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const emailOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{4,8}$/),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    /* Admin / staff: email + bcrypt password. */
    Credentials({
      id: "admin",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
            passwordHash: true,
          },
        });
        if (!user?.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;
        if (user.role !== "ADMIN" && user.role !== "STAFF") return null;

        return {
          id: user.id,
          name: user.name ?? user.email ?? "Admin",
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),

    /* Customers: email + OTP. */
    Credentials({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        code: { label: "Code", type: "text" },
      },
      async authorize(raw) {
        const parsed = emailOtpSchema.safeParse(raw);
        if (!parsed.success) return null;

        const res = await verifyOtp(parsed.data.email, parsed.data.code);
        if (!res.ok) return null;

        const user = await prisma.user.findUnique({
          where: { id: res.userId },
          select: { id: true, name: true, email: true, phone: true, image: true, role: true },
        });
        if (!user) return null;

        return {
          id: user.id,
          name: user.name ?? user.email ?? "Customer",
          email: user.email,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});
