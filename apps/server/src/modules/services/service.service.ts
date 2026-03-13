import { status } from "elysia";
import { Errors } from "../../shared/constants/errors";
import { normalizeWhitespace, toNullableString, toOptionalString } from "../../shared/lib/normalization";
import { ServiceRepository } from "./service.repository";
import type { ServiceModel } from "./service.model";

export abstract class ServiceService {
  static async create(
    userId: string,
    data: ServiceModel.createBody,
  ): Promise<ServiceModel.serviceResponse> {
    return ServiceRepository.create(userId, {
      ...data,
      name: normalizeWhitespace(data.name),
      description: toOptionalString(data.description),
      emoji: data.emoji?.trim() || undefined,
    });
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<ServiceModel.serviceResponse> {
    const service = await ServiceRepository.findById(id, userId);

    if (!service) {
      throw status(
        Errors.SERVICE.NOT_FOUND.httpStatus,
        Errors.SERVICE.NOT_FOUND.message satisfies ServiceModel.errorNotFound,
      );
    }

    return service;
  }

  static async update(
    id: string,
    userId: string,
    data: ServiceModel.updateBody,
  ): Promise<ServiceModel.serviceResponse> {
    const service = await ServiceRepository.update(id, userId, {
      ...data,
      name: data.name !== undefined ? normalizeWhitespace(data.name) : undefined,
      description: toNullableString(data.description),
      emoji:
        data.emoji !== undefined
          ? data.emoji === null
            ? null
            : data.emoji.trim() || null
          : undefined,
    });

    if (!service) {
      throw status(
        Errors.SERVICE.NOT_FOUND.httpStatus,
        Errors.SERVICE.NOT_FOUND.message satisfies ServiceModel.errorNotFound,
      );
    }

    return service;
  }

  static async delete(id: string, userId: string): Promise<void> {
    const inUse = await ServiceRepository.hasAppointments(id);

    if (inUse) {
      throw status(
        Errors.SERVICE.IN_USE.httpStatus,
        Errors.SERVICE.IN_USE.message satisfies ServiceModel.errorInUse,
      );
    }

    const deleted = await ServiceRepository.delete(id, userId);

    if (!deleted) {
      throw status(
        Errors.SERVICE.NOT_FOUND.httpStatus,
        Errors.SERVICE.NOT_FOUND.message satisfies ServiceModel.errorNotFound,
      );
    }
  }

  static async list(
    userId: string,
    page: number,
    limit: number,
    search?: string,
    activeOnly?: boolean,
  ): Promise<ServiceModel.listResponse> {
    const normalizedSearch = search
      ? normalizeWhitespace(search)
      : undefined;

    return ServiceRepository.list(
      userId,
      page,
      limit,
      normalizedSearch || undefined,
      activeOnly,
    );
  }

  static async listAll(userId: string): Promise<ServiceModel.exportResponse> {
    return ServiceRepository.listAll(userId);
  }
}
