import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return user data from session
    const userData = {
      id: session.user.id,
      email: session.user.email,
      username: session.user.username || session.user.name,
      role: session.user.role || 'user',
    };

    return NextResponse.json(userData);
  } catch (error) {
    console.error('Get user error:', error);

    // Provide more specific error information in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
