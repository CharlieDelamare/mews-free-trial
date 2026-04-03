import type { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Only allow @mews.com Google accounts
      if (account?.provider === 'google') {
        const email = profile?.email ?? '';
        return email.endsWith('@mews.com');
      }
      return false;
    },
    async session({ session, token }) {
      // Forward email into session so server code can read it
      if (session.user && token.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};
