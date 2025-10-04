import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { DefaultSession, NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { z } from 'zod';

// Extend NextAuth types
declare module 'next-auth' {
  interface User {
    id: string;
    role?: string;
    username?: string;
  }

  interface Session {
    user: {
      id: string;
      role?: string;
      username?: string;
    } & DefaultSession['user'];
  }
}

// Prisma client for serverless - use singleton pattern
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  // In production, create a new instance for each request
  prisma = new PrismaClient();
} else {
  // In development, use global singleton to prevent connection issues
  const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
  };
  prisma = globalForPrisma.prisma ?? new PrismaClient();
  globalForPrisma.prisma = prisma;
}

// Input validation schemas
const credentialsSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const authOptions: NextAuthOptions = {
  providers: [
    // Only add Google provider if environment variables are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          // Validate input
          const validatedCredentials = credentialsSchema.parse(credentials);

          const user = await prisma.user.findUnique({
            where: { email: validatedCredentials.email },
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              passwordHash: true,
            },
          });

          if (!user || !user.passwordHash) {
            console.log('User not found or no password hash');
            return null;
          }

          const isValidPassword = await bcrypt.compare(
            validatedCredentials.password,
            user.passwordHash
          );

          if (!isValidPassword) {
            console.log('Invalid password');
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.username,
            role: user.role,
          };
        } catch (error) {
          console.error('Authentication error:', error);
          // Don't expose database errors in production
          if (process.env.NODE_ENV === 'production') {
            return null;
          }
          throw error;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.username = token.name as string;
      }
      return session;
    },
    async signIn() {
      // Additional security checks can be added here
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development',
  debug: process.env.NODE_ENV === 'development',
  // Ensure proper URL handling for production
  ...(process.env.NEXTAUTH_URL && { url: process.env.NEXTAUTH_URL }),
};
