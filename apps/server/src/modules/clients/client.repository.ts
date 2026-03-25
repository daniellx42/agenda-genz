import { Prisma } from "@agenda-genz/db";
import { prisma } from "../../shared/lib/db";
import { formatDateOnly } from "../../shared/lib/date-only";
import {
  buildPhoneSearchTerms,
  normalizeCpf,
  normalizeEmail,
  normalizeInstagram,
} from "../../shared/lib/normalization";
import type { ClientModel } from "./client.model";

const CLIENT_PAGE_LIMIT = 20;

const latestCompletedAppointmentSelect = {
  where: { status: "COMPLETED" },
  orderBy: [{ date: "desc" }, { createdAt: "desc" }],
  take: 1,
  select: {
    date: true,
  },
} satisfies Prisma.Client$appointmentsArgs;

const clientSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  instagram: true,
  cpf: true,
  address: true,
  birthDate: true,
  gender: true,
  notes: true,
  profileImageKey: true,
  appointments: latestCompletedAppointmentSelect,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ClientSelect;

const clientListSelect = {
  id: true,
  name: true,
  phone: true,
  email: true,
  instagram: true,
  notes: true,
  birthDate: true,
  profileImageKey: true,
  appointments: latestCompletedAppointmentSelect,
} satisfies Prisma.ClientSelect;

type ClientRecord = Prisma.ClientGetPayload<{ select: typeof clientSelect }>;
type ClientListRecord = Prisma.ClientGetPayload<{ select: typeof clientListSelect }>;
type ClientGender = "FEMALE" | "MALE" | "OTHER";

interface ClientCreateData {
  name: string;
  phone: string;
  email?: string;
  instagram?: string;
  cpf?: string;
  address?: string;
  birthDate?: Date;
  gender?: ClientGender;
  notes?: string;
  profileImageKey?: string;
}

interface ClientUpdateData {
  name?: string;
  phone?: string;
  email?: string | null;
  instagram?: string | null;
  cpf?: string | null;
  address?: string | null;
  birthDate?: Date | null;
  gender?: ClientGender | null;
  notes?: string | null;
  profileImageKey?: string | null;
}

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

function getLastCompletedAppointmentDate(
  appointments: Array<{ date: Date }>,
): string | null {
  const latestAppointment = appointments[0];
  return latestAppointment ? formatDateOnly(latestAppointment.date) : null;
}

function toClientResponse(client: ClientRecord): ClientModel.clientResponse {
  const { appointments, birthDate, ...rest } = client;

  return {
    ...rest,
    birthDate: birthDate ? formatDateOnly(birthDate) : null,
    instagram: normalizeInstagramValue(client.instagram),
    gender: normalizeGenderValue(client.gender),
    lastCompletedAppointmentDate: getLastCompletedAppointmentDate(appointments),
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}

function toClientListItem(client: ClientListRecord) {
  const { appointments, birthDate, ...rest } = client;

  return {
    ...rest,
    birthDate: birthDate ? formatDateOnly(birthDate) : null,
    instagram: normalizeInstagramValue(client.instagram),
    lastCompletedAppointmentDate: getLastCompletedAppointmentDate(appointments),
  };
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
    data: ClientCreateData,
  ): Promise<ClientModel.clientResponse> {
    const client = await prisma.client.create({
      data: { ...data, userId },
      select: clientSelect,
    });

    return toClientResponse(client);
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

    return toClientResponse(client);
  }

  static async update(
    id: string,
    userId: string,
    data: ClientUpdateData,
  ): Promise<ClientModel.clientResponse | null> {
    const existing = await prisma.client.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const client = await prisma.client.update({
      where: { id },
      data,
      select: clientSelect,
    });

    return toClientResponse(client);
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
        select: clientListSelect,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.client.count({ where }),
    ]);

    return {
      data: data.map(toClientListItem),
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
