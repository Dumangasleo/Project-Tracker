import { http } from '@/core/http/http-client';

export interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string | null;
  position: { id: number; title: string; department: string } | null;
  createdAt: string;
}

export interface AboutInfo {
  name: string;
  version: string;
  description: string;
}

export const settingsApi = {
  async profile(): Promise<Profile> {
    const { data } = await http.get<Profile>('/auth/me');
    return data;
  },

  async about(): Promise<AboutInfo> {
    const { data } = await http.get<AboutInfo>('/settings/about');
    return data;
  },
};
