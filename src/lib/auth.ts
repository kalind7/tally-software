import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { authConfig } from "@/lib/auth.config";
import { COMPANY_COOKIE } from "@/lib/company-cookie";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const { db } = await import("@/lib/db");
        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user) {
          return null;
        }

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );

        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyId: user.companyId,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.companyId = user.companyId ?? null;
      } else if (token.id) {
        const { db } = await import("@/lib/db");
        const dbUser = await db.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, companyId: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.companyId = dbUser.companyId;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) ?? "USER";
        session.user.companyId = token.companyId as string | null | undefined;
      }
      const companyCookie = (await cookies()).get(COMPANY_COOKIE)?.value;
      if (session.user && companyCookie) {
        session.user.companyId = companyCookie;
      }
      return session;
    },
  },
});
