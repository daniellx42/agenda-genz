import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Errors } from "../../../shared/constants/errors";

// ─── Helper ──────────────────────────────────────────────────────────────────

async function expectElysiaError<T>(
  promise: Promise<T>,
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

function loadAppointmentService() {
  return import(`../appointment.service?test=${Date.now()}-${Math.random()}`);
}

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockAppointment = {
  id: "apt-1",
  date: "2026-03-09",
  status: "PENDING",
  paymentStatus: "PENDING",
  notes: null,
  beforeImageKey: null,
  afterImageKey: null,
  client: { id: "client-1", name: "Ana Silva", phone: "11999999999", profileImageKey: null },
  service: {
    id: "service-1",
    name: "Unhas em Gel",
    price: 15000,
    depositPercentage: null,
    imageKey: "services/user-1/unhas-em-gel.jpg",
    color: "#ff69b4",
  },
  timeSlot: { id: "slot-1", time: "09:00" },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockClientHistory = {
  data: [mockAppointment],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
  },
  summary: {
    totalAppointments: 1,
    completedAppointments: 0,
    confirmedAppointments: 0,
    pendingAppointments: 1,
    cancelledAppointments: 0,
    fullyPaidAppointments: 0,
    pendingPaymentAppointments: 1,
    totalReceivedCents: 0,
    totalPendingAmountCents: 15000,
    totalBookedCents: 15000,
    firstAppointmentDate: "2026-03-09",
    lastAppointmentDate: "2026-03-09",
    nextAppointmentDate: null,
    lastCompletedAppointmentDate: null,
  },
};

beforeEach(() => {
  mock.restore();
  mock.module("../../clients/client.repository", () => ({
    ClientRepository: {
      findById: mock(() => Promise.resolve(null)),
    },
  }));
});

function mockUploadInfra(deleteSucceeds = true) {
  const sendMock = mock(() =>
    deleteSucceeds
      ? Promise.resolve({})
      : Promise.reject(new Error("R2 falhou")),
  );

  mock.module("@agenda-genz/env/server", () => ({
    env: { CLOUDFLARE_BUCKET: "appointmentsimages" },
  }));
  mock.module("../../../../shared/lib/cloudeflare", () => ({
    cloudflareR2: {
      send: sendMock,
    },
  }));
  mock.module("@aws-sdk/client-s3", () => ({
    DeleteObjectCommand: mock(function () {}),
    DeleteObjectsCommand: mock(function () {}),
    GetObjectCommand: mock(function () {}),
    ListObjectsV2Command: mock(function () {}),
    PutObjectCommand: mock(function () {}),
  }));
  mock.module("@aws-sdk/s3-request-presigner", () => ({
    getSignedUrl: mock(() => Promise.resolve("https://example.com")),
  }));

  return { sendMock };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("AppointmentService.create", () => {
  it("deve criar agendamento quando slot está disponível", async () => {
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        isSlotTaken: mock(() => Promise.resolve(false)),
        create: mock(() => Promise.resolve(mockAppointment)),
      },
    }));
    mock.module("../../time-slots/time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() =>
          Promise.resolve({
            id: "slot-1",
            dayOfWeek: 1,
            time: "09:00",
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        hasExceptionOnDate: mock(() => Promise.resolve(false)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.create("user-1", {
      clientId: "client-1",
      serviceId: "service-1",
      timeSlotId: "slot-1",
      date: "2026-03-09",
    });

    expect(result).toEqual(mockAppointment);
  });

  it("deve lançar 409 quando slot já está reservado", async () => {
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        isSlotTaken: mock(() => Promise.resolve(true)),
      },
    }));
    mock.module("../../time-slots/time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() =>
          Promise.resolve({
            id: "slot-1",
            dayOfWeek: 1,
            time: "09:00",
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        hasExceptionOnDate: mock(() => Promise.resolve(false)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.create("user-1", {
        clientId: "client-1",
        serviceId: "service-1",
        timeSlotId: "slot-1",
        date: "2026-03-09",
      }),
      Errors.APPOINTMENT.SLOT_UNAVAILABLE.message,
      Errors.APPOINTMENT.SLOT_UNAVAILABLE.httpStatus,
    );
  });

  it("deve lançar erro para data inválida", async () => {
    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.create("user-1", {
        clientId: "client-1",
        serviceId: "service-1",
        timeSlotId: "slot-1",
        date: "nao-e-data",
      }),
      Errors.APPOINTMENT.INVALID_DATE.message,
      Errors.APPOINTMENT.INVALID_DATE.httpStatus,
    );
  });

  it("reserva na segunda desta semana não bloqueia segunda da próxima semana", async () => {
    const isSlotTakenMock = mock((_timeSlotId: string, date: Date) => {
      const iso = date.toISOString().split("T")[0];
      return Promise.resolve(iso === "2026-03-09");
    });

    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        isSlotTaken: isSlotTakenMock,
        create: mock(() => Promise.resolve(mockAppointment)),
      },
    }));
    mock.module("../../time-slots/time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() =>
          Promise.resolve({
            id: "slot-1",
            dayOfWeek: 1,
            time: "09:00",
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        hasExceptionOnDate: mock(() => Promise.resolve(false)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    // Slot reservado nesta segunda
    await expectElysiaError(
      AS.create("user-1", {
        clientId: "client-1",
        serviceId: "service-1",
        timeSlotId: "slot-1",
        date: "2026-03-09",
      }),
      Errors.APPOINTMENT.SLOT_UNAVAILABLE.message,
      Errors.APPOINTMENT.SLOT_UNAVAILABLE.httpStatus,
    );

    // Mesmo slot na próxima segunda — deve criar com sucesso
    const nextWeek = await AS.create("user-1", {
      clientId: "client-1",
      serviceId: "service-1",
      timeSlotId: "slot-1",
      date: "2026-03-16",
    });

    expect(nextWeek).toEqual(mockAppointment);
  });

  it("deve rejeitar slot que não pertence ao dia da data selecionada", async () => {
    mock.module("../../time-slots/time-slot.repository", () => ({
      TimeSlotRepository: {
        findById: mock(() =>
          Promise.resolve({
            id: "slot-1",
            dayOfWeek: 1,
            time: "09:00",
            active: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })),
        hasExceptionOnDate: mock(() => Promise.resolve(false)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.create("user-1", {
        clientId: "client-1",
        serviceId: "service-1",
        timeSlotId: "slot-1",
        date: "2026-03-10",
      }),
      Errors.APPOINTMENT.SLOT_UNAVAILABLE.message,
      Errors.APPOINTMENT.SLOT_UNAVAILABLE.httpStatus,
    );
  });
});

describe("AppointmentService.getById", () => {
  it("deve retornar agendamento quando encontrado", async () => {
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(mockAppointment)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.getById("apt-1", "user-1");

    expect(result).toEqual(mockAppointment);
  });

  it("deve lançar 404 quando agendamento não encontrado", async () => {
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(null)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.getById("nao-existe", "user-1"),
      Errors.APPOINTMENT.NOT_FOUND.message,
      Errors.APPOINTMENT.NOT_FOUND.httpStatus,
    );
  });
});

describe("AppointmentService.listByClient", () => {
  it("deve retornar histórico paginado quando o cliente existe", async () => {
    const findByIdMock = mock(() =>
      Promise.resolve({
        id: "client-1",
        name: "Ana Silva",
        phone: "11999999999",
        email: null,
        instagram: null,
        cpf: null,
        address: null,
        age: null,
        gender: null,
        notes: null,
        profileImageKey: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
    );
    const historyMock = mock(() => Promise.resolve(mockClientHistory));

    mock.module("../../clients/client.repository", () => ({
      ClientRepository: {
        findById: findByIdMock,
      },
    }));
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findHistoryByClient: historyMock,
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.listByClient("user-1", "client-1", 1, 20);

    expect(findByIdMock).toHaveBeenCalledWith("client-1", "user-1");
    expect(historyMock).toHaveBeenCalledWith("user-1", "client-1", 1, 20);
    expect(result).toEqual(mockClientHistory);
  });

  it("deve lançar 404 quando o cliente não existe", async () => {
    mock.module("../../clients/client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(null)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.listByClient("user-1", "nao-existe", 1, 20),
      Errors.CLIENT.NOT_FOUND.message,
      Errors.CLIENT.NOT_FOUND.httpStatus,
    );
  });
});

describe("AppointmentService.deleteById", () => {
  it("deve deletar com sucesso", async () => {
    mockUploadInfra(true);
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(mockAppointment)),
        deleteById: mock(() => Promise.resolve(true)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expect(AS.deleteById("apt-1", "user-1")).resolves.toBeUndefined();
  });

  it("deve lançar 404 quando agendamento não encontrado", async () => {
    mockUploadInfra(true);
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(null)),
        deleteById: mock(() => Promise.resolve(false)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.deleteById("nao-existe", "user-1"),
      Errors.APPOINTMENT.NOT_FOUND.message,
      Errors.APPOINTMENT.NOT_FOUND.httpStatus,
    );
  });

  it("deve remover as imagens vinculadas ao deletar o agendamento", async () => {
    const withImages = {
      ...mockAppointment,
      beforeImageKey: "services/user-1/antes.jpg",
      afterImageKey: "services/user-1/depois.jpg",
    };

    const deleteObjectMock = mock(() => Promise.resolve());
    mock.module("../../uploads/upload.service", () => ({
      UploadService: {
        deleteObject: deleteObjectMock,
      },
    }));
    const deleteByIdMock = mock(() => Promise.resolve(true));
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(withImages)),
        deleteById: deleteByIdMock,
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expect(AS.deleteById("apt-1", "user-1")).resolves.toBeUndefined();
    expect(deleteByIdMock).toHaveBeenCalledWith("apt-1", "user-1");
    expect(deleteObjectMock).toHaveBeenCalledTimes(2);
    expect(deleteObjectMock).toHaveBeenCalledWith("user-1", "services/user-1/antes.jpg");
    expect(deleteObjectMock).toHaveBeenCalledWith("user-1", "services/user-1/depois.jpg");
  });
});

describe("AppointmentService.getCalendarDots", () => {
  it("deve retornar datas com contagem de agendamentos", async () => {
    const calendarData = [
      { date: "2026-03-09", count: 2 },
      { date: "2026-03-10", count: 1 },
    ];

    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        getCalendarDots: mock(() => Promise.resolve(calendarData)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.getCalendarDots("user-1", 2026, 3);

    expect(result).toHaveLength(2);
    expect(result[0]?.count).toBe(2);
  });
});

describe("AppointmentService.updatePayment", () => {
  it("deve atualizar o status de pagamento para PAID", async () => {
    const paidAppointment = { ...mockAppointment, paymentStatus: "PAID" };

    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        updatePayment: mock(() => Promise.resolve(paidAppointment)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.updatePayment("apt-1", "user-1", { paymentStatus: "PAID" });

    expect(result).toMatchObject({ paymentStatus: "PAID" });
  });

  it("deve lançar 404 quando agendamento não encontrado", async () => {
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        updatePayment: mock(() => Promise.resolve(null)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.updatePayment("nao-existe", "user-1", { paymentStatus: "PAID" }),
      Errors.APPOINTMENT.NOT_FOUND.message,
      Errors.APPOINTMENT.NOT_FOUND.httpStatus,
    );
  });
});

describe("AppointmentService.updateImages", () => {
  it("deve atualizar beforeImageKey", async () => {
    const updatedAppointment = {
      ...mockAppointment,
      beforeImageKey: "services/user-1/abc-foto.jpg",
      afterImageKey: null,
    };

    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        updateImages: mock(() => Promise.resolve(updatedAppointment)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.updateImages("apt-1", "user-1", {
      beforeImageKey: "services/user-1/abc-foto.jpg",
    });

    expect(result.beforeImageKey).toBe("services/user-1/abc-foto.jpg");
  });

  it("deve atualizar ambas as imagens simultaneamente", async () => {
    const updatedAppointment = {
      ...mockAppointment,
      beforeImageKey: "services/user-1/before.jpg",
      afterImageKey: "services/user-1/after.jpg",
    };

    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        updateImages: mock(() => Promise.resolve(updatedAppointment)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.updateImages("apt-1", "user-1", {
      beforeImageKey: "services/user-1/before.jpg",
      afterImageKey: "services/user-1/after.jpg",
    });

    expect(result.beforeImageKey).toBe("services/user-1/before.jpg");
    expect(result.afterImageKey).toBe("services/user-1/after.jpg");
  });

  it("deve lançar 404 quando agendamento não encontrado", async () => {
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        updateImages: mock(() => Promise.resolve(null)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.updateImages("nao-existe", "user-1", {
        beforeImageKey: "services/user-1/abc.jpg",
      }),
      Errors.APPOINTMENT.NOT_FOUND.message,
      Errors.APPOINTMENT.NOT_FOUND.httpStatus,
    );
  });
});

describe("AppointmentService.deleteImage", () => {
  it("deve deletar beforeImageKey e limpar no banco", async () => {
    const withImage = { ...mockAppointment, beforeImageKey: "services/user-1/abc-antes.jpg" };
    const afterDeletion = { ...mockAppointment, beforeImageKey: null };

    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(withImage)),
        updateImages: mock(() => Promise.resolve(afterDeletion)),
      },
    }));
    mockUploadInfra(true);

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.deleteImage("apt-1", "user-1", "before");

    expect(result.beforeImageKey).toBeNull();
  });

  it("deve deletar afterImageKey", async () => {
    const withImage = { ...mockAppointment, afterImageKey: "services/user-1/abc-depois.jpg" };
    const afterDeletion = { ...mockAppointment, afterImageKey: null };

    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(withImage)),
        updateImages: mock(() => Promise.resolve(afterDeletion)),
      },
    }));
    mockUploadInfra(true);

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.deleteImage("apt-1", "user-1", "after");

    expect(result.afterImageKey).toBeNull();
  });

  it("deve lançar 404 quando agendamento não encontrado", async () => {
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(null)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.deleteImage("nao-existe", "user-1", "before"),
      Errors.APPOINTMENT.NOT_FOUND.message,
      Errors.APPOINTMENT.NOT_FOUND.httpStatus,
    );
  });

  it("deve lançar 404 quando imagem não existe no slot", async () => {
    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(mockAppointment)), // beforeImageKey: null
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.deleteImage("apt-1", "user-1", "before"),
      Errors.APPOINTMENT.IMAGE_NOT_FOUND.message,
      Errors.APPOINTMENT.IMAGE_NOT_FOUND.httpStatus,
    );
  });

  it("deve limpar o banco mesmo se R2 falhar", async () => {
    const withImage = { ...mockAppointment, beforeImageKey: "services/user-1/abc.jpg" };
    const afterDeletion = { ...mockAppointment, beforeImageKey: null };

    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        findById: mock(() => Promise.resolve(withImage)),
        updateImages: mock(() => Promise.resolve(afterDeletion)),
      },
    }));
    mockUploadInfra(false); // R2 vai falhar

    const { AppointmentService: AS } = await loadAppointmentService();
    // Não deve propagar o erro do R2
    const result = await AS.deleteImage("apt-1", "user-1", "before");
    expect(result.beforeImageKey).toBeNull();
  });
});

describe("AppointmentService.getAvailableSlotsByDateRange", () => {
  it("deve retornar slots disponíveis para o range", async () => {
    const shareData = [
      {
        date: "2026-03-09",
        dayLabel: "Segunda, 09/03",
        slots: [
          { time: "09:00", available: true },
          { time: "18:00", available: false },
        ],
      },
      {
        date: "2026-03-10",
        dayLabel: "Terça, 10/03",
        slots: [{ time: "14:00", available: true }],
      },
    ];

    mock.module("../appointment.repository", () => ({
      AppointmentRepository: {
        getAvailableSlotsByDateRange: mock(() => Promise.resolve(shareData)),
      },
    }));

    const { AppointmentService: AS } = await loadAppointmentService();
    const result = await AS.getAvailableSlotsByDateRange(
      "user-1",
      "2026-03-09",
      "2026-03-10",
    );

    expect(result).toHaveLength(2);
    expect(result[0]?.slots[0]?.time).toBe("09:00");
    expect(result[0]?.slots[1]?.available).toBe(false);
  });

  it("deve lançar erro para datas inválidas", async () => {
    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.getAvailableSlotsByDateRange("user-1", "invalido", "2026-03-10"),
      Errors.APPOINTMENT.INVALID_DATE.message,
      Errors.APPOINTMENT.INVALID_DATE.httpStatus,
    );
  });

  it("deve lançar erro quando o range passa de 7 dias", async () => {
    const { AppointmentService: AS } = await loadAppointmentService();

    await expectElysiaError(
      AS.getAvailableSlotsByDateRange("user-1", "2026-03-09", "2026-03-17"),
      Errors.APPOINTMENT.SHARE_RANGE_TOO_LARGE.message,
      Errors.APPOINTMENT.SHARE_RANGE_TOO_LARGE.httpStatus,
    );
  });
});
