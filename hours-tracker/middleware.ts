import NextAuth from "next-auth";
import authConfig from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Everything requires sign-in except the sign-in page, Auth.js routes, cron routes
  // (protected by CRON_SECRET instead), and static assets.
  matcher: ["/((?!signin|api/auth|api/cron|_next/static|_next/image|favicon.ico).*)"],
};
