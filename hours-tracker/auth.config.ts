import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Edge-safe config shared with middleware (no database access here).
// The issuer (AUTH_MICROSOFT_ENTRA_ID_ISSUER) pins sign-in to the company tenant.
export default {
  providers: [MicrosoftEntraID],
  pages: { signIn: "/signin", error: "/signin" },
  session: { strategy: "jwt" },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
