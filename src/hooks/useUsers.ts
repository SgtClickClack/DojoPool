import { useQuery } from '@tanstack/react-query';

// This should match the User type from your shared types package later
export interface User {
  id: string;
  email: string;
  username: string;
}

const fetchUsers = async (): Promise<User[]> => {
  // This URL should eventually come from an environment variable
  const response = await fetch('http://localhost:8080/v1/users');
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
}
