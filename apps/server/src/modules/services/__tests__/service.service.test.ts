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

const mockService = {
  id: "service-1",
  name: "Unhas em Gel",
  description: "Aplicação completa de unhas em gel",
  price: 15000,
  depositPercentage: null,
  color: "#ff69b4",
  emoji: "💅",
  active: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

beforeEach(() => {
  mock.restore();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ServiceService.create", () => {
  it("deve criar um serviço e retornar os dados", async () => {
    mock.module("../service.repository", () => ({
      ServiceRepository: {
        create: mock(() => Promise.resolve(mockService)),
      },
    }));

    const { ServiceService: SS } = await import("../service.service");
    const result = await SS.create("user-1", {
      name: "Unhas em Gel",
      price: 15000,
    });

    expect(result).toEqual(mockService);
  });
});

describe("ServiceService.getById", () => {
  it("deve retornar o serviço quando encontrado", async () => {
    mock.module("../service.repository", () => ({
      ServiceRepository: {
        findById: mock(() => Promise.resolve(mockService)),
      },
    }));

    const { ServiceService: SS } = await import("../service.service");
    const result = await SS.getById("service-1", "user-1");

    expect(result).toEqual(mockService);
  });

  it("deve lançar 404 quando serviço não encontrado", async () => {
    mock.module("../service.repository", () => ({
      ServiceRepository: {
        findById: mock(() => Promise.resolve(null)),
      },
    }));

    const { ServiceService: SS } = await import("../service.service");

    await expectElysiaError(
      SS.getById("nao-existe", "user-1"),
      Errors.SERVICE.NOT_FOUND.message,
      Errors.SERVICE.NOT_FOUND.httpStatus,
    );
  });
});

describe("ServiceService.delete", () => {
  it("deve lançar 409 quando serviço tem agendamentos", async () => {
    mock.module("../service.repository", () => ({
      ServiceRepository: {
        hasAppointments: mock(() => Promise.resolve(true)),
        delete: mock(() => Promise.resolve(true)),
      },
    }));

    const { ServiceService: SS } = await import("../service.service");

    await expectElysiaError(
      SS.delete("service-1", "user-1"),
      Errors.SERVICE.IN_USE.message,
      Errors.SERVICE.IN_USE.httpStatus,
    );
  });

  it("deve deletar com sucesso quando serviço não tem agendamentos", async () => {
    mock.module("../service.repository", () => ({
      ServiceRepository: {
        hasAppointments: mock(() => Promise.resolve(false)),
        delete: mock(() => Promise.resolve(true)),
      },
    }));

    const { ServiceService: SS } = await import("../service.service");

    await expect(SS.delete("service-1", "user-1")).resolves.toBeUndefined();
  });

  it("deve lançar 404 quando serviço não encontrado ao deletar", async () => {
    mock.module("../service.repository", () => ({
      ServiceRepository: {
        hasAppointments: mock(() => Promise.resolve(false)),
        delete: mock(() => Promise.resolve(false)),
      },
    }));

    const { ServiceService: SS } = await import("../service.service");

    await expectElysiaError(
      SS.delete("nao-existe", "user-1"),
      Errors.SERVICE.NOT_FOUND.message,
      Errors.SERVICE.NOT_FOUND.httpStatus,
    );
  });
});

const mockPagination = { page: 1, limit: 20, total: 1, totalPages: 1 };

describe("ServiceService.list", () => {
  it("deve retornar lista de serviços", async () => {
    mock.module("../service.repository", () => ({
      ServiceRepository: {
        list: mock(() => Promise.resolve({ data: [mockService], pagination: { ...mockPagination, total: 1 } })),
      },
    }));

    const { ServiceService: SS } = await import("../service.service");
    const result = await SS.list("user-1", 1, 20);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]?.name).toBe("Unhas em Gel");
  });

  it("deve retornar lista vazia quando não há serviços", async () => {
    mock.module("../service.repository", () => ({
      ServiceRepository: {
        list: mock(() => Promise.resolve({ data: [], pagination: { ...mockPagination, total: 0, totalPages: 0 } })),
      },
    }));

    const { ServiceService: SS } = await import("../service.service");
    const result = await SS.list("user-1", 1, 20);

    expect(result.data).toHaveLength(0);
  });
});

describe("ServiceService.listAll", () => {
  it("deve retornar todos os serviços para exportação", async () => {
    mock.module("../service.repository", () => ({
      ServiceRepository: {
        listAll: mock(() => Promise.resolve([mockService])),
      },
    }));

    const { ServiceService: SS } = await import("../service.service");
    const result = await SS.listAll("user-1");

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Unhas em Gel");
  });
});
