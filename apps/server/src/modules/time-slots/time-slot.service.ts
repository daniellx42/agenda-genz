import { status } from "elysia";
import { Errors } from "../../shared/constants/errors";
import { parseDateOnly } from "../../shared/lib/date-only";
import { TimeSlotRepository } from "./time-slot.repository";
import type { TimeSlotModel } from "./time-slot.model";

export abstract class TimeSlotService {
  private static async getSlotForSpecificDate(
    id: string,
    userId: string,
    value: string,
  ) {
    const date = parseDateOnly(value);

    if (!date) {
      throw status(
        Errors.APPOINTMENT.INVALID_DATE.httpStatus,
        Errors.APPOINTMENT.INVALID_DATE.message,
      );
    }

    const slot = await TimeSlotRepository.findById(id, userId);

    if (!slot) {
      throw status(
        Errors.TIME_SLOT.NOT_FOUND.httpStatus,
        Errors.TIME_SLOT.NOT_FOUND.message satisfies TimeSlotModel.errorNotFound,
      );
    }

    if (date.getUTCDay() !== slot.dayOfWeek) {
      throw status(
        Errors.TIME_SLOT.BLOCK_DATE_MISMATCH.httpStatus,
        Errors.TIME_SLOT.BLOCK_DATE_MISMATCH
          .message satisfies TimeSlotModel.errorBlockDateMismatch,
      );
    }

    return { date, slot };
  }

  private static async setActive(
    id: string,
    userId: string,
    active: boolean,
  ): Promise<TimeSlotModel.timeSlotResponse> {
    const updated = await TimeSlotRepository.updateActive(id, userId, active);

    if (!updated) {
      throw status(
        Errors.TIME_SLOT.NOT_FOUND.httpStatus,
        Errors.TIME_SLOT.NOT_FOUND.message satisfies TimeSlotModel.errorNotFound,
      );
    }

    return updated;
  }

  static async create(
    userId: string,
    data: TimeSlotModel.createBody,
  ): Promise<TimeSlotModel.timeSlotResponse> {
    const existing = await TimeSlotRepository.findByDayAndTime(
      userId,
      data.dayOfWeek,
      data.time,
    );

    if (existing?.active) {
      throw status(
        Errors.TIME_SLOT.ALREADY_EXISTS.httpStatus,
        Errors.TIME_SLOT.ALREADY_EXISTS
          .message satisfies TimeSlotModel.errorAlreadyExists,
      );
    }

    if (existing) {
      const reactivated = await TimeSlotRepository.updateActive(existing.id, userId, true);

      if (!reactivated) {
        throw status(
          Errors.TIME_SLOT.NOT_FOUND.httpStatus,
          Errors.TIME_SLOT.NOT_FOUND.message satisfies TimeSlotModel.errorNotFound,
        );
      }

      return reactivated;
    }

    return TimeSlotRepository.create(userId, data);
  }

  static async delete(id: string, userId: string): Promise<void> {
    const inUse = await TimeSlotRepository.hasAppointments(id);

    if (inUse) {
      throw status(
        Errors.TIME_SLOT.IN_USE.httpStatus,
        Errors.TIME_SLOT.IN_USE.message satisfies TimeSlotModel.errorInUse,
      );
    }

    const deleted = await TimeSlotRepository.delete(id, userId);

    if (!deleted) {
      throw status(
        Errors.TIME_SLOT.NOT_FOUND.httpStatus,
        Errors.TIME_SLOT.NOT_FOUND.message satisfies TimeSlotModel.errorNotFound,
      );
    }
  }

  static async deactivate(
    id: string,
    userId: string,
  ): Promise<TimeSlotModel.timeSlotResponse> {
    return this.setActive(id, userId, false);
  }

  static async activate(
    id: string,
    userId: string,
  ): Promise<TimeSlotModel.timeSlotResponse> {
    return this.setActive(id, userId, true);
  }

  static async blockDate(
    id: string,
    userId: string,
    data: TimeSlotModel.blockDateBody,
  ): Promise<void> {
    const { date } = await this.getSlotForSpecificDate(id, userId, data.date);

    const hasAppointment = await TimeSlotRepository.hasActiveAppointmentOnDate(
      userId,
      id,
      date,
    );

    if (hasAppointment) {
      throw status(
        Errors.TIME_SLOT.BLOCK_HAS_APPOINTMENT.httpStatus,
        Errors.TIME_SLOT.BLOCK_HAS_APPOINTMENT
          .message satisfies TimeSlotModel.errorBlockHasAppointment,
      );
    }

    const alreadyBlocked = await TimeSlotRepository.hasExceptionOnDate(
      userId,
      id,
      date,
    );

    if (alreadyBlocked) {
      throw status(
        Errors.TIME_SLOT.BLOCK_ALREADY_EXISTS.httpStatus,
        Errors.TIME_SLOT.BLOCK_ALREADY_EXISTS
          .message satisfies TimeSlotModel.errorBlockAlreadyExists,
      );
    }

    await TimeSlotRepository.createException(userId, id, date);
  }

  static async unblockDate(
    id: string,
    userId: string,
    query: TimeSlotModel.blockDateQuery,
  ): Promise<void> {
    const { date } = await this.getSlotForSpecificDate(id, userId, query.date);

    const removed = await TimeSlotRepository.deleteException(userId, id, date);

    if (!removed) {
      throw status(
        Errors.TIME_SLOT.BLOCK_NOT_FOUND.httpStatus,
        Errors.TIME_SLOT.BLOCK_NOT_FOUND
          .message satisfies TimeSlotModel.errorBlockNotFound,
      );
    }
  }

  static async listBlockedDates(
    id: string,
    userId: string,
    query: TimeSlotModel.blockedDatesQuery,
  ): Promise<TimeSlotModel.blockedDatesResponse> {
    const slot = await TimeSlotRepository.findById(id, userId);

    if (!slot) {
      throw status(
        Errors.TIME_SLOT.NOT_FOUND.httpStatus,
        Errors.TIME_SLOT.NOT_FOUND.message satisfies TimeSlotModel.errorNotFound,
      );
    }

    const from = query.from ? parseDateOnly(query.from) : null;
    const to = query.to ? parseDateOnly(query.to) : null;

    if (query.from && !from) {
      throw status(
        Errors.APPOINTMENT.INVALID_DATE.httpStatus,
        Errors.APPOINTMENT.INVALID_DATE.message,
      );
    }

    if (query.to && !to) {
      throw status(
        Errors.APPOINTMENT.INVALID_DATE.httpStatus,
        Errors.APPOINTMENT.INVALID_DATE.message,
      );
    }

    if (from && to && to < from) {
      throw status(
        Errors.APPOINTMENT.INVALID_DATE.httpStatus,
        Errors.APPOINTMENT.INVALID_DATE.message,
      );
    }

    return TimeSlotRepository.listExceptionDates(
      userId,
      id,
      from ?? undefined,
      to ?? undefined,
    );
  }

  static async list(
    userId: string,
    dayOfWeek?: number,
  ): Promise<TimeSlotModel.listResponse> {
    return TimeSlotRepository.list(userId, dayOfWeek);
  }

  static async getAvailableForDate(
    userId: string,
    dateStr: string,
  ): Promise<TimeSlotModel.availableSlotsResponse> {
    const date = parseDateOnly(dateStr);

    if (!date) {
      throw status(
        Errors.APPOINTMENT.INVALID_DATE.httpStatus,
        Errors.APPOINTMENT.INVALID_DATE.message,
      );
    }

    return TimeSlotRepository.getAvailableForDate(userId, date);
  }
}
