import type { AppointmentStatus, PaymentStatus } from "@agenda-genz/db";
import { prisma } from "../../shared/lib/db";
import { addUtcDays, formatDateOnly } from "../../shared/lib/date-only";
import { buildAppointmentHistorySummary } from "./lib/appointment-history-summary";
import type { AppointmentModel } from "./appointment.model";

const DAY_NAMES_PT = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const appointmentInclude = {
  client: { select: { id: true, name: true, phone: true, profileImageKey: true } },
  service: {
    select: {
      id: true,
      name: true,
      price: true,
      depositPercentage: true,
      emoji: true,
      color: true,
    },
  },
  timeSlot: { select: { id: true, time: true } },
} as const;

type AppointmentRecord = {
  id: string;
  date: Date;
  status: AppointmentStatus;
  paymentStatus: PaymentStatus;
  notes: string | null;
  beforeImageKey: string | null;
  afterImageKey: string | null;
  client: { id: string; name: string; phone: string; profileImageKey: string | null };
  service: {
    id: string;
    name: string;
    price: number;
    depositPercentage: number | null;
    emoji: string | null;
    color: string | null;
  };
  timeSlot: { id: string; time: string };
  createdAt: Date;
  updatedAt: Date;
};

function toResponse(a: AppointmentRecord): AppointmentModel.appointmentResponse {
  return {
    id: a.id,
    date: formatDateOnly(a.date),
    status: a.status,
    paymentStatus: a.paymentStatus,
    notes: a.notes,
    beforeImageKey: a.beforeImageKey,
    afterImageKey: a.afterImageKey,
    client: a.client,
    service: a.service,
    timeSlot: a.timeSlot,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export abstract class AppointmentRepository {
  static async isSlotTaken(
    timeSlotId: string,
    date: Date,
  ): Promise<boolean> {
    const count = await prisma.appointment.count({
      where: {
        timeSlotId,
        date,
        status: { not: "CANCELLED" },
      },
    });
    return count > 0;
  }

  static async create(
    userId: string,
    data: {
      clientId: string;
      serviceId: string;
      timeSlotId: string;
      date: Date;
      notes?: string;
    },
  ): Promise<AppointmentModel.appointmentResponse> {
    const appointment = await prisma.appointment.create({
      data: { ...data, userId },
      include: appointmentInclude,
    });

    return toResponse(appointment);
  }

  static async findById(
    id: string,
    userId: string,
  ): Promise<AppointmentModel.appointmentResponse | null> {
    const appointment = await prisma.appointment.findFirst({
      where: { id, userId },
      include: appointmentInclude,
    });

    return appointment ? toResponse(appointment) : null;
  }

  static async findByDate(
    userId: string,
    date: Date,
  ): Promise<AppointmentModel.listResponse> {
    const appointments = await prisma.appointment.findMany({
      where: { userId, date },
      include: appointmentInclude,
      orderBy: { timeSlot: { time: "asc" } },
    });

    return appointments.map(toResponse);
  }

  static async findHistoryByClient(
    userId: string,
    clientId: string,
    page: number,
    limit: number,
  ): Promise<AppointmentModel.clientHistoryResponse> {
    const where = { userId, clientId };

    const [appointments, total, summaryRows] = await Promise.all([
      prisma.appointment.findMany({
        where,
        include: appointmentInclude,
        orderBy: [{ date: "desc" }, { createdAt: "desc" }, { timeSlot: { time: "desc" } }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.appointment.count({ where }),
      prisma.appointment.findMany({
        where,
        select: {
          date: true,
          status: true,
          paymentStatus: true,
          service: {
            select: {
              price: true,
              depositPercentage: true,
            },
          },
        },
      }),
    ]);

    return {
      data: appointments.map(toResponse),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      summary: buildAppointmentHistorySummary(summaryRows),
    };
  }

  static async getCalendarDots(
    userId: string,
    year: number,
    month: number,
  ): Promise<AppointmentModel.calendarResponse> {
    // Primeiro e último dia do mês
    const from = new Date(Date.UTC(year, month - 1, 1, 12));
    const to = new Date(Date.UTC(year, month, 0, 12)); // último dia

    const appointments = await prisma.appointment.findMany({
      where: {
        userId,
        date: { gte: from, lte: to },
        status: { not: "CANCELLED" },
      },
      select: { date: true },
    });

    // Agrupa por data
    const countByDate = new Map<string, number>();
    for (const { date } of appointments) {
      const key = formatDateOnly(date);
      countByDate.set(key, (countByDate.get(key) ?? 0) + 1);
    }

    return Array.from(countByDate.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }

  static async updateStatus(
    id: string,
    userId: string,
    status: AppointmentStatus,
  ): Promise<AppointmentModel.appointmentResponse | null> {
    const existing = await prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: appointmentInclude,
    });

    return toResponse(appointment);
  }

  static async updatePayment(
    id: string,
    userId: string,
    paymentStatus: PaymentStatus,
  ): Promise<AppointmentModel.appointmentResponse | null> {
    const existing = await prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: { paymentStatus },
      include: appointmentInclude,
    });

    return toResponse(appointment);
  }

  static async updateImages(
    id: string,
    userId: string,
    data: { beforeImageKey?: string | null; afterImageKey?: string | null },
  ): Promise<AppointmentModel.appointmentResponse | null> {
    const existing = await prisma.appointment.findFirst({
      where: { id, userId },
    });
    if (!existing) return null;

    const appointment = await prisma.appointment.update({
      where: { id },
      data: {
        ...(data.beforeImageKey !== undefined && { beforeImageKey: data.beforeImageKey }),
        ...(data.afterImageKey !== undefined && { afterImageKey: data.afterImageKey }),
      },
      include: appointmentInclude,
    });

    return toResponse(appointment);
  }

  static async deleteById(id: string, userId: string): Promise<boolean> {
    const result = await prisma.appointment.deleteMany({
      where: { id, userId },
    });

    return result.count > 0;
  }

  /**
   * Returns before/after image keys for all appointments of a client (for R2 cleanup on client delete).
   */
  static async findImageKeysByClientId(
    clientId: string,
    userId: string,
  ): Promise<{ beforeImageKey: string | null; afterImageKey: string | null }[]> {
    const rows = await prisma.appointment.findMany({
      where: { clientId, userId },
      select: { beforeImageKey: true, afterImageKey: true },
    });
    return rows;
  }

  /**
   * Retorna os slots disponíveis para cada dia no intervalo [from, to],
   * formatado para o compartilhamento via WhatsApp/Instagram.
   */
  static async getAvailableSlotsByDateRange(
    userId: string,
    from: Date,
    to: Date,
  ): Promise<AppointmentModel.shareSlotsResponse> {
    const result: AppointmentModel.shareSlotsResponse = [];

    // Itera por cada dia no intervalo
    const current = new Date(from);
    while (current <= to) {
      const dayOfWeek = current.getUTCDay();
      const dateISO = formatDateOnly(current);

      // Slots configurados para este dia da semana
      const slots = await prisma.timeSlot.findMany({
        where: { userId, dayOfWeek, active: true },
        orderBy: { time: "asc" },
      });

      if (slots.length > 0) {
        // Slots já reservados para essa data
        const reservedIds = await prisma.appointment
          .findMany({
            where: {
              userId,
              date: current,
              status: { not: "CANCELLED" },
              timeSlotId: { in: slots.map((s) => s.id) },
            },
            select: { timeSlotId: true },
          })
          .then((rows) => new Set(rows.map((r) => r.timeSlotId)));

        const blockedIds = await prisma.timeSlotException
          .findMany({
            where: {
              userId,
              date: current,
              timeSlotId: { in: slots.map((slot) => slot.id) },
            },
            select: { timeSlotId: true },
          })
          .then((rows) => new Set(rows.map((row) => row.timeSlotId)));

        if (slots.length > 0) {
          const day = current.getUTCDate();
          const month = current.getUTCMonth() + 1;
          const dayName = DAY_NAMES_PT[dayOfWeek] ?? "";

          result.push({
            date: dateISO,
            dayLabel: `${dayName}, ${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}`,
            slots: slots.map((slot) => ({
              time: slot.time,
              available: !reservedIds.has(slot.id) && !blockedIds.has(slot.id),
            })),
          });
        }
      }

      const next = addUtcDays(current, 1);
      current.setTime(next.getTime());
    }

    return result;
  }
}
