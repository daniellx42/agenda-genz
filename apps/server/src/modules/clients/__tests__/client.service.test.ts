import { beforeEach, describe, expect, it, mock } from "bun:test";
import { Errors } from "../../../shared/constants/errors";

// ─── Helpers ─────────────────────────────────────────────────────────────────

// status() do Elysia lança um ElysiaCustomStatusResponse (não um Error)
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

const mockClient = {
  id: "client-1",
  name: "Ana Silva",
  phone: "11999999999",
  email: "ana@email.com",
  instagram: "ana",
  cpf: "123.456.789-00",
  address: null,
  age: null,
  gender: null,
  notes: null,
  profileImageKey: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockListResult = {
  data: [
    {
      id: "client-1",
      name: "Ana Silva",
      phone: "11999999999",
      email: null,
      instagram: null,
      profileImageKey: null,
    },
  ],
  pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
};

beforeEach(() => {
  mock.restore();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ClientService.create", () => {
  it("deve criar um cliente e retornar os dados", async () => {
    const createMock = mock(() => Promise.resolve(mockClient));

    mock.module("../client.repository", () => ({
      ClientRepository: {
        create: createMock,
      },
    }));

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.create("user-1", {
      name: "Ana Silva",
      phone: "11999999999",
    });

    expect(result).toEqual(mockClient);
    expect(createMock).toHaveBeenCalledWith("user-1", {
      name: "Ana Silva",
      phone: "11999999999",
      email: undefined,
      instagram: undefined,
      cpf: undefined,
      address: undefined,
      age: undefined,
      gender: undefined,
      notes: undefined,
      profileImageKey: undefined,
    });
  });

  it("deve normalizar url do Instagram e salvar campos adicionais opcionais", async () => {
    const createMock = mock(() =>
      Promise.resolve({
        ...mockClient,
        instagram: "ana_weiss_nails",
        address: "Rua das Flores, 10",
        age: 28,
        gender: "FEMALE",
      }),
    );

    mock.module("../client.repository", () => ({
      ClientRepository: {
        create: createMock,
      },
    }));

    const { ClientService: CS } = await import("../client.service");

    await CS.create("user-1", {
      name: " Ana   Silva ",
      phone: "(11) 99999-9999",
      instagram: "https://www.instagram.com/ana_weiss_nails/",
      address: " Rua das Flores, 10 ",
      age: 28,
      gender: "FEMALE",
    });

    expect(createMock).toHaveBeenCalledWith("user-1", {
      name: "Ana Silva",
      phone: "11999999999",
      email: undefined,
      instagram: "ana_weiss_nails",
      cpf: undefined,
      address: "Rua das Flores, 10",
      age: 28,
      gender: "FEMALE",
      notes: undefined,
      profileImageKey: undefined,
    });
  });
});

describe("ClientService.getById", () => {
  it("deve retornar o cliente quando encontrado", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(mockClient)),
      },
    }));

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.getById("client-1", "user-1");

    expect(result).toEqual(mockClient);
  });

  it("deve lançar 404 quando cliente não encontrado", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(null)),
      },
    }));

    const { ClientService: CS } = await import("../client.service");

    await expectElysiaError(
      CS.getById("nao-existe", "user-1"),
      Errors.CLIENT.NOT_FOUND.message,
      Errors.CLIENT.NOT_FOUND.httpStatus,
    );
  });
});

describe("ClientService.update", () => {
  it("deve atualizar e retornar o cliente", async () => {
    const updated = { ...mockClient, name: "Ana Costa" };
    const updateMock = mock(() => Promise.resolve(updated));

    mock.module("../client.repository", () => ({
      ClientRepository: {
        update: updateMock,
      },
    }));

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.update("client-1", "user-1", { name: "Ana Costa" });

    expect(result.name).toBe("Ana Costa");
    expect(updateMock).toHaveBeenCalledWith("client-1", "user-1", {
      name: "Ana Costa",
      phone: undefined,
      email: undefined,
      instagram: undefined,
      cpf: undefined,
      address: undefined,
      age: undefined,
      gender: undefined,
      notes: undefined,
      profileImageKey: undefined,
    });
  });

  it("deve lançar 404 quando cliente não encontrado ao atualizar", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        update: mock(() => Promise.resolve(null)),
      },
    }));

    const { ClientService: CS } = await import("../client.service");

    await expectElysiaError(
      CS.update("nao-existe", "user-1", { name: "X" }),
      Errors.CLIENT.NOT_FOUND.message,
      Errors.CLIENT.NOT_FOUND.httpStatus,
    );
  });
});

describe("ClientService.delete", () => {
  it("deve deletar com sucesso quando cliente existe", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(mockClient)),
        delete: mock(() => Promise.resolve(true)),
      },
    }));

    const { ClientService: CS } = await import("../client.service");

    await expect(CS.delete("client-1", "user-1")).resolves.toBeUndefined();
  });

  it("deve lançar 404 quando cliente não existe ao deletar", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(null)),
        delete: mock(() => Promise.resolve(false)),
      },
    }));

    const { ClientService: CS } = await import("../client.service");

    await expectElysiaError(
      CS.delete("nao-existe", "user-1"),
      Errors.CLIENT.NOT_FOUND.message,
      Errors.CLIENT.NOT_FOUND.httpStatus,
    );
  });

  it("deve deletar foto de perfil do R2 ao deletar cliente", async () => {
    const clientWithImage = { ...mockClient, profileImageKey: "profile/user-1/abc.jpg" };

    mock.module("../client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(clientWithImage)),
        delete: mock(() => Promise.resolve(true)),
      },
    }));
    mock.module("@agenda-genz/env/server", () => ({
      env: { CLOUDFLARE_BUCKET: "appointmentsimages" },
    }));
    mock.module("../../../shared/lib/cloudeflare", () => ({
      cloudflareR2: {
        send: mock(() => Promise.resolve({})),
      },
    }));
    mock.module("@aws-sdk/client-s3", () => ({
      DeleteObjectCommand: mock(function (this: unknown) { }),
      GetObjectCommand: mock(function (this: unknown) { }),
      PutObjectCommand: mock(function (this: unknown) { }),
    }));

    const { ClientService: CS } = await import("../client.service");
    await expect(CS.delete("client-1", "user-1")).resolves.toBeUndefined();
  });
});

describe("ClientService.list", () => {
  it("deve retornar lista paginada", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        list: mock(() => Promise.resolve(mockListResult)),
      },
    }));

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.list("user-1", 1, 20);

    expect(result.data).toHaveLength(1);
    expect(result.pagination.total).toBe(1);
  });
});

describe("ClientService.deleteProfileImage", () => {
  // Mesma estratégia: mockar na camada de infra para não conflitar com upload.service.test.ts
  function mockUploadInfra(deleteSucceeds = true) {
    mock.module("@agenda-genz/env/server", () => ({
      env: { CLOUDFLARE_BUCKET: "appointmentsimages" },
    }));
    mock.module("../../../shared/lib/cloudeflare", () => ({
      cloudflareR2: {
        send: mock(() =>
          deleteSucceeds
            ? Promise.resolve({})
            : Promise.reject(new Error("R2 falhou")),
        ),
      },
    }));
    mock.module("@aws-sdk/client-s3", () => ({
      DeleteObjectCommand: mock(function (this: unknown) { }),
      GetObjectCommand: mock(function (this: unknown) { }),
      PutObjectCommand: mock(function (this: unknown) { }),
    }));
  }

  it("deve deletar a foto de perfil e limpar no banco", async () => {
    const clientWithImage = { ...mockClient, profileImageKey: "profile/user-1/abc-avatar.jpg" };
    const clientNoImage = { ...mockClient, profileImageKey: null };

    mock.module("../client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(clientWithImage)),
        update: mock(() => Promise.resolve(clientNoImage)),
      },
    }));
    mockUploadInfra(true);

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.deleteProfileImage("client-1", "user-1");

    expect(result.profileImageKey).toBeNull();
  });

  it("deve lançar 404 quando cliente não encontrado", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(null)),
      },
    }));

    const { ClientService: CS } = await import("../client.service");

    await expectElysiaError(
      CS.deleteProfileImage("nao-existe", "user-1"),
      Errors.CLIENT.NOT_FOUND.message,
      Errors.CLIENT.NOT_FOUND.httpStatus,
    );
  });

  it("deve lançar 404 quando cliente não tem foto de perfil", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(mockClient)), // profileImageKey: null
      },
    }));

    const { ClientService: CS } = await import("../client.service");

    await expectElysiaError(
      CS.deleteProfileImage("client-1", "user-1"),
      Errors.CLIENT.PROFILE_IMAGE_NOT_FOUND.message,
      Errors.CLIENT.PROFILE_IMAGE_NOT_FOUND.httpStatus,
    );
  });

  it("deve limpar o banco mesmo se R2 falhar", async () => {
    const clientWithImage = { ...mockClient, profileImageKey: "profile/user-1/abc.jpg" };
    const clientNoImage = { ...mockClient, profileImageKey: null };

    mock.module("../client.repository", () => ({
      ClientRepository: {
        findById: mock(() => Promise.resolve(clientWithImage)),
        update: mock(() => Promise.resolve(clientNoImage)),
      },
    }));
    mockUploadInfra(false); // R2 vai falhar

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.deleteProfileImage("client-1", "user-1");
    expect(result.profileImageKey).toBeNull();
  });
});

describe("ClientService — profileImageKey", () => {
  it("deve criar cliente com profileImageKey", async () => {
    const clientWithImage = {
      ...mockClient,
      profileImageKey: "profile/user-1/abc123-avatar.jpg",
    };
    const createMock = mock(() => Promise.resolve(clientWithImage));

    mock.module("../client.repository", () => ({
      ClientRepository: {
        create: createMock,
      },
    }));

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.create("user-1", {
      name: "Ana Silva",
      phone: "11999999999",
      profileImageKey: "profile/user-1/abc123-avatar.jpg",
    });

    expect(result.profileImageKey).toBe("profile/user-1/abc123-avatar.jpg");
    expect(createMock).toHaveBeenCalledWith("user-1", {
      name: "Ana Silva",
      phone: "11999999999",
      email: undefined,
      instagram: undefined,
      cpf: undefined,
      address: undefined,
      age: undefined,
      gender: undefined,
      notes: undefined,
      profileImageKey: "profile/user-1/abc123-avatar.jpg",
    });
  });

  it("deve criar cliente sem profileImageKey (campo opcional)", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        create: mock(() => Promise.resolve(mockClient)),
      },
    }));

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.create("user-1", {
      name: "Ana Silva",
      phone: "11999999999",
    });

    expect(result.profileImageKey).toBeNull();
  });

  it("deve atualizar cliente removendo a foto de perfil", async () => {
    const clientNoImage = { ...mockClient, profileImageKey: null };
    const updateMock = mock(() => Promise.resolve(clientNoImage));

    mock.module("../client.repository", () => ({
      ClientRepository: {
        update: updateMock,
      },
    }));

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.update("client-1", "user-1", { profileImageKey: null });

    expect(result.profileImageKey).toBeNull();
    expect(updateMock).toHaveBeenCalledWith("client-1", "user-1", {
      name: undefined,
      phone: undefined,
      email: undefined,
      instagram: undefined,
      cpf: undefined,
      address: undefined,
      age: undefined,
      gender: undefined,
      notes: undefined,
      profileImageKey: null,
    });
  });
});

describe("ClientService.search", () => {
  it("deve retornar clientes filtrados por nome", async () => {
    const searchResult = [
      {
        id: "client-1",
        name: "Ana Silva",
        phone: "11999999999",
        email: null,
        instagram: null,
        profileImageKey: null,
      },
    ];

    mock.module("../client.repository", () => ({
      ClientRepository: {
        search: mock(() => Promise.resolve(searchResult)),
      },
    }));

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.search("user-1", "Ana");

    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Ana Silva");
  });

  it("deve retornar lista vazia quando nenhum resultado", async () => {
    mock.module("../client.repository", () => ({
      ClientRepository: {
        search: mock(() => Promise.resolve([])),
      },
    }));

    const { ClientService: CS } = await import("../client.service");
    const result = await CS.search("user-1", "xyz");

    expect(result).toHaveLength(0);
  });
});
