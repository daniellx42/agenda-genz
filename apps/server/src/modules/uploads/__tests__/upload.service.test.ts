import { beforeEach, describe, expect, it, mock } from "bun:test";
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

// ─── Shared mock setup ───────────────────────────────────────────────────────

function mockEnv() {
  mock.module("@agenda-genz/env/server", () => ({
    env: {
      CLOUDFLARE_BUCKET: "appointmentsimages",
      CLOUDFLARE_ENDPOINT: "https://test.r2.example.com",
      CLOUDFLARE_ACCESS_KEY_ID: "test-key",
      CLOUDFLARE_SECRET_ACCESS_KEY: "test-secret",
    },
  }));
}

function mockS3(url = "https://r2.example.com/signed-url") {
  mock.module("@aws-sdk/s3-request-presigner", () => ({
    getSignedUrl: mock(() => Promise.resolve(url)),
  }));
  mock.module("../../../shared/lib/cloudeflare", () => ({
    cloudflareR2: {},
  }));
}

// ─── Reset mocks before each test ────────────────────────────────────────────

beforeEach(() => {
  mock.restore();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("UploadService.generatePutUrl", () => {
  it("deve retornar uploadUrl e key para imagem jpeg válida", async () => {
    mockEnv();
    mockS3("https://r2.example.com/signed-put-url");

    const { UploadService } = await import("../upload.service");
    const result = await UploadService.generatePutUrl("user-1", {
      folder: "services",
      filename: "minha-foto.jpg",
      contentType: "image/jpeg",
    });

    expect(result.uploadUrl).toBe("https://r2.example.com/signed-put-url");
    expect(result.key).toMatch(/^services\/user-1\/[a-f0-9-]+-minha-foto\.jpg$/);
  });

  it("deve retornar uploadUrl e key para imagem png na pasta profile", async () => {
    mockEnv();
    mockS3();

    const { UploadService } = await import("../upload.service");
    const result = await UploadService.generatePutUrl("user-1", {
      folder: "profile",
      filename: "avatar.png",
      contentType: "image/png",
    });

    expect(result.key).toMatch(/^profile\/user-1\//);
    expect(result.uploadUrl).toContain("https://");
  });

  it("deve gerar key com uuid único a cada chamada", async () => {
    mockEnv();
    mockS3();

    const { UploadService } = await import("../upload.service");
    const [r1, r2] = await Promise.all([
      UploadService.generatePutUrl("user-1", {
        folder: "services",
        filename: "foto.jpg",
        contentType: "image/jpeg",
      }),
      UploadService.generatePutUrl("user-1", {
        folder: "services",
        filename: "foto.jpg",
        contentType: "image/jpeg",
      }),
    ]);

    expect(r1.key).not.toBe(r2.key);
  });

  it("deve lançar 400 para tipo de arquivo não-imagem (application/pdf)", async () => {
    mockEnv();

    const { UploadService } = await import("../upload.service");

    await expectElysiaError(
      UploadService.generatePutUrl("user-1", {
        folder: "services",
        filename: "documento.pdf",
        contentType: "application/pdf",
      }),
      Errors.UPLOAD.INVALID_TYPE.message,
      Errors.UPLOAD.INVALID_TYPE.httpStatus,
    );
  });

  it("deve lançar 400 para tipo text/plain", async () => {
    mockEnv();

    const { UploadService } = await import("../upload.service");

    await expectElysiaError(
      UploadService.generatePutUrl("user-1", {
        folder: "services",
        filename: "texto.txt",
        contentType: "text/plain",
      }),
      Errors.UPLOAD.INVALID_TYPE.message,
      Errors.UPLOAD.INVALID_TYPE.httpStatus,
    );
  });

  it("deve sanitizar o nome do arquivo para remover caracteres especiais", async () => {
    mockEnv();
    mockS3();

    const { UploadService } = await import("../upload.service");
    const result = await UploadService.generatePutUrl("user-1", {
      folder: "services",
      filename: "minha foto bonita!@#$.jpg",
      contentType: "image/jpeg",
    });

    expect(result.key).not.toContain(" ");
    expect(result.key).not.toContain("!");
    expect(result.key).not.toContain("@");
  });

  it("deve aceitar image/heic para fotos de iPhone", async () => {
    mockEnv();
    mockS3();

    const { UploadService } = await import("../upload.service");
    const result = await UploadService.generatePutUrl("user-1", {
      folder: "services",
      filename: "foto.heic",
      contentType: "image/heic",
    });

    expect(result.key).toMatch(/^services\/user-1\//);
  });
});

describe("UploadService.deleteObject", () => {
  it("deve deletar objeto do R2 para key válida (services)", async () => {
    mockEnv();
    const sendMock = mock(() => Promise.resolve({}));
    mock.module("../../../shared/lib/cloudeflare", () => ({
      cloudflareR2: { send: sendMock },
    }));

    const { UploadService } = await import("../upload.service");
    await UploadService.deleteObject("user-1", "services/user-1/abc123-foto.jpg");

    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("deve deletar objeto do R2 para key válida (profile)", async () => {
    mockEnv();
    const sendMock = mock(() => Promise.resolve({}));
    mock.module("../../../shared/lib/cloudeflare", () => ({
      cloudflareR2: { send: sendMock },
    }));

    const { UploadService } = await import("../upload.service");
    await UploadService.deleteObject("user-1", "profile/user-1/abc123-avatar.jpg");

    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("deve lançar 403 para key de outro usuário", async () => {
    mockEnv();

    const { UploadService } = await import("../upload.service");

    await expectElysiaError(
      UploadService.deleteObject("user-1", "services/user-2/abc-foto.jpg"),
      Errors.UPLOAD.UNAUTHORIZED_KEY.message,
      Errors.UPLOAD.UNAUTHORIZED_KEY.httpStatus,
    );
  });
});

describe("UploadService.generateGetUrl", () => {
  it("deve retornar url para key que pertence ao usuário (services)", async () => {
    mockEnv();
    mockS3("https://r2.example.com/signed-get-url");

    const { UploadService } = await import("../upload.service");
    const result = await UploadService.generateGetUrl(
      "user-1",
      "services/user-1/abc123-foto.jpg",
    );

    expect(result.url).toBe("https://r2.example.com/signed-get-url");
  });

  it("deve retornar url para key que pertence ao usuário (profile)", async () => {
    mockEnv();
    mockS3("https://r2.example.com/get-url");

    const { UploadService } = await import("../upload.service");
    const result = await UploadService.generateGetUrl(
      "user-1",
      "profile/user-1/abc123-avatar.jpg",
    );

    expect(result.url).toContain("https://");
  });

  it("deve lançar 403 para key de outro usuário", async () => {
    mockEnv();

    const { UploadService } = await import("../upload.service");

    await expectElysiaError(
      UploadService.generateGetUrl("user-1", "services/user-2/abc123-foto.jpg"),
      Errors.UPLOAD.UNAUTHORIZED_KEY.message,
      Errors.UPLOAD.UNAUTHORIZED_KEY.httpStatus,
    );
  });

  it("deve lançar 403 para key com formato inválido", async () => {
    mockEnv();

    const { UploadService } = await import("../upload.service");

    await expectElysiaError(
      UploadService.generateGetUrl("user-1", "../../etc/passwd"),
      Errors.UPLOAD.UNAUTHORIZED_KEY.message,
      Errors.UPLOAD.UNAUTHORIZED_KEY.httpStatus,
    );
  });

  it("deve lançar 403 para key que começa com prefixo correto mas pertence a outro usuário", async () => {
    mockEnv();

    const { UploadService } = await import("../upload.service");

    // services/user-1extra/... não pertence a user-1
    await expectElysiaError(
      UploadService.generateGetUrl("user-1", "services/user-1extra/abc-foto.jpg"),
      Errors.UPLOAD.UNAUTHORIZED_KEY.message,
      Errors.UPLOAD.UNAUTHORIZED_KEY.httpStatus,
    );
  });
});
