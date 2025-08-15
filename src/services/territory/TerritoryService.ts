// TerritoryService.ts

export interface Territory {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number }[];
  owner: string | null;
  clan: string | null;
  requiredNFT: string;
}

export const getTerritories = async (): Promise<Territory[]> => {
  const res = await fetch('/api/territories');
  if (!res.ok) throw new Error('Failed to fetch territories');
  return res.json();
};

export const getUserNFTs = async (userId: string): Promise<string[]> => {
  const res = await fetch(`/api/user-nfts/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch user NFTs');
  return res.json();
}; 
