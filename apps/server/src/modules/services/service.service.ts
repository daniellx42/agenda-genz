import { status } from "elysia";
import { Errors } from "../../shared/constants/errors";
import { normalizeWhitespace, toNullableString, toOptionalString } from "../../shared/lib/normalization";
import { ServiceRepository } from "./service.repository";
import type { ServiceModel } from "./service.model";

export abstract class ServiceService {
  private static async deleteStoredObject(
    userId: string,
    key: string,
  ): Promise<void> {
    const { UploadService } = await import("../uploads/upload.service");
    await UploadService.deleteObject(userId, key);
  }

  static async create(
    userId: string,
    data: ServiceModel.createBody,
  ): Promise<ServiceModel.serviceResponse> {
    return ServiceRepository.create(userId, {
      ...data,
      name: normalizeWhitespace(data.name),
      description: toOptionalString(data.description),
      imageKey: data.imageKey.trim(),
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
    const existing = await ServiceRepository.findById(id, userId);

    if (!existing) {
      throw status(
        Errors.SERVICE.NOT_FOUND.httpStatus,
        Errors.SERVICE.NOT_FOUND.message satisfies ServiceModel.errorNotFound,
      );
    }

    const service = await ServiceRepository.update(id, userId, {
      ...data,
      name: data.name !== undefined ? normalizeWhitespace(data.name) : undefined,
      description: toNullableString(data.description),
      imageKey: data.imageKey !== undefined ? data.imageKey.trim() : undefined,
    });

    if (!service) {
      throw status(
        Errors.SERVICE.NOT_FOUND.httpStatus,
        Errors.SERVICE.NOT_FOUND.message satisfies ServiceModel.errorNotFound,
      );
    }

    if (existing.imageKey && existing.imageKey !== service.imageKey) {
      try {
        await ServiceService.deleteStoredObject(userId, existing.imageKey);
      } catch {
        // Arquivo órfão no R2 é aceitável.
      }
    }

    return service;
  }

  static async delete(id: string, userId: string): Promise<void> {
    const service = await ServiceRepository.findById(id, userId);

    if (!service) {
      throw status(
        Errors.SERVICE.NOT_FOUND.httpStatus,
        Errors.SERVICE.NOT_FOUND.message satisfies ServiceModel.errorNotFound,
      );
    }

    const inUse = await ServiceRepository.hasAppointments(id);

    if (inUse) {
      throw status(
        Errors.SERVICE.IN_USE.httpStatus,
        Errors.SERVICE.IN_USE.message satisfies ServiceModel.errorInUse,
      );
    }

    await ServiceRepository.delete(id, userId);

    if (service.imageKey) {
      try {
        await ServiceService.deleteStoredObject(userId, service.imageKey);
      } catch {
        // Arquivo órfão no R2 é aceitável.
      }
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
