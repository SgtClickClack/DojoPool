/* eslint-env node */
/* global process */
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

// Standard NextAuth configuration pattern that supports both GET and POST
export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  debug: process.env.NODE_ENV !== 'production',
};

export default NextAuth(authOptions);

// Ensure NextAuth can handle provider callbacks that POST urlencoded payloads
export const config = {
  api: {
    bodyParser: false,
  },
};
