import type { AuthOptions } from 'next-auth';
import AzureADProvider from 'next-auth/providers/azure-ad';

// Read at runtime (not module load) to avoid Next.js build failures on Vercel
// when env vars are not available during the static analysis phase.
export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID ?? '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET ?? '',
      tenantId: process.env.AZURE_AD_TENANT_ID, // single-tenant: restricts to mews.com org
    }),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      // Defence-in-depth: verify @mews.com domain even though tenantId already restricts this
      if (account?.provider === 'azure-ad') {
        const email = (profile?.email as string | undefined) ?? '';
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
