"use server";

import { Prisma } from "@/generated/utm-client/client";
import { authClient } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/roles";
import {
  buildDashboardExcelDocument,
  createTrackingLink,
  getDashboardData,
  listTrackingLinks,
  runAggregateRefresh,
  type CreateTrackingLinkInput,
  type DashboardQueryInput,
  type ListTrackingLinksInput,
  type ListTrackingLinksResult,
} from "@/lib/utm/service";
import type { UtmDashboardData } from "@/lib/utm/types";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { ZodError } from "zod";

type ActionErrorResult = {
  ok: false;
  message: string;
};

type ActionSuccessResult<T> = {
  ok: true;
  data: T;
};

export type DashboardActionResult = ActionSuccessResult<UtmDashboardData> | ActionErrorResult;

export type AggregateRefreshActionResult =
  | ActionSuccessResult<{
    processedVisits: number;
    processedEvents: number;
    generatedAt: string;
  }>
  | ActionErrorResult;

export type CreateTrackingLinkActionResult =
  | ActionSuccessResult<{
    publicUrl: string;
  }>
  | ActionErrorResult;

export type ExportDashboardActionResult =
  | ActionSuccessResult<{
    content: string;
    fileName: string;
    mimeType: string;
  }>
  | ActionErrorResult;

export async function loadDashboardAction(input?: DashboardQueryInput): Promise<DashboardActionResult> {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session) {
    return {
      ok: false,
      message: "Sessão não encontrada.",
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      ok: false,
      message: "Acesso negado.",
    };
  }

  try {
    return {
      ok: true,
      data: await getDashboardData(input),
    };
  } catch {
    return {
      ok: false,
      message: "Nao foi possivel carregar os dados da UTM.",
    };
  }
}

export async function refreshAggregateAction(): Promise<AggregateRefreshActionResult> {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session) {
    return {
      ok: false,
      message: "Sessão não encontrada.",
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      ok: false,
      message: "Acesso negado.",
    };
  }

  try {
    const result = await runAggregateRefresh();

    revalidatePath("/admin");
    revalidatePath("/admin/utm");

    return {
      ok: true,
      data: result,
    };
  } catch {
    return {
      ok: false,
      message: "Nao foi possivel atualizar o aggregate.",
    };
  }
}

export async function createTrackingLinkAction(
  input: CreateTrackingLinkInput,
): Promise<CreateTrackingLinkActionResult> {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session) {
    return {
      ok: false,
      message: "Sessão não encontrada.",
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      ok: false,
      message: "Acesso negado.",
    };
  }

  try {
    const link = await createTrackingLink(input);

    revalidatePath("/admin");
    revalidatePath("/admin/utm");

    return {
      ok: true,
      data: {
        publicUrl: link.publicUrl,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        message: error.issues[0]?.message ?? "Dados invalidos.",
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return {
        ok: false,
        message: "Esse slug ja esta em uso.",
      };
    }

    return {
      ok: false,
      message: "Nao foi possivel criar a URL personalizada.",
    };
  }
}

export async function exportDashboardAction(input?: DashboardQueryInput): Promise<ExportDashboardActionResult> {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session) {
    return {
      ok: false,
      message: "Sessão não encontrada.",
    };
  }

  if (!isAdminRole(session.user.role)) {
    return {
      ok: false,
      message: "Acesso negado.",
    };
  }

  try {
    const mode = input?.mode === "realtime" ? "realtime" : "aggregate";

    return {
      ok: true,
      data: {
        content: await buildDashboardExcelDocument(input),
        fileName: `utm-report-${mode}.xls`,
        mimeType: "application/vnd.ms-excel; charset=utf-8",
      },
    };
  } catch {
    return {
      ok: false,
      message: "Nao foi possivel exportar o relatorio.",
    };
  }
}

export type ListTrackingLinksActionResult =
  | ActionSuccessResult<ListTrackingLinksResult>
  | ActionErrorResult;

export async function listTrackingLinksAction(
  input?: ListTrackingLinksInput,
): Promise<ListTrackingLinksActionResult> {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session) {
    return { ok: false, message: "Sessão não encontrada." };
  }

  if (!isAdminRole(session.user.role)) {
    return { ok: false, message: "Acesso negado." };
  }

  try {
    return { ok: true, data: await listTrackingLinks(input) };
  } catch {
    return { ok: false, message: "Não foi possível listar as URLs." };
  }
}
