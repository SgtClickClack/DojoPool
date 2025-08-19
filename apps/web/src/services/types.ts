export interface DojoCandidate {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  status: 'active' | 'inactive' | 'maintenance';
  owner: string;
  createdAt: string;
  distance?: number;
  controllingClanId?: string;
  controllingClan?: string;
  homeDojo?: string;
}
