import { PrismaClient } from "@prisma/client";
import { Venue, VenueStatus } from "../../types/venue";

const prisma = new PrismaClient();

export class VenueService {
  static async createVenue(
    name: string,
    address: string,
    city: string,
    state: string,
    zipCode: string,
    phone: string,
    email: string,
    ownerId: string,
    tableCount: number,
  ): Promise<Venue> {
    return prisma.venue.create({
      data: {
        name,
        address,
        city,
        state,
        zipCode,
        phone,
        email,
        ownerId,
        tableCount,
        status: VenueStatus.ACTIVE,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  static async getVenue(id: string): Promise<Venue | null> {
    return prisma.venue.findUnique({
      where: { id },
    });
  }

  static async updateVenue(id: string, data: Partial<Venue>): Promise<Venue> {
    return prisma.venue.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });
  }

  static async updateVenueStatus(
    id: string,
    status: VenueStatus,
  ): Promise<Venue> {
    return prisma.venue.update({
      where: { id },
      data: {
        status,
        updatedAt: new Date(),
      },
    });
  }

  static async getVenuesByOwner(ownerId: string): Promise<Venue[]> {
    return prisma.venue.findMany({
      where: { ownerId },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  static async getActiveVenues(): Promise<Venue[]> {
    return prisma.venue.findMany({
      where: {
        status: VenueStatus.ACTIVE,
      },
      orderBy: {
        name: "asc",
      },
    });
  }

  static async searchVenues(query: string): Promise<Venue[]> {
    return prisma.venue.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { address: { contains: query, mode: "insensitive" } },
          { city: { contains: query, mode: "insensitive" } },
          { state: { contains: query, mode: "insensitive" } },
        ],
        status: VenueStatus.ACTIVE,
      },
      orderBy: {
        name: "asc",
      },
    });
  }
}
