import { formatDateOnly, parseDateOnly } from "../../shared/lib/date-only";
import { prisma } from "../../shared/lib/db";
import type { TimeSlotModel } from "./time-slot.model";

function toResponse(s: {
  id: string;
  dayOfWeek: number;
  time: string;
  active: boolean;
  blockedDatesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}): TimeSlotModel.timeSlotResponse {
  return {
    ...s,
    blockedDatesCount: s.blockedDatesCount ?? 0,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

export abstract class TimeSlotRepository {
  static async create(
    userId: string,
    data: TimeSlotModel.createBody,
  ): Promise<TimeSlotModel.timeSlotResponse> {
    const slot = await prisma.timeSlot.create({
      data: { ...data, userId },
    });
    return toResponse(slot);
  }

  static async findById(
    id: string,
    userId: string,
  ): Promise<TimeSlotModel.timeSlotResponse | null> {
    const slot = await prisma.timeSlot.findFirst({
      where: { id, userId },
    });
    return slot ? toResponse(slot) : null;
  }

  static async findByDayAndTime(
    userId: string,
    dayOfWeek: number,
    time: string,
  ): Promise<TimeSlotModel.timeSlotResponse | null> {
    const slot = await prisma.timeSlot.findFirst({
      where: { userId, dayOfWeek, time },
    });

    return slot ? toResponse(slot) : null;
  }

  static async existsByDayAndTime(
    userId: string,
    dayOfWeek: number,
    time: string,
  ): Promise<boolean> {
    const count = await prisma.timeSlot.count({
      where: { userId, dayOfWeek, time },
    });
    return count > 0;
  }

  static async delete(id: string, userId: string): Promise<boolean> {
    const existing = await prisma.timeSlot.findFirst({ where: { id, userId } });
    if (!existing) return false;

    await prisma.timeSlot.delete({ where: { id } });
    return true;
  }

  static async updateActive(
    id: string,
    userId: string,
    active: boolean,
  ): Promise<TimeSlotModel.timeSlotResponse | null> {
    const existing = await prisma.timeSlot.findFirst({ where: { id, userId } });
    if (!existing) return null;

    const slot = await prisma.timeSlot.update({
      where: { id },
      data: { active },
    });

    return toResponse(slot);
  }

  static async hasAppointments(id: string): Promise<boolean> {
    const count = await prisma.appointment.count({ where: { timeSlotId: id } });
    return count > 0;
  }

  static async hasActiveAppointmentOnDate(
    userId: string,
    timeSlotId: string,
    date: Date,
  ): Promise<boolean> {
    const count = await prisma.appointment.count({
      where: {
        userId,
        timeSlotId,
        date,
        status: { not: "CANCELLED" },
      },
    });

    return count > 0;
  }

  static async hasExceptionOnDate(
    userId: string,
    timeSlotId: string,
    date: Date,
  ): Promise<boolean> {
    const count = await prisma.timeSlotException.count({
      where: {
        userId,
        timeSlotId,
        date,
      },
    });

    return count > 0;
  }

  static async createException(
    userId: string,
    timeSlotId: string,
    date: Date,
  ): Promise<void> {
    await prisma.timeSlotException.create({
      data: {
        userId,
        timeSlotId,
        date,
      },
    });
  }

  static async deleteException(
    userId: string,
    timeSlotId: string,
    date: Date,
  ): Promise<boolean> {
    const result = await prisma.timeSlotException.deleteMany({
      where: {
        userId,
        timeSlotId,
        date,
      },
    });

    return result.count > 0;
  }

  static async listExceptionDates(
    userId: string,
    timeSlotId: string,
    from?: Date,
    to?: Date,
  ): Promise<string[]> {
    const exceptions = await prisma.timeSlotException.findMany({
      where: {
        userId,
        timeSlotId,
        ...(from || to
          ? {
              date: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      orderBy: { date: "asc" },
      select: { date: true },
    });

    return exceptions.map((exception) => formatDateOnly(exception.date));
  }

  static async list(
    userId: string,
    dayOfWeek?: number,
  ): Promise<TimeSlotModel.listResponse> {
    const slots = await prisma.timeSlot.findMany({
      where: {
        userId,
        ...(dayOfWeek !== undefined ? { dayOfWeek } : {}),
      },
      orderBy: [{ dayOfWeek: "asc" }, { active: "desc" }, { time: "asc" }],
    });

    if (slots.length === 0) {
      return [];
    }

    const today = parseDateOnly(formatDateOnly(new Date()));
    const blockedCounts = today
      ? await prisma.timeSlotException.groupBy({
          by: ["timeSlotId"],
          where: {
            userId,
            timeSlotId: { in: slots.map((slot) => slot.id) },
            date: { gte: today },
          },
          _count: { _all: true },
        })
      : [];

    const blockedCountBySlotId = new Map(
      blockedCounts.map((item) => [item.timeSlotId, item._count._all]),
    );

    return slots.map((slot) =>
      toResponse({
        ...slot,
        blockedDatesCount: blockedCountBySlotId.get(slot.id) ?? 0,
      }),
    );
  }

  /**
   * Retorna os slots do dia da semana correspondente à `date`,
   * marcando quais já estão reservados para essa data específica.
   *
   * Um slot reservado na segunda desta semana NÃO afeta a segunda da próxima semana.
   */
  static async getAvailableForDate(
    userId: string,
    date: Date,
  ): Promise<TimeSlotModel.availableSlotsResponse> {
    const dayOfWeek = date.getUTCDay(); // 0=Dom ... 6=Sáb

    // Busca todos os slots deste dia da semana para manter visíveis
    // também os horários recorrentes desativados.
    const slots = await prisma.timeSlot.findMany({
      where: { userId, dayOfWeek },
      orderBy: [{ active: "desc" }, { time: "asc" }],
    });

    if (slots.length === 0) return [];

    // Busca quais estão reservados para essa data específica
    const reservedSlotIds = await prisma.appointment
      .findMany({
        where: {
          userId,
          date,
          timeSlotId: { in: slots.map((s) => s.id) },
          status: { notIn: ["CANCELLED"] },
        },
        select: { timeSlotId: true },
      })
      .then((rows) => new Set(rows.map((r) => r.timeSlotId)));

    const blockedSlotIds = await prisma.timeSlotException
      .findMany({
        where: {
          userId,
          date,
          timeSlotId: { in: slots.map((slot) => slot.id) },
        },
        select: { timeSlotId: true },
      })
      .then((rows) => new Set(rows.map((row) => row.timeSlotId)));

    return slots.map((slot) => ({
      id: slot.id,
      time: slot.time,
      available:
        slot.active &&
        !reservedSlotIds.has(slot.id) &&
        !blockedSlotIds.has(slot.id),
      unavailableReason: !slot.active
        ? "INACTIVE"
        : blockedSlotIds.has(slot.id)
          ? "BLOCKED_DATE"
          : reservedSlotIds.has(slot.id)
            ? "BOOKED"
            : undefined,
    }));
  }
}
