import {
  updateAppointmentPayment,
  updateAppointmentStatus,
} from "../api/appointment-mutations";
import { appointmentKeys } from "../api/appointment-query-options";
import { useApiError } from "@/hooks/use-api-error";
import {
  cancelAppointmentReminders,
  scheduleAppointmentReminders,
} from "@/lib/notifications";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner-native";
import type {
  AppointmentPaymentStatus,
  AppointmentServiceStatus,
} from "../constants/appointment-status";

interface UseAppointmentStatusActionsParams {
  appointmentId: string;
  appointmentDate?: string;
  appointmentTime?: string;
  paymentStatus: AppointmentPaymentStatus;
  serviceStatus: AppointmentServiceStatus;
}

export function useAppointmentStatusActions({
  appointmentId,
  appointmentDate,
  appointmentTime,
  paymentStatus,
  serviceStatus,
}: UseAppointmentStatusActionsParams) {
  const queryClient = useQueryClient();
  const { showError } = useApiError();
  const paymentSheetRef = useRef<BottomSheetModal>(null);
  const serviceSheetRef = useRef<BottomSheetModal>(null);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] =
    useState<AppointmentPaymentStatus | null>(null);
  const [updatingServiceStatus, setUpdatingServiceStatus] =
    useState<AppointmentServiceStatus | null>(null);

  const invalidateAppointments = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
  }, [queryClient]);

  const openPaymentSheet = useCallback(() => {
    paymentSheetRef.current?.present();
  }, []);

  const openServiceSheet = useCallback(() => {
    serviceSheetRef.current?.present();
  }, []);

  const selectPaymentStatus = useCallback(
    async (nextStatus: AppointmentPaymentStatus) => {
      if (!appointmentId) return;

      if (nextStatus === paymentStatus) {
        paymentSheetRef.current?.dismiss();
        return;
      }

      setUpdatingPaymentStatus(nextStatus);
      try {
        await updateAppointmentPayment({
          id: appointmentId,
          paymentStatus: nextStatus,
        });
        await invalidateAppointments();
        paymentSheetRef.current?.dismiss();
        toast.success(
          nextStatus === "PAID"
            ? "Pagamento total recebido"
            : nextStatus === "DEPOSIT_PAID"
              ? "Sinal recebido"
              : "Pagamento marcado como pendente",
        );
      } catch (error) {
        showError(error);
        paymentSheetRef.current?.dismiss();
      } finally {
        setUpdatingPaymentStatus(null);
      }
    },
    [appointmentId, invalidateAppointments, paymentStatus, showError],
  );

  const selectServiceStatus = useCallback(
    async (nextStatus: AppointmentServiceStatus) => {
      if (!appointmentId) return;

      if (nextStatus === serviceStatus) {
        serviceSheetRef.current?.dismiss();
        return;
      }

      setUpdatingServiceStatus(nextStatus);
      try {
        await updateAppointmentStatus({ id: appointmentId, status: nextStatus });

        if (nextStatus === "CANCELLED") {
          void cancelAppointmentReminders(appointmentId).catch(() => undefined);
        } else if (
          serviceStatus === "CANCELLED" &&
          appointmentDate &&
          appointmentTime
        ) {
          void scheduleAppointmentReminders(
            appointmentDate,
            appointmentTime,
            appointmentId,
          ).catch(() => undefined);
        }

        await invalidateAppointments();
        serviceSheetRef.current?.dismiss();
        toast.success("Status do serviço atualizado");
      } catch (error) {
        showError(error);
        serviceSheetRef.current?.dismiss();
      } finally {
        setUpdatingServiceStatus(null);
      }
    },
    [
      appointmentDate,
      appointmentId,
      appointmentTime,
      invalidateAppointments,
      serviceStatus,
      showError,
    ],
  );

  return {
    paymentSheetRef,
    serviceSheetRef,
    openPaymentSheet,
    openServiceSheet,
    selectPaymentStatus,
    selectServiceStatus,
    updatingPaymentStatus,
    updatingServiceStatus,
    isUpdatingPayment: updatingPaymentStatus !== null,
    isUpdatingService: updatingServiceStatus !== null,
  };
}
