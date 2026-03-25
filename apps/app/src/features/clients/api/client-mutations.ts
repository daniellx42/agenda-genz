import { api } from "@/lib/api";
import {
  throwIfApiError,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";

interface CreateClientInput {
  name: string;
  phone: string;
  email?: string;
  instagram?: string;
  cpf?: string;
  address?: string;
  birthDate?: string;
  gender?: "FEMALE" | "MALE" | "OTHER";
  notes?: string;
  profileImageKey?: string;
}

interface UpdateClientInput {
  name?: string;
  phone?: string;
  email?: string | null;
  instagram?: string | null;
  cpf?: string | null;
  address?: string | null;
  birthDate?: string | null;
  gender?: "FEMALE" | "MALE" | "OTHER" | null;
  notes?: string | null;
  profileImageKey?: string | null;
}

export async function createClient(
  input: CreateClientInput,
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.clients.post(input);
  throwIfApiError(error, handleError);
}

export async function updateClient(
  clientId: string,
  input: UpdateClientInput,
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.clients({ id: clientId }).put(input);
  throwIfApiError(error, handleError);
}

export async function deleteClient(
  clientId: string,
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.clients({ id: clientId }).delete();
  throwIfApiError(error, handleError);
}

export async function deleteClientProfileImage(
  clientId: string,
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api.clients({ id: clientId })["profile-image"].delete();
  throwIfApiError(error, handleError);
}

export async function updateClientProfileImage(
  input: { clientId: string; profileImageKey: string },
  handleError?: ApiErrorHandler,
) {
  await updateClient(
    input.clientId,
    { profileImageKey: input.profileImageKey },
    handleError,
  );
}
