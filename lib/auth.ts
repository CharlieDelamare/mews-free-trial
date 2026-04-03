import type { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Validate required env vars at module load time for clear error messages
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const nextAuthSecret = process.env.NEXTAUTH_SECRET;

if (!googleClientId) throw new Error('GOOGLE_CLIENT_ID environment variable is required');
if (!googleClientSecret) throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
if (!nextAuthSecret) throw new Error('NEXTAUTH_SECRET environment variable is required');

export const authOptions: AuthOptions = {
  secret: nextAuthSecret,
  providers: [
    GoogleProvider({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          hd: 'mews.com', // Pre-filter to mews.com accounts on Google's consent screen
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Only allow @mews.com Google accounts — exact domain check, not endsWith
      if (account?.provider === 'google') {
        const email = profile?.email ?? '';
        return email.split('@')[1] === 'mews.com';
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
