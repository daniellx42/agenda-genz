import { prisma } from "../../shared/lib/db";
import {
  buildPhoneSearchTerms,
  normalizeCpf,
  normalizeEmail,
  normalizeInstagram,
} from "../../shared/lib/normalization";
import type { ClientModel } from "./client.model";

const CLIENT_PAGE_LIMIT = 20;

const clientSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  instagram: true,
  cpf: true,
  address: true,
  age: true,
  gender: true,
  notes: true,
  profileImageKey: true,
  createdAt: true,
  updatedAt: true,
} as const;

function normalizeInstagramValue(value: string | null): string | null {
  return value ? normalizeInstagram(value) : null;
}

function normalizeGenderValue(
  value: string | null,
): "FEMALE" | "MALE" | "OTHER" | null {
  return value === "FEMALE" || value === "MALE" || value === "OTHER"
    ? value
    : null;
}

export abstract class ClientRepository {
  private static buildSearchWhere(userId: string, search?: string) {
    const trimmedSearch = search?.trim();
    const phoneSearchTerms = trimmedSearch
      ? buildPhoneSearchTerms(trimmedSearch)
      : [];
    const cpfSearchTerm = trimmedSearch ? normalizeCpf(trimmedSearch) : "";
    const instagramSearchTerm = trimmedSearch ? normalizeInstagram(trimmedSearch) : "";
    const emailSearchTerm = trimmedSearch ? normalizeEmail(trimmedSearch) : "";

    if (!trimmedSearch) {
      return { userId };
    }

    return {
      userId,
      OR: [
        { name: { contains: trimmedSearch, mode: "insensitive" as const } },
        ...phoneSearchTerms.map((term) => ({
          phone: { contains: term, mode: "insensitive" as const },
        })),
        ...(cpfSearchTerm
          ? [{ cpf: { contains: cpfSearchTerm, mode: "insensitive" as const } }]
          : []),
        ...(instagramSearchTerm
          ? [
              {
                instagram: {
                  contains: instagramSearchTerm,
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),
        ...(emailSearchTerm
          ? [
              {
                email: {
                  contains: emailSearchTerm,
                  mode: "insensitive" as const,
                },
              },
            ]
          : []),
      ],
    };
  }

  static async create(
    userId: string,
    data: ClientModel.createBody,
  ): Promise<ClientModel.clientResponse> {
    const client = await prisma.client.create({
      data: { ...data, userId },
      select: clientSelect,
    });

    return {
      ...client,
      instagram: normalizeInstagramValue(client.instagram),
      gender: normalizeGenderValue(client.gender),
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  static async findById(
    id: string,
    userId: string,
  ): Promise<ClientModel.clientResponse | null> {
    const client = await prisma.client.findFirst({
      where: { id, userId },
      select: clientSelect,
    });

    if (!client) return null;

    return {
      ...client,
      instagram: normalizeInstagramValue(client.instagram),
      gender: normalizeGenderValue(client.gender),
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  static async update(
    id: string,
    userId: string,
    data: ClientModel.updateBody,
  ): Promise<ClientModel.clientResponse | null> {
    const existing = await prisma.client.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const client = await prisma.client.update({
      where: { id },
      data,
      select: clientSelect,
    });

    return {
      ...client,
      instagram: normalizeInstagramValue(client.instagram),
      gender: normalizeGenderValue(client.gender),
      createdAt: client.createdAt.toISOString(),
      updatedAt: client.updatedAt.toISOString(),
    };
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.client.findFirst({ where: { id, userId } });
    if (!existing) return false;

    await prisma.client.delete({ where: { id } });
    return true;
  }

  static async list(
    userId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<ClientModel.listResponse> {
    const where = ClientRepository.buildSearchWhere(userId, search);

    const [data, total] = await Promise.all([
      prisma.client.findMany({
        where,
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          instagram: true,
          profileImageKey: true,
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return {
      data: data.map((client) => ({
        ...client,
        instagram: normalizeInstagramValue(client.instagram),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async search(
    userId: string,
    term?: string,
  ): Promise<ClientModel.searchResponse> {
    const clients = await prisma.client.findMany({
      where: ClientRepository.buildSearchWhere(userId, term),
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        instagram: true,
        profileImageKey: true,
      },
      orderBy: { name: "asc" },
      take: 10,
    });

    return clients.map((client) => ({
      ...client,
      instagram: normalizeInstagramValue(client.instagram),
    }));
  }
}

export { CLIENT_PAGE_LIMIT };
