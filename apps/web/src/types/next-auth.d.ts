import NextAuth from 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
    username?: string;
  }

  interface Session {
    user: {
      role?: string;
      username?: string;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;
    username?: string;
  }
}
