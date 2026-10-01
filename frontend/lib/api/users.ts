import { apiClient } from './client';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export const getUsers = async (search?: string): Promise<User[]> => {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return apiClient<User[]>(`/users${query}`);
};
