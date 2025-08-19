export interface Dojo {
  id: string;
  name: string;
}

const DojoService = {
  listNearby: async (): Promise<Dojo[]> => {
    return [];
  },
  getCandidates: async (
    lat: number,
    lng: number,
    radius: number
  ): Promise<any[]> => {
    return [];
  },
};

export default DojoService;
export { DojoService };
