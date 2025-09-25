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
};

export default NextAuth(authOptions);
