import { api } from "@/lib/api";
import {
  throwIfApiError,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";

interface CreateServiceInput {
  name: string;
  description?: string;
  price: number;
  depositPercentage?: number;
  emoji?: string;
  color?: string;
}

export async function createService(
  input: CreateServiceInput,
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.services.post(input);
  throwIfApiError(error, handleError);
}

interface UpdateServiceInput {
  id: string;
  name?: string;
  description?: string | null;
  price?: number;
  depositPercentage?: number | null;
  emoji?: string | null;
  color?: string | null;
  active?: boolean;
}

export async function updateService(
  input: UpdateServiceInput,
  handleError?: ApiErrorHandler,
) {
  const { id, ...payload } = input;
  const { error } = await api.api.services({ id }).put(payload);
  throwIfApiError(error, handleError);
}

export async function deleteService(
  id: string,
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.services({ id }).delete();
  throwIfApiError(error, handleError);
}

export async function updateServiceStatus(
  input: { id: string; active: boolean },
  handleError?: ApiErrorHandler,
) {
  return updateService(
    { id: input.id, active: input.active },
    handleError,
  );
}
