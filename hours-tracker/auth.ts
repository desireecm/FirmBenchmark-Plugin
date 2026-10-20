import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { canSignIn } from "@/lib/auth/access";
import { prisma } from "@/lib/db";

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name: string; isAdmin: boolean };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ user }) {
      const email = user.email?.toLowerCase() ?? null;
      const record = email ? await prisma.user.findUnique({ where: { email } }) : null;
      return canSignIn(email, process.env.ALLOWED_EMAIL_DOMAIN ?? "", record);
    },
    async jwt({ token, user }) {
      if (user?.email) {
        const record = await prisma.user.findUnique({ where: { email: user.email.toLowerCase() } });
        if (record) {
          token.uid = record.id;
          token.isAdmin = record.isAdmin;
          token.name = record.name;
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.isAdmin = token.isAdmin === true;
      return session;
    },
  },
});

/** Server-side admin check for API routes and server actions (never trust the UI alone). */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) throw new Error("Admin access required");
  return session;
}
