import React from 'react';
import { useUsers } from '@/hooks/useUsers';

export default function UsersPage() {
  const { data: users, error, isLoading } = useUsers();

  if (isLoading) {
    return <div>Loading users...</div>;
  }

  if (error instanceof Error) {
    return <div>An error occurred: {error.message}</div>;
  }

  return (
    <div>
      <h1>User List</h1>
      <ul>
        {users?.map((user) => (
          <li key={user.id}>
            {user.username} ({user.email})
          </li>
        ))}
      </ul>
    </div>
  );
}
