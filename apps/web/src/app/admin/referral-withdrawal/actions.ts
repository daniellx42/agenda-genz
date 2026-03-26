"use server";

import { env } from "@agenda-genz/env/web";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { getAdminSession } from "@/lib/admin-session";

type ActionErrorResult = {
  ok: false;
  message: string;
};

type ActionSuccessResult<T> = {
  ok: true;
  data: T;
};

export type ReferralWithdrawalStatus =
  | "PENDING"
  | "PAID"
  | "REJECTED"
  | "CANCELLED";

export type ReferralPixKeyType = "CPF" | "PHONE" | "EMAIL" | "RANDOM";

export type ReferralWithdrawalListItem = {
  id: string;
  amountInCents: number;
  pixKey: string;
  pixKeyType: ReferralPixKeyType;
  status: ReferralWithdrawalStatus;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
};

export type ReferralWithdrawalListResponse = {
  items: ReferralWithdrawalListItem[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  status: ReferralWithdrawalStatus | null;
};

export type ListReferralWithdrawalsActionResult =
  | ActionSuccessResult<ReferralWithdrawalListResponse>
  | ActionErrorResult;

export type UpdateReferralWithdrawalStatusActionResult =
  | ActionSuccessResult<ReferralWithdrawalListItem>
  | ActionErrorResult;

async function getAdminApiHeaders(contentType?: string) {
  const requestHeaders = await headers();
  const nextHeaders = new Headers();
  const cookie = requestHeaders.get("cookie");

  if (cookie) {
    nextHeaders.set("cookie", cookie);
  }

  if (contentType) {
    nextHeaders.set("content-type", contentType);
  }

  return nextHeaders;
}

async function parseApiErrorMessage(response: Response) {
  const payload = await response.json().catch(() => null);

  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof payload.message === "string" &&
    payload.message.trim()
  ) {
    return payload.message;
  }

  return response.status === 403 ? "Acesso negado." : "Não foi possível concluir a operação.";
}

async function fetchAdminApi<T>(
  path: string,
  init?: RequestInit,
): Promise<ActionSuccessResult<T> | ActionErrorResult> {
  const session = await getAdminSession();

  if (!session) {
    return {
      ok: false,
      message: "Acesso negado.",
    };
  }

  const baseUrl = env.NEXT_PUBLIC_SERVER_URL.replace(/\/$/, "");

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: await getAdminApiHeaders(
        init?.body ? "application/json" : undefined,
      ),
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: await parseApiErrorMessage(response),
      };
    }

    return {
      ok: true,
      data: (await response.json()) as T,
    };
  } catch {
    return {
      ok: false,
      message: "Não foi possível conectar ao servidor.",
    };
  }
}

export async function listReferralWithdrawalsAction(input?: {
  page?: number;
  pageSize?: number;
  status?: ReferralWithdrawalStatus;
}): Promise<ListReferralWithdrawalsActionResult> {
  const searchParams = new URLSearchParams();

  if (input?.page) {
    searchParams.set("page", String(input.page));
  }

  if (input?.pageSize) {
    searchParams.set("pageSize", String(input.pageSize));
  }

  if (input?.status) {
    searchParams.set("status", input.status);
  }

  const query = searchParams.toString();

  return fetchAdminApi<ReferralWithdrawalListResponse>(
    `/api/referrals/admin/withdrawals${query ? `?${query}` : ""}`,
  );
}

export async function updateReferralWithdrawalStatusAction(input: {
  id: string;
  status: ReferralWithdrawalStatus;
}): Promise<UpdateReferralWithdrawalStatusActionResult> {
  const result = await fetchAdminApi<ReferralWithdrawalListItem>(
    `/api/referrals/admin/withdrawals/${input.id}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: input.status,
      }),
    },
  );

  if (result.ok) {
    revalidatePath("/admin/referral-withdrawal");
  }

  return result;
}
