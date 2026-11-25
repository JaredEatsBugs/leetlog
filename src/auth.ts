import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { db } from "@/db";
import { accounts, users } from "@/db/schema";

// Auth.js is only used when AUTH_MODE=github; see src/server/current-user.ts for local mode.
// It reads AUTH_SECRET, AUTH_GITHUB_ID and AUTH_GITHUB_SECRET from the environment.

const adapter = DrizzleAdapter(db, { usersTable: users, accountsTable: accounts });

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: {
    ...adapter,
    // We only need to know which GitHub account a user owns, not to call the GitHub API,
    // so do not keep OAuth tokens in the database.
    linkAccount: (account) =>
      adapter.linkAccount!({
        ...account,
        access_token: undefined,
        refresh_token: undefined,
        id_token: undefined,
        expires_at: undefined,
      }),
  },
  providers: [GitHub],
  // JWT sessions: no sessions table and no DB lookup to validate a session.
  session: { strategy: "jwt" },
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
