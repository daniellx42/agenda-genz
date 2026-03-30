import { status } from "elysia";
import { Errors } from "../../shared/constants/errors";
import { parseDateOnly } from "../../shared/lib/date-only";
import { ClientRepository } from "../clients/client.repository";
import { TimeSlotRepository } from "../time-slots/time-slot.repository";
import { AppointmentRepository } from "./appointment.repository";
import type { AppointmentModel } from "./appointment.model";

export abstract class AppointmentService {
  private static filterShareableSlots(
    data: AppointmentModel.shareSlotsResponse,
  ): AppointmentModel.shareSlotsResponse {
    return data
      .map((day) => ({
        ...day,
        slots: day.slots.filter((slot) => slot.available),
      }))
      .filter((day) => day.slots.length > 0);
  }

  private static async deleteStoredObject(
    userId: string,
    key: string,
  ): Promise<void> {
    const { UploadService } = await import("../uploads/upload.service");
    await UploadService.deleteObject(userId, key);
  }

  static async create(
    userId: string,
    data: AppointmentModel.createBody,
  ): Promise<AppointmentModel.appointmentResponse> {
    const date = parseDateOnly(data.date);

    if (!date) {
      throw status(
        Errors.APPOINTMENT.INVALID_DATE.httpStatus,
        Errors.APPOINTMENT.INVALID_DATE
          .message satisfies AppointmentModel.errorInvalidDate,
      );
    }

    const timeSlot = await TimeSlotRepository.findById(data.timeSlotId, userId);

    if (!timeSlot || !timeSlot.active || timeSlot.dayOfWeek !== date.getUTCDay()) {
      throw status(
        Errors.APPOINTMENT.SLOT_UNAVAILABLE.httpStatus,
        Errors.APPOINTMENT.SLOT_UNAVAILABLE
          .message satisfies AppointmentModel.errorSlotUnavailable,
      );
    }

    const slotTaken = await AppointmentRepository.isSlotTaken(
      data.timeSlotId,
      date,
    );

    const slotBlocked = await TimeSlotRepository.hasExceptionOnDate(
      userId,
      data.timeSlotId,
      date,
    );

    if (slotTaken || slotBlocked) {
      throw status(
        Errors.APPOINTMENT.SLOT_UNAVAILABLE.httpStatus,
        Errors.APPOINTMENT.SLOT_UNAVAILABLE
          .message satisfies AppointmentModel.errorSlotUnavailable,
      );
    }

    return AppointmentRepository.create(userId, {
      clientId: data.clientId,
      serviceId: data.serviceId,
      timeSlotId: data.timeSlotId,
      date,
      notes: data.notes,
    });
  }

  static async getById(
    id: string,
    userId: string,
  ): Promise<AppointmentModel.appointmentResponse> {
    const appointment = await AppointmentRepository.findById(id, userId);

    if (!appointment) {
      throw status(
        Errors.APPOINTMENT.NOT_FOUND.httpStatus,
        Errors.APPOINTMENT.NOT_FOUND
          .message satisfies AppointmentModel.errorNotFound,
      );
    }

    return appointment;
  }

  static async listByDate(
    userId: string,
    dateStr: string,
  ): Promise<AppointmentModel.listResponse> {
    const date = parseDateOnly(dateStr);

    if (!date) {
      throw status(
        Errors.APPOINTMENT.INVALID_DATE.httpStatus,
        Errors.APPOINTMENT.INVALID_DATE
          .message satisfies AppointmentModel.errorInvalidDate,
      );
    }

    return AppointmentRepository.findByDate(userId, date);
  }

  static async listByClient(
    userId: string,
    clientId: string,
    page: number,
    limit: number,
  ): Promise<AppointmentModel.clientHistoryResponse> {
    const client = await ClientRepository.findById(clientId, userId);

    if (!client) {
      throw status(
        Errors.CLIENT.NOT_FOUND.httpStatus,
        Errors.CLIENT.NOT_FOUND.message satisfies AppointmentModel.errorClientNotFound,
      );
    }

    return AppointmentRepository.findHistoryByClient(userId, clientId, page, limit);
  }

  static async getCalendarDots(
    userId: string,
    year: number,
    month: number,
  ): Promise<AppointmentModel.calendarResponse> {
    return AppointmentRepository.getCalendarDots(userId, year, month);
  }

  static async updateStatus(
    id: string,
    userId: string,
    data: AppointmentModel.updateStatusBody,
  ): Promise<AppointmentModel.appointmentResponse> {
    const appointment = await AppointmentRepository.updateStatus(
      id,
      userId,
      data.status,
    );

    if (!appointment) {
      throw status(
        Errors.APPOINTMENT.NOT_FOUND.httpStatus,
        Errors.APPOINTMENT.NOT_FOUND
          .message satisfies AppointmentModel.errorNotFound,
      );
    }

    return appointment;
  }

  static async updatePayment(
    id: string,
    userId: string,
    data: AppointmentModel.updatePaymentBody,
  ): Promise<AppointmentModel.appointmentResponse> {
    const appointment = await AppointmentRepository.updatePayment(
      id,
      userId,
      data.paymentStatus,
    );

    if (!appointment) {
      throw status(
        Errors.APPOINTMENT.NOT_FOUND.httpStatus,
        Errors.APPOINTMENT.NOT_FOUND
          .message satisfies AppointmentModel.errorNotFound,
      );
    }

    return appointment;
  }

  static async updateImages(
    id: string,
    userId: string,
    data: AppointmentModel.updateImagesBody,
  ): Promise<AppointmentModel.appointmentResponse> {
    const appointment = await AppointmentRepository.updateImages(id, userId, {
      beforeImageKey: data.beforeImageKey,
      afterImageKey: data.afterImageKey,
    });

    if (!appointment) {
      throw status(
        Errors.APPOINTMENT.NOT_FOUND.httpStatus,
        Errors.APPOINTMENT.NOT_FOUND
          .message satisfies AppointmentModel.errorNotFound,
      );
    }

    return appointment;
  }

  static async deleteImage(
    id: string,
    userId: string,
    slot: "before" | "after",
  ): Promise<AppointmentModel.appointmentResponse> {
    const appointment = await AppointmentRepository.findById(id, userId);

    if (!appointment) {
      throw status(
        Errors.APPOINTMENT.NOT_FOUND.httpStatus,
        Errors.APPOINTMENT.NOT_FOUND.message satisfies AppointmentModel.errorNotFound,
      );
    }

    const key = slot === "before" ? appointment.beforeImageKey : appointment.afterImageKey;

    if (!key) {
      throw status(
        Errors.APPOINTMENT.IMAGE_NOT_FOUND.httpStatus,
        Errors.APPOINTMENT.IMAGE_NOT_FOUND.message satisfies AppointmentModel.errorImageNotFound,
      );
    }

    // Limpa a referência no banco primeiro
    const updateData = slot === "before"
      ? { beforeImageKey: null }
      : { afterImageKey: null };

    const updated = await AppointmentRepository.updateImages(id, userId, updateData);

    if (!updated) {
      throw status(
        Errors.APPOINTMENT.NOT_FOUND.httpStatus,
        Errors.APPOINTMENT.NOT_FOUND.message satisfies AppointmentModel.errorNotFound,
      );
    }

    // Remove o arquivo do R2 (best effort — se falhar, o DB já está limpo)
    try {
      await AppointmentService.deleteStoredObject(userId, key);
    } catch {
      // Arquivo órfão no R2 é aceitável; não falha a operação
    }

    return updated;
  }

  static async deleteById(id: string, userId: string): Promise<void> {
    const appointment = await AppointmentRepository.findById(id, userId);

    if (!appointment) {
      throw status(
        Errors.APPOINTMENT.NOT_FOUND.httpStatus,
        Errors.APPOINTMENT.NOT_FOUND
          .message satisfies AppointmentModel.errorNotFound,
      );
    }

    const deleted = await AppointmentRepository.deleteById(id, userId);

    if (!deleted) {
      throw status(
        Errors.APPOINTMENT.NOT_FOUND.httpStatus,
        Errors.APPOINTMENT.NOT_FOUND
          .message satisfies AppointmentModel.errorNotFound,
      );
    }

    const imageKeys = [appointment.beforeImageKey, appointment.afterImageKey].filter(
      (key): key is string => Boolean(key),
    );

    // O banco já foi limpo; falha no storage não deve reverter a exclusão.
    await Promise.allSettled(
      imageKeys.map((key) => AppointmentService.deleteStoredObject(userId, key)),
    );
  }

  static async getAvailableSlotsByDateRange(
    userId: string,
    from: string,
    to: string,
  ): Promise<AppointmentModel.shareSlotsResponse> {
    const fromDate = parseDateOnly(from);
    const toDate = parseDateOnly(to);

    if (!fromDate || !toDate) {
      throw status(
        Errors.APPOINTMENT.INVALID_DATE.httpStatus,
        Errors.APPOINTMENT.INVALID_DATE
          .message satisfies AppointmentModel.errorInvalidDate,
      );
    }

    if (toDate < fromDate) {
      throw status(
        Errors.APPOINTMENT.INVALID_DATE.httpStatus,
        Errors.APPOINTMENT.INVALID_DATE
          .message satisfies AppointmentModel.errorInvalidDate,
      );
    }

    const diffInDays = Math.floor(
      (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays > 6) {
      throw status(
        Errors.APPOINTMENT.SHARE_RANGE_TOO_LARGE.httpStatus,
        Errors.APPOINTMENT.SHARE_RANGE_TOO_LARGE
          .message satisfies AppointmentModel.errorShareRangeTooLarge,
      );
    }

    const shareSlots = await AppointmentRepository.getAvailableSlotsByDateRange(
      userId,
      fromDate,
      toDate,
    );

    return AppointmentService.filterShareableSlots(shareSlots);
  }
}
