import React, { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import type { NextPage } from 'next';
import Layout from '../components/layout/Layout';

// Types based on Nest services/api friends and users controllers
interface FriendUser {
  id: string;
  username?: string;
  email?: string;
}

interface FriendshipRequest {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  createdAt?: string;
  updatedAt?: string;
}

// Utilities
const getCurrentUserId = (): string => {
  if (typeof window !== 'undefined') {
    const fromStorage = window.localStorage.getItem('x-user-id');
    if (fromStorage) return fromStorage;
  }
  // Dev fallback; in real app this should come from auth/session
  return 'demo-user-1';
};

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getCurrentUserId(),
      ...(init?.headers || {}),
    },
    ...init,
  });
  if (!res.ok) {
    let message = `Request failed: ${res.status}`;
    try {
      const data = (await res.json()) as any;
      if (data?.message) message = data.message;
      if (data?.error) message = data.error;
    } catch {}
    throw new Error(message);
  }
  try {
    return (await res.json()) as T;
  } catch {
    // Some endpoints may return 204
    return undefined as unknown as T;
  }
}

const FriendsPage: NextPage = () => {
  const [tab, setTab] = useState<'friends' | 'pending' | 'add'>('friends');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [pending, setPending] = useState<FriendshipRequest[]>([]);
  const [loading, setLoading] = useState({ friends: false, pending: false, action: false });
  const [error, setError] = useState<string | null>(null);

  const currentUserId = useMemo(() => getCurrentUserId(), []);

  const loadFriends = async () => {
    setLoading((s) => ({ ...s, friends: true }));
    setError(null);
    try {
      const data = await apiFetch<FriendUser[]>('/api/v1/friends');
      setFriends(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load friends');
    } finally {
      setLoading((s) => ({ ...s, friends: false }));
    }
  };

  const loadPending = async () => {
    setLoading((s) => ({ ...s, pending: true }));
    setError(null);
    try {
      const data = await apiFetch<FriendshipRequest[]>('/api/v1/friends/requests');
      setPending(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load pending requests');
    } finally {
      setLoading((s) => ({ ...s, pending: false }));
    }
  };

  useEffect(() => {
    loadFriends();
    loadPending();
  }, []);

  const acceptRequest = async (id: string) => {
    setLoading((s) => ({ ...s, action: true }));
    setError(null);
    try {
      await apiFetch(`/api/v1/friends/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'accept' }),
      });
      await Promise.all([loadPending(), loadFriends()]);
    } catch (e: any) {
      setError(e?.message || 'Failed to accept request');
    } finally {
      setLoading((s) => ({ ...s, action: false }));
    }
  };

  const declineRequest = async (id: string) => {
    setLoading((s) => ({ ...s, action: true }));
    setError(null);
    try {
      await apiFetch(`/api/v1/friends/requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'decline' }),
      });
      await loadPending();
    } catch (e: any) {
      setError(e?.message || 'Failed to decline request');
    } finally {
      setLoading((s) => ({ ...s, action: false }));
    }
  };

  // Add by username state
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [resultUser, setResultUser] = useState<FriendUser | null>(null);
  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const searchByUsername = async () => {
    setSearching(true);
    setSearchError(null);
    setResultUser(null);
    setSuccessMsg(null);
    try {
      // Basic approach: fetch users list and find by username (exact match)
      const users = await apiFetch<FriendUser[]>('/api/v1/users');
      const found = (users || []).find((u) => u.username?.toLowerCase() === query.trim().toLowerCase());
      if (!found) {
        setSearchError('User not found');
      } else if (found.id === currentUserId) {
        setSearchError('You cannot add yourself');
      } else {
        setResultUser(found);
      }
    } catch (e: any) {
      setSearchError(e?.message || 'Failed to search users');
    } finally {
      setSearching(false);
    }
  };

  const sendFriendRequest = async () => {
    if (!resultUser) return;
    setSending(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await apiFetch('/api/v1/friends/requests', {
        method: 'POST',
        body: JSON.stringify({ addresseeId: resultUser.id }),
      });
      setSuccessMsg(`Friend request sent to ${resultUser.username ?? resultUser.id}`);
      setResultUser(null);
      setQuery('');
      await loadPending();
    } catch (e: any) {
      setError(e?.message || 'Failed to send friend request');
    } finally {
      setSending(false);
    }
  };

  // UI helpers
  const TabButton = ({ id, label }: { id: 'friends' | 'pending' | 'add'; label: string }) => (
    <button
      onClick={() => setTab(id)}
      className={`py-3 px-4 border-b-2 text-sm font-medium transition-colors ${
        tab === id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  );

  return (
    <Layout>
      <Head>
        <title>Friends - DojoPool</title>
        <meta name="description" content="Manage friends and requests on DojoPool" />
      </Head>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-2xl font-bold text-gray-900">Friends</h1>
            <p className="text-sm text-gray-600 mt-1">Manage your social connections</p>
          </div>
        </div>

        <div className="bg-white border-b">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-6">
              <TabButton id="friends" label={`My Friends (${friends.length})`} />
              <TabButton id="pending" label={`Pending Requests (${pending.length})`} />
              <TabButton id="add" label="Add a Friend" />
            </nav>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {(error || searchError || successMsg) && (
            <div className="mb-4">
              {error && (
                <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>
              )}
              {searchError && (
                <div className="p-3 rounded border border-yellow-200 bg-yellow-50 text-yellow-800 text-sm mt-2">{searchError}</div>
              )}
              {successMsg && (
                <div className="p-3 rounded border border-green-200 bg-green-50 text-green-800 text-sm mt-2">{successMsg}</div>
              )}
            </div>
          )}

          {tab === 'friends' && (
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">My Friends</h2>
                <button
                  onClick={loadFriends}
                  className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={loading.friends}
                >
                  {loading.friends ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <ul className="divide-y">
                {friends.length === 0 && (
                  <li className="p-4 text-sm text-gray-600">No friends yet.</li>
                )}
                {friends.map((f) => (
                  <li key={f.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{f.username ?? f.id}</div>
                      {f.email && <div className="text-xs text-gray-500">{f.email}</div>}
                    </div>
                    {/* Placeholder for future actions like message/remove */}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'pending' && (
            <div className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Pending Requests</h2>
                <button
                  onClick={loadPending}
                  className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={loading.pending}
                >
                  {loading.pending ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <ul className="divide-y">
                {pending.length === 0 && (
                  <li className="p-4 text-sm text-gray-600">No pending requests.</li>
                )}
                {pending.map((r) => (
                  <li key={r.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-700">
                        Request from <span className="font-medium">{r.requesterId}</span>
                      </div>
                      <div className="text-xs text-gray-500">Status: {r.status}</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => acceptRequest(r.id)}
                        className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                        disabled={loading.action}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineRequest(r.id)}
                        className="px-3 py-1.5 text-sm rounded bg-gray-200 text-gray-800 hover:bg-gray-300 disabled:opacity-60"
                        disabled={loading.action}
                      >
                        Decline
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'add' && (
            <div className="bg-white rounded-lg border shadow-sm p-4">
              <h2 className="font-semibold text-gray-900 mb-3">Add a Friend</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Enter username"
                  className="flex-1 px-3 py-2 rounded border focus:outline-none focus:ring focus:ring-blue-200"
                />
                <button
                  onClick={searchByUsername}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                  disabled={searching || !query.trim()}
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {resultUser && (
                <div className="mt-4 p-3 border rounded bg-blue-50 border-blue-200 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-900">{resultUser.username ?? resultUser.id}</div>
                    {resultUser.email && (
                      <div className="text-xs text-blue-800">{resultUser.email}</div>
                    )}
                  </div>
                  <button
                    onClick={sendFriendRequest}
                    className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : 'Send Request'}
                  </button>
                </div>
              )}

              <p className="mt-3 text-xs text-gray-500">Tip: Set your user id in localStorage as 'x-user-id' to simulate different accounts during development. Current: {currentUserId}</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default FriendsPage;
