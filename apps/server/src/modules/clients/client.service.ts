import { status } from "elysia";
import { Errors } from "../../shared/constants/errors";
import {
  normalizeCpf,
  normalizeEmail,
  normalizeInstagram,
  normalizePhone,
  normalizeWhitespace,
  toNullableString,
  toOptionalString,
} from "../../shared/lib/normalization";
import { ClientRepository } from "./client.repository";
import type { ClientModel } from "./client.model";

export abstract class ClientService {
  private static async deleteStoredObject(
    userId: string,
    key: string,
  ): Promise<void> {
    const { UploadService } = await import("../uploads/upload.service");
    await UploadService.deleteObject(userId, key);
  }

  static async create(
    userId: string,
    data: ClientModel.createBody,
  ): Promise<ClientModel.clientResponse> {
    return ClientRepository.create(userId, {
      name: normalizeWhitespace(data.name),
      phone: normalizePhone(data.phone),
      email: data.email ? normalizeEmail(data.email) : undefined,
      instagram: data.instagram ? normalizeInstagram(data.instagram) : undefined,
      cpf: data.cpf ? normalizeCpf(data.cpf) : undefined,
      address: toOptionalString(data.address),
      age: data.age,
      gender: data.gender,
      notes: toOptionalString(data.notes),
      profileImageKey: data.profileImageKey,
    });
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<ClientModel.clientResponse> {
    const client = await ClientRepository.findById(id, userId);

    if (!client) {
      throw status(
        Errors.CLIENT.NOT_FOUND.httpStatus,
        Errors.CLIENT.NOT_FOUND.message satisfies ClientModel.errorNotFound,
      );
    }

    return client;
  }

  static async update(
    id: string,
    userId: string,
    data: ClientModel.updateBody,
  ): Promise<ClientModel.clientResponse> {
    const client = await ClientRepository.update(id, userId, {
      name: data.name !== undefined ? normalizeWhitespace(data.name) : undefined,
      phone: data.phone !== undefined ? normalizePhone(data.phone) : undefined,
      email:
        data.email !== undefined
          ? data.email === null
            ? null
            : normalizeEmail(data.email)
          : undefined,
      instagram:
        data.instagram !== undefined
          ? data.instagram === null
            ? null
            : normalizeInstagram(data.instagram)
          : undefined,
      cpf:
        data.cpf !== undefined
          ? data.cpf === null
            ? null
            : normalizeCpf(data.cpf)
          : undefined,
      address: toNullableString(data.address),
      age: data.age === undefined ? undefined : data.age,
      gender: data.gender === undefined ? undefined : data.gender,
      notes: toNullableString(data.notes),
      profileImageKey: data.profileImageKey,
    });

    if (!client) {
      throw status(
        Errors.CLIENT.NOT_FOUND.httpStatus,
        Errors.CLIENT.NOT_FOUND.message satisfies ClientModel.errorNotFound,
      );
    }

    return client;
  }

  static async deleteProfileImage(
    id: string,
    userId: string,
  ): Promise<ClientModel.clientResponse> {
    const client = await ClientRepository.findById(id, userId);

    if (!client) {
      throw status(
        Errors.CLIENT.NOT_FOUND.httpStatus,
        Errors.CLIENT.NOT_FOUND.message satisfies ClientModel.errorNotFound,
      );
    }

    if (!client.profileImageKey) {
      throw status(
        Errors.CLIENT.PROFILE_IMAGE_NOT_FOUND.httpStatus,
        Errors.CLIENT.PROFILE_IMAGE_NOT_FOUND.message satisfies ClientModel.errorProfileImageNotFound,
      );
    }

    // Limpa a referência no banco primeiro
    const updated = await ClientRepository.update(id, userId, { profileImageKey: null });

    if (!updated) {
      throw status(
        Errors.CLIENT.NOT_FOUND.httpStatus,
        Errors.CLIENT.NOT_FOUND.message satisfies ClientModel.errorNotFound,
      );
    }

    // Remove do R2 (best effort)
    try {
      await ClientService.deleteStoredObject(userId, client.profileImageKey);
    } catch {
      // Arquivo órfão no R2 é aceitável
    }

    return updated;
  }

  static async delete(id: string, userId: string): Promise<void> {
    const client = await ClientRepository.findById(id, userId);

    if (!client) {
      throw status(
        Errors.CLIENT.NOT_FOUND.httpStatus,
        Errors.CLIENT.NOT_FOUND.message satisfies ClientModel.errorNotFound,
      );
    }

    // Remove from R2: appointment work images (before/after) and client profile image
    // before DB cascade deletes appointments. (Dynamic import to avoid loading db/env in tests that don't call delete.)
    const { AppointmentRepository } = await import("../appointments/appointment.repository");
    const imageKeys = await AppointmentRepository.findImageKeysByClientId(id, userId);
    const keysToDelete: string[] = [
      ...imageKeys.flatMap((r) =>
        [r.beforeImageKey, r.afterImageKey].filter(
          (k): k is string => typeof k === "string" && k.length > 0,
        ),
      ),
      ...(client.profileImageKey ? [client.profileImageKey] : []),
    ];
    await Promise.allSettled(
      keysToDelete.map((key) => ClientService.deleteStoredObject(userId, key)),
    );

    await ClientRepository.delete(id, userId);
  }

  static async list(
    userId: string,
    page: number,
    limit: number,
    search?: string,
  ): Promise<ClientModel.listResponse> {
    return ClientRepository.list(userId, page, limit, search);
  }

  static async search(
    userId: string,
    term?: string,
  ): Promise<ClientModel.searchResponse> {
    return ClientRepository.search(userId, term);
  }
}
