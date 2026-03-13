import { describe, expect, it, mock, beforeEach } from "bun:test";
import { Errors } from "../../../shared/constants/errors";

// ─── Helper ──────────────────────────────────────────────────────────────────

async function expectElysiaError(
  promise: Promise<unknown>,
  expectedMessage: string,
  expectedCode: number,
) {
  try {
    await promise;
    throw new Error("Expected promise to reject");
  } catch (err) {
    expect(err).toMatchObject({ response: expectedMessage, code: expectedCode });
  }
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockSlot = {
  id: "slot-1",
  dayOfWeek: 1, // Segunda
  time: "09:00",
  active: true,
  blockedDatesCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAvailableSlots = [
  { id: "slot-1", time: "09:00", available: true },
  { id: "slot-2", time: "14:00", available: false }, // já reservado
  { id: "slot-3", time: "18:00", available: true },
];

beforeEach(() => {
  mock.restore();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("TimeSlotService.create", () => {
  it("deve criar um horário quando não existe duplicata", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findByDayAndTime: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve(mockSlot)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");
    const result = await TSS.create("user-1", { dayOfWeek: 1, time: "09:00" });

    expect(result).toEqual(mockSlot);
  });

  it("deve lançar 409 quando horário já existe para o mesmo dia", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findByDayAndTime: mock(() => Promise.resolve(mockSlot)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.create("user-1", { dayOfWeek: 1, time: "09:00" }),
      Errors.TIME_SLOT.ALREADY_EXISTS.message,
      Errors.TIME_SLOT.ALREADY_EXISTS.httpStatus,
    );
  });

  it("deve reativar um horário desativado ao cadastrar o mesmo dia e hora", async () => {
    const inactiveSlot = { ...mockSlot, active: false };
    const updateActiveMock = mock(() => Promise.resolve(mockSlot));

    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findByDayAndTime: mock(() => Promise.resolve(inactiveSlot)),
        updateActive: updateActiveMock,
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");
    const result = await TSS.create("user-1", { dayOfWeek: 1, time: "09:00" });

    expect(result).toEqual(mockSlot);
    expect(updateActiveMock).toHaveBeenCalledWith("slot-1", "user-1", true);
  });
});

describe("TimeSlotService.delete", () => {
  it("deve deletar com sucesso quando sem agendamentos", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        hasAppointments: mock(() => Promise.resolve(false)),
        delete: mock(() => Promise.resolve(true)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expect(TSS.delete("slot-1", "user-1")).resolves.toBeUndefined();
  });

  it("deve lançar 409 quando horário tem agendamentos", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        hasAppointments: mock(() => Promise.resolve(true)),
        delete: mock(() => Promise.resolve(true)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.delete("slot-1", "user-1"),
      Errors.TIME_SLOT.IN_USE.message,
      Errors.TIME_SLOT.IN_USE.httpStatus,
    );
  });

  it("deve lançar 404 quando horário não encontrado", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        hasAppointments: mock(() => Promise.resolve(false)),
        delete: mock(() => Promise.resolve(false)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.delete("nao-existe", "user-1"),
      Errors.TIME_SLOT.NOT_FOUND.message,
      Errors.TIME_SLOT.NOT_FOUND.httpStatus,
    );
  });
});

describe("TimeSlotService.deactivate", () => {
  it("deve desativar a recorrência do horário", async () => {
    const deactivatedSlot = { ...mockSlot, active: false };

    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        updateActive: mock(() => Promise.resolve(deactivatedSlot)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");
    const result = await TSS.deactivate("slot-1", "user-1");

    expect(result.active).toBe(false);
  });

  it("deve lançar 404 ao desativar horário inexistente", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        updateActive: mock(() => Promise.resolve(null)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.deactivate("nao-existe", "user-1"),
      Errors.TIME_SLOT.NOT_FOUND.message,
      Errors.TIME_SLOT.NOT_FOUND.httpStatus,
    );
  });
});

describe("TimeSlotService.activate", () => {
  it("deve ativar novamente a recorrência do horário", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        updateActive: mock(() => Promise.resolve(mockSlot)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");
    const result = await TSS.activate("slot-1", "user-1");

    expect(result.active).toBe(true);
  });

  it("deve lançar 404 ao ativar horário inexistente", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        updateActive: mock(() => Promise.resolve(null)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.activate("nao-existe", "user-1"),
      Errors.TIME_SLOT.NOT_FOUND.message,
      Errors.TIME_SLOT.NOT_FOUND.httpStatus,
    );
  });
});

describe("TimeSlotService.blockDate", () => {
  it("deve bloquear uma data específica do horário", async () => {
    const createExceptionMock = mock(() => Promise.resolve());

    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() => Promise.resolve({ ...mockSlot, dayOfWeek: 3 })),
        hasActiveAppointmentOnDate: mock(() => Promise.resolve(false)),
        hasExceptionOnDate: mock(() => Promise.resolve(false)),
        createException: createExceptionMock,
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expect(
      TSS.blockDate("slot-1", "user-1", { date: "2026-03-11" }),
    ).resolves.toBeUndefined();
    expect(createExceptionMock).toHaveBeenCalled();
  });

  it("deve lançar 400 quando a data não corresponde ao dia do horário", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() => Promise.resolve({ ...mockSlot, dayOfWeek: 3 })),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.blockDate("slot-1", "user-1", { date: "2026-03-12" }),
      Errors.TIME_SLOT.BLOCK_DATE_MISMATCH.message,
      Errors.TIME_SLOT.BLOCK_DATE_MISMATCH.httpStatus,
    );
  });

  it("deve lançar 409 quando já existe agendamento na data", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() => Promise.resolve({ ...mockSlot, dayOfWeek: 3 })),
        hasActiveAppointmentOnDate: mock(() => Promise.resolve(true)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.blockDate("slot-1", "user-1", { date: "2026-03-11" }),
      Errors.TIME_SLOT.BLOCK_HAS_APPOINTMENT.message,
      Errors.TIME_SLOT.BLOCK_HAS_APPOINTMENT.httpStatus,
    );
  });

  it("deve lançar 409 quando a data já foi bloqueada", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() => Promise.resolve({ ...mockSlot, dayOfWeek: 3 })),
        hasActiveAppointmentOnDate: mock(() => Promise.resolve(false)),
        hasExceptionOnDate: mock(() => Promise.resolve(true)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.blockDate("slot-1", "user-1", { date: "2026-03-11" }),
      Errors.TIME_SLOT.BLOCK_ALREADY_EXISTS.message,
      Errors.TIME_SLOT.BLOCK_ALREADY_EXISTS.httpStatus,
    );
  });
});

describe("TimeSlotService.unblockDate", () => {
  it("deve remover o bloqueio de uma data específica do horário", async () => {
    const deleteExceptionMock = mock(() => Promise.resolve(true));

    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() => Promise.resolve({ ...mockSlot, dayOfWeek: 3 })),
        deleteException: deleteExceptionMock,
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expect(
      TSS.unblockDate("slot-1", "user-1", { date: "2026-03-11" }),
    ).resolves.toBeUndefined();
    expect(deleteExceptionMock).toHaveBeenCalled();
  });

  it("deve lançar 404 quando não existir bloqueio para a data", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() => Promise.resolve({ ...mockSlot, dayOfWeek: 3 })),
        deleteException: mock(() => Promise.resolve(false)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.unblockDate("slot-1", "user-1", { date: "2026-03-11" }),
      Errors.TIME_SLOT.BLOCK_NOT_FOUND.message,
      Errors.TIME_SLOT.BLOCK_NOT_FOUND.httpStatus,
    );
  });
});

describe("TimeSlotService.listBlockedDates", () => {
  it("deve listar as datas bloqueadas do horário", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() => Promise.resolve(mockSlot)),
        listExceptionDates: mock(() => Promise.resolve(["2026-03-16"])),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");
    const result = await TSS.listBlockedDates("slot-1", "user-1", {
      from: "2026-03-11",
    });

    expect(result).toEqual(["2026-03-16"]);
  });
});

describe("TimeSlotService.getAvailableForDate", () => {
  it("deve retornar slots com disponibilidade marcada", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        getAvailableForDate: mock(() => Promise.resolve(mockAvailableSlots)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");
    const result = await TSS.getAvailableForDate("user-1", "2026-03-09");

    expect(result).toHaveLength(3);
    expect(result[0]?.available).toBe(true);
    expect(result[1]?.available).toBe(false); // slot reservado
    expect(result[2]?.available).toBe(true);
  });

  it("deve lançar erro para data inválida", async () => {
    const { TimeSlotService: TSS } = await import("../time-slot.service");

    await expectElysiaError(
      TSS.getAvailableForDate("user-1", "data-invalida"),
      Errors.APPOINTMENT.INVALID_DATE.message,
      Errors.APPOINTMENT.INVALID_DATE.httpStatus,
    );
  });

  it("slot reservado em uma data não afeta outra data", async () => {
    const mondayMarch9Slots = [{ id: "slot-1", time: "09:00", available: false }];
    const mondayMarch16Slots = [{ id: "slot-1", time: "09:00", available: true }];

    const getAvailableMock = mock((_userId: string, date: Date) => {
      const iso = date.toISOString().split("T")[0];
      return Promise.resolve(
        iso === "2026-03-09" ? mondayMarch9Slots : mondayMarch16Slots,
      );
    });

    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: { getAvailableForDate: getAvailableMock },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");

    const week1 = await TSS.getAvailableForDate("user-1", "2026-03-09");
    const week2 = await TSS.getAvailableForDate("user-1", "2026-03-16");

    expect(week1[0]?.available).toBe(false); // reservado esta semana
    expect(week2[0]?.available).toBe(true);  // livre na próxima semana
  });
});

describe("TimeSlotService.list", () => {
  it("deve retornar todos os slots quando sem filtro", async () => {
    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        list: mock(() => Promise.resolve([mockSlot])),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");
    const result = await TSS.list("user-1");

    expect(result).toHaveLength(1);
  });

  it("deve filtrar slots por dia da semana", async () => {
    const mondaySlots = [mockSlot];

    mock.module("../time-slot.repository", () => ({
      TimeSlotRepository: {
        list: mock(() => Promise.resolve(mondaySlots)),
      },
    }));

    const { TimeSlotService: TSS } = await import("../time-slot.service");
    const result = await TSS.list("user-1", 1);

    expect(result.every((s) => s.dayOfWeek === 1)).toBe(true);
  });
});
