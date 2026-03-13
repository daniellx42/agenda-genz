import { api } from "@/lib/api";
import {
  throwIfApiError,
  type ApiErrorHandler,
} from "@/lib/api/query-utils";

export async function createTimeSlot(
  input: { dayOfWeek: number; time: string },
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api["time-slots"].post(input);
  throwIfApiError(error, handleError);
}

export async function deleteTimeSlot(
  id: string,
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api["time-slots"]({ id }).delete();
  throwIfApiError(error, handleError);
}

export async function deactivateTimeSlot(
  id: string,
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api["time-slots"]({ id }).deactivate.patch();
  throwIfApiError(error, handleError);
}

export async function activateTimeSlot(
  id: string,
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api["time-slots"]({ id }).activate.patch();
  throwIfApiError(error, handleError);
}

export async function blockTimeSlotDate(
  input: { id: string; date: string },
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api["time-slots"]({ id: input.id }).blocks.post({
    date: input.date,
  });
  throwIfApiError(error, handleError);
}

export async function unblockTimeSlotDate(
  input: { id: string; date: string },
  handleError?: ApiErrorHandler,
) {
  const { error } = await api.api["time-slots"]({ id: input.id }).blocks.delete(
    {},
    {
      query: { date: input.date },
    },
  );
  throwIfApiError(error, handleError);
}
