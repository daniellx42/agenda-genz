import { useForm } from "@tanstack/react-form";
import type { ClientFormValues } from "../lib/client-form-schema";

interface UseClientFormOptions {
  defaultValues: ClientFormValues;
  onSubmit: (props: { value: ClientFormValues }) => Promise<void> | void;
}

export function useClientForm({
  defaultValues,
  onSubmit,
}: UseClientFormOptions) {
  return useForm({
    defaultValues,
    onSubmit,
  });
}

export type ClientFormApi = ReturnType<typeof useClientForm>;
