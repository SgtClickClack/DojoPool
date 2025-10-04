import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function AuthDebug() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Not authenticated</p>
          <button 
            onClick={() => router.push('/auth/signin')}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Authentication Debug</h1>
        
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold mb-2">Session Status:</h2>
            <p className="text-green-600">✅ Authenticated</p>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">User Info:</h2>
            <div className="bg-gray-50 p-3 rounded">
              <p><strong>Name:</strong> {session.user?.name || 'N/A'}</p>
              <p><strong>Email:</strong> {session.user?.email || 'N/A'}</p>
              <p><strong>ID:</strong> {session.user?.id || 'N/A'}</p>
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-2">Session Data:</h2>
            <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={() => router.push('/')}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Go Home
            </button>
            <button 
              onClick={() => router.push('/api/users/me')}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Test API
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}