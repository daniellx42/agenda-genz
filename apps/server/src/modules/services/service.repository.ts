import { prisma } from "../../shared/lib/db";
import type { ServiceModel } from "./service.model";

const serviceSelect = {
  id: true,
  name: true,
  description: true,
  price: true,
  depositPercentage: true,
  color: true,
  emoji: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} as const;

function toResponse(s: {
  id: string;
  name: string;
  description: string | null;
  price: number;
  depositPercentage: number | null;
  color: string | null;
  emoji: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ServiceModel.serviceResponse {
  return {
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export abstract class ServiceRepository {
  static async create(
    userId: string,
    data: ServiceModel.createBody,
  ): Promise<ServiceModel.serviceResponse> {
    const service = await prisma.service.create({
      data: { ...data, userId },
      select: serviceSelect,
    });
    return toResponse(service);
  }

  static async findById(
    id: string,
    userId: string,
  ): Promise<ServiceModel.serviceResponse | null> {
    const service = await prisma.service.findFirst({
      where: { id, userId },
      select: serviceSelect,
    });
    return service ? toResponse(service) : null;
  }

  static async update(
    id: string,
    userId: string,
    data: ServiceModel.updateBody,
  ): Promise<ServiceModel.serviceResponse | null> {
    const existing = await prisma.service.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const service = await prisma.service.update({
      where: { id },
      data,
      select: serviceSelect,
    });
    return toResponse(service);
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.service.findFirst({ where: { id, userId } });
    if (!existing) return false;

    await prisma.service.delete({ where: { id } });
    return true;
  }

  static async hasAppointments(id: string): Promise<boolean> {
    const count = await prisma.appointment.count({ where: { serviceId: id } });
    return count > 0;
  }

  static async list(
    userId: string,
    page: number,
    limit: number,
    search?: string,
    activeOnly?: boolean,
  ): Promise<ServiceModel.listResponse> {
    const where = {
      userId,
      ...(activeOnly ? { active: true } : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    const [data, total] = await Promise.all([
      prisma.service.findMany({
        where,
        select: serviceSelect,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.service.count({ where }),
    ]);

    return {
      data: data.map(toResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async listAll(userId: string): Promise<ServiceModel.exportResponse> {
    const services = await prisma.service.findMany({
      where: { userId, active: true },
      select: serviceSelect,
      orderBy: { name: "asc" },
    });

    return services.map(toResponse);
  }
}
