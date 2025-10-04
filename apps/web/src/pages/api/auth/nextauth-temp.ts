import NextAuth from 'next-auth';
import { authOptions } from '../../../../lib/auth';

// NextAuth API route for authentication
export default NextAuth(authOptions);
