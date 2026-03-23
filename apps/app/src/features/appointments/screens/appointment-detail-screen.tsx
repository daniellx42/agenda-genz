import { ConfirmActionSheet } from "@/components/ui/confirm-action-sheet";
import { SelectionSheet } from "@/components/ui/selection-sheet";
import { SkeletonBox } from "@/components/ui/skeleton-box";
import { SquareImageCropModal } from "@/components/ui/square-image-crop-modal";
import { openWhatsApp } from "@/features/clients/lib/client-whatsapp";
import { useApiError } from "@/hooks/use-api-error";
import { useSquareImagePicker } from "@/hooks/use-square-image-picker";
import type { ApiErrorObject } from "@/lib/api/query-utils";
import { cancelAppointmentReminders } from "@/lib/notifications";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { toast } from "sonner-native";
import { deleteAppointment } from "../api/appointment-mutations";
import {
  appointmentDetailQueryOptions,
  appointmentKeys,
} from "../api/appointment-query-options";
import { AppointmentCardSkeleton } from "../components/appointment-card-skeleton";
import { AppointmentClientCard } from "../components/appointment-client-card";
import { AppointmentDetailHeader } from "../components/appointment-detail-header";
import { AppointmentImageViewerModal } from "../components/appointment-image-viewer-modal";
import { AppointmentMessageShareCard } from "../components/appointment-message-share-card";
import { AppointmentMessageShareSheet } from "../components/appointment-message-share-sheet";
import { AppointmentNotesCard } from "../components/appointment-notes-card";
import { AppointmentServiceCard } from "../components/appointment-service-card";
import { AppointmentStatusCard } from "../components/appointment-status-card";
import { AppointmentStatusSelectionSheet } from "../components/appointment-status-selection-sheet";
import { AppointmentWorkImagesCard } from "../components/appointment-work-images-card";
import {
  APPOINTMENT_PAYMENT_STATUS_CONFIG,
  APPOINTMENT_SERVICE_STATUS_CONFIG,
  type AppointmentPaymentStatus,
  type AppointmentServiceStatus,
} from "../constants/appointment-status";
import { useAppointmentDetailMedia } from "../hooks/use-appointment-detail-media";
import { useAppointmentStatusActions } from "../hooks/use-appointment-status-actions";
import type { ImageSlot } from "../lib/appointment-images";
import { formatAppointmentDate } from "../lib/appointment-images";
import {
  buildAppointmentConfirmationMessage,
  buildAppointmentReminderMessage,
  getAppointmentCountdownLabel,
} from "../lib/appointment-share-messages";
import { formatAppointmentTimeWithPeriod } from "../lib/appointment-time";

type UploadSource = "camera" | "gallery";
type UploadTarget = { kind: "work"; slot: ImageSlot } | { kind: "profile" } | null;

export default function AppointmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { showError } = useApiError();
  const queryClient = useQueryClient();

  const handleDetailError = useCallback(
    (err: unknown) => {
      const status =
        typeof err === "object" && err !== null && "status" in err
          ? (err as ApiErrorObject).status
          : undefined;
      if (status === 404) return; // tratado no useEffect abaixo (redirect)
      showError(err);
    },
    [showError],
  );

  const {
    data: appointment,
    isLoading,
    isError,
    error,
  } = useQuery(appointmentDetailQueryOptions(id, handleDetailError));

  // 404 = agendamento já removido; redireciona sem toast de erro
  useEffect(() => {
    if (!isError || !error || !id) return;
    const status =
      typeof error === "object" && error !== null && "status" in error
        ? (error as ApiErrorObject).status
        : undefined;
    if (status !== 404) return;
    queryClient.removeQueries({ queryKey: appointmentKeys.detail(id) });
    toast.info("Agendamento não encontrado");
    router.replace("/appointments");
  }, [isError, error, id, queryClient, router]);

  const media = useAppointmentDetailMedia({
    appointmentId: id,
    appointment,
    showError,
  });
  const imagePicker = useSquareImagePicker();
  const uploadSourceSheetRef = useRef<BottomSheetModal>(null);
  const deleteAppointmentSheetRef = useRef<BottomSheetModal>(null);
  const deleteWorkImageSheetRef = useRef<BottomSheetModal>(null);
  const deleteProfileImageSheetRef = useRef<BottomSheetModal>(null);
  const confirmationShareSheetRef = useRef<BottomSheetModal>(null);
  const reminderShareSheetRef = useRef<BottomSheetModal>(null);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);
  const [confirmationDraftMessage, setConfirmationDraftMessage] = useState("");
  const [reminderDraftMessage, setReminderDraftMessage] = useState("");

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (appointmentId: string) => deleteAppointment(appointmentId),
    onSuccess: async (_, appointmentId) => {
      void cancelAppointmentReminders(appointmentId).catch(() => undefined);
      toast.success("Agendamento deletado com sucesso");
      await queryClient.invalidateQueries({
        queryKey: appointmentKeys.all,
        refetchType: "inactive",
      });
      router.replace("/appointments");
    },
    onError: showError,
  });

  const serviceStatus = (
    appointment?.status &&
      appointment.status in APPOINTMENT_SERVICE_STATUS_CONFIG
      ? appointment?.status
      : "PENDING"
  ) as AppointmentServiceStatus;
  const paymentStatus = (
    appointment?.paymentStatus === "PAID"
      ? "PAID"
      : appointment?.paymentStatus === "DEPOSIT_PAID"
        ? "DEPOSIT_PAID"
        : "PENDING"
  ) as AppointmentPaymentStatus;

  const {
    paymentSheetRef,
    serviceSheetRef,
    openPaymentSheet,
    openServiceSheet,
    selectPaymentStatus,
    selectServiceStatus,
    updatingPaymentStatus,
    updatingServiceStatus,
    isUpdatingPayment,
    isUpdatingService,
  } = useAppointmentStatusActions({
    appointmentId: id ?? "",
    appointmentDate: appointment?.date,
    appointmentTime: appointment?.timeSlot.time,
    paymentStatus,
    serviceStatus,
  });

  const handleOpenWorkUploadSheet = (slot: ImageSlot) => {
    setUploadTarget({ kind: "work", slot });
    uploadSourceSheetRef.current?.present();
  };

  const handleOpenProfileUploadSheet = () => {
    setUploadTarget({ kind: "profile" });
    uploadSourceSheetRef.current?.present();
  };

  const handleRequestDeleteWorkImage = (slot: ImageSlot) => {
    media.requestDeleteImage(slot);
    deleteWorkImageSheetRef.current?.present();
  };

  const handleRequestDeleteProfileImage = () => {
    media.requestDeleteProfileImage();
    deleteProfileImageSheetRef.current?.present();
  };

  const handleRequestDeleteAppointment = () => {
    deleteAppointmentSheetRef.current?.present();
  };

  const handleSelectUploadSource = async (source: UploadSource) => {
    const currentTarget = uploadTarget;
    if (!currentTarget) return;

    uploadSourceSheetRef.current?.dismiss();

    const asset = await imagePicker.pickSquareImage(source, {
      title:
        currentTarget.kind === "profile"
          ? "Ajustar foto de perfil"
          : currentTarget.slot === "before"
            ? "Ajustar foto do antes"
            : "Ajustar foto do depois",
      description:
        currentTarget.kind === "profile"
          ? "Enquadre a foto para o perfil ficar bonito e consistente no app."
          : "Ajuste a imagem para destacar melhor o resultado do atendimento.",
      confirmLabel:
        currentTarget.kind === "profile" ? "Usar foto" : "Salvar recorte",
      quality: currentTarget.kind === "profile" ? 0.8 : 0.85,
    });

    if (!asset) {
      setUploadTarget(null);
      return;
    }

    if (currentTarget.kind === "work") {
      await media.uploadWorkImage(currentTarget.slot, asset);
      setUploadTarget(null);
      return;
    }

    await media.uploadProfileImage(asset);
    setUploadTarget(null);
  };

  const uploadSheetTitle =
    uploadTarget === null
      ? "Selecionar imagem"
      : uploadTarget.kind === "profile"
        ? "Foto de perfil"
        : uploadTarget.slot === "before"
          ? "Foto do antes"
          : "Foto do depois";

  const appointmentId = appointment?.id ?? null;
  const appointmentClientName = appointment?.client.name ?? "";
  const appointmentClientPhone = appointment?.client.phone ?? "";
  const appointmentServiceName = appointment?.service.name ?? "";
  const appointmentDate = appointment?.date ?? "";
  const appointmentTime = appointment?.timeSlot.time ?? "";
  const appointmentNotes = appointment?.notes ?? null;
  const formattedAppointmentDate = appointment
    ? formatAppointmentDate(appointmentDate)
    : "";
  const countdownLabel = appointment
    ? getAppointmentCountdownLabel({
        date: appointmentDate,
        time: appointmentTime,
      })
    : null;
  const createConfirmationMessage = useCallback(
    () => {
      if (!appointment) return "";

      return buildAppointmentConfirmationMessage({
        clientName: appointmentClientName,
        serviceName: appointmentServiceName,
        date: appointmentDate,
        time: appointmentTime,
        serviceStatus,
        paymentStatus,
        notes: appointmentNotes,
      });
    },
    [
      appointment,
      appointmentClientName,
      appointmentDate,
      appointmentNotes,
      appointmentServiceName,
      appointmentTime,
      paymentStatus,
      serviceStatus,
    ],
  );
  const createReminderMessage = useCallback(
    () => {
      if (!appointment) return "";

      return buildAppointmentReminderMessage({
        clientName: appointmentClientName,
        serviceName: appointmentServiceName,
        date: appointmentDate,
        time: appointmentTime,
        serviceStatus,
        paymentStatus,
        notes: appointmentNotes,
      });
    },
    [
      appointment,
      appointmentClientName,
      appointmentDate,
      appointmentNotes,
      appointmentServiceName,
      appointmentTime,
      paymentStatus,
      serviceStatus,
    ],
  );
  const hasClientPhone = appointmentClientPhone.trim().length > 0;
  const handleDismissConfirmationShareSheet = useCallback(() => {
    setConfirmationDraftMessage("");
  }, []);
  const handleDismissReminderShareSheet = useCallback(() => {
    setReminderDraftMessage("");
  }, []);

  useEffect(() => {
    setConfirmationDraftMessage("");
    setReminderDraftMessage("");
    confirmationShareSheetRef.current?.dismiss();
    reminderShareSheetRef.current?.dismiss();
  }, [appointmentId]);

  const openConfirmationShareSheet = useCallback(() => {
    if (!appointment) return;
    setConfirmationDraftMessage(createConfirmationMessage());
    confirmationShareSheetRef.current?.present();
  }, [appointment, createConfirmationMessage]);

  const openReminderShareSheet = useCallback(() => {
    if (!appointment) return;
    setReminderDraftMessage(createReminderMessage());
    reminderShareSheetRef.current?.present();
  }, [appointment, createReminderMessage]);

  const handleShareViaWhatsApp = useCallback(
    async (sheet: "confirmation" | "reminder", message: string) => {
      if (sheet === "confirmation") {
        confirmationShareSheetRef.current?.dismiss();
      } else {
        reminderShareSheetRef.current?.dismiss();
      }

      await openWhatsApp(appointmentClientPhone, message);
    },
    [appointmentClientPhone],
  );

  const handleShareNative = useCallback(
    async (sheet: "confirmation" | "reminder", message: string) => {
      if (sheet === "confirmation") {
        confirmationShareSheetRef.current?.dismiss();
      } else {
        reminderShareSheetRef.current?.dismiss();
      }

      try {
        await Share.share({ message });
      } catch (error) {
        showError(error);
      }
    },
    [showError],
  );

  if (isLoading || !appointment) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
        <AppointmentDetailHeader onBack={() => router.back()} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        >
          <View className="mb-4 rounded-2xl border border-rose-100 bg-white p-4">
            <View className="flex-row items-center gap-3">
              <SkeletonBox style={{ width: 56, height: 56, borderRadius: 28 }} />
              <View className="flex-1">
                <SkeletonBox style={{ width: "52%", height: 16 }} />
                <SkeletonBox style={{ marginTop: 8, width: "38%", height: 12 }} />
              </View>
            </View>
          </View>

          <AppointmentCardSkeleton />

          {Array.from({ length: 5 }).map((_, index) => (
            <View
              key={index}
              className="mb-4 rounded-2xl border border-rose-100 bg-white p-4"
            >
              <SkeletonBox style={{ width: 120, height: 16 }} />
              <SkeletonBox style={{ marginTop: 12, width: "82%", height: 14 }} />
              <SkeletonBox style={{ marginTop: 8, width: "58%", height: 14 }} />
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff9fb" }}>
      <AppointmentDetailHeader onBack={() => router.back()} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
      >
        <AppointmentClientCard
          name={appointment.client.name}
          phone={appointment.client.phone}
          profileImageUrl={media.profileImageUrl}
          profileImageKey={appointment.client.profileImageKey}
          uploading={media.uploadingProfileImage}
          deleting={media.deletingProfileImage}
          onProfileAction={
            media.profileImageUrl
              ? handleRequestDeleteProfileImage
              : handleOpenProfileUploadSheet
          }
        />

        <AppointmentWorkImagesCard
          beforeImageUrl={media.beforeImageUrl}
          afterImageUrl={media.afterImageUrl}
          beforeImageKey={appointment.beforeImageKey}
          afterImageKey={appointment.afterImageKey}
          uploadingSlot={media.uploadingSlot}
          deletingSlot={media.deletingSlot}
          onUpload={handleOpenWorkUploadSheet}
          onOpenViewer={media.openViewer}
          onDelete={handleRequestDeleteWorkImage}
        />

        <AppointmentServiceCard
          imageKey={appointment.service.imageKey}
          color={appointment.service.color}
          name={appointment.service.name}
          price={appointment.service.price}
          depositPercentage={appointment.service.depositPercentage}
          formattedDate={formattedAppointmentDate}
          time={appointment.timeSlot.time}
        />

        <AppointmentMessageShareCard
          title="Confirmação do agendamento"
          description="Compartilhe uma mensagem pronta com os dados do agendamento e os status atuais."
          onPress={openConfirmationShareSheet}
        />

        <AppointmentMessageShareCard
          title="Lembrete do atendimento"
          description="Envie um aviso automático dizendo que o atendimento está próximo e quanto tempo falta."
          highlightLabel={countdownLabel ? `Faltam ${countdownLabel}` : null}
          onPress={openReminderShareSheet}
        />

        {appointment.notes ? (
          <AppointmentNotesCard notes={appointment.notes} />
        ) : null}

        <AppointmentStatusCard
          title="Status do pagamento"
          description="Mostra se o valor deste agendamento já foi recebido."
          statusConfig={APPOINTMENT_PAYMENT_STATUS_CONFIG[paymentStatus]}
          loading={isUpdatingPayment}
          onPress={openPaymentSheet}
        />

        <AppointmentStatusCard
          title="Status do serviço"
          description="Controla o andamento do atendimento para você e para a agenda."
          statusConfig={APPOINTMENT_SERVICE_STATUS_CONFIG[serviceStatus]}
          loading={isUpdatingService}
          onPress={openServiceSheet}
        />

        <Pressable
          onPress={handleRequestDeleteAppointment}
          disabled={deleteAppointmentMutation.isPending}
          className="mb-4 flex-row items-center gap-4 rounded-3xl bg-red-50 px-4 py-4 active:opacity-80"
          style={{ opacity: deleteAppointmentMutation.isPending ? 0.7 : 1 }}
        >
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
            {deleteAppointmentMutation.isPending ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Feather name="trash-2" size={18} color="#ef4444" />
            )}
          </View>

          <View className="flex-1">
            <Text className="text-base font-semibold text-red-600">
              Deletar agendamento
            </Text>
            <Text className="mt-1 text-sm leading-5 text-red-500">
              Remove este agendamento da agenda, excluindo todas as informações relacionadas a ele, como fotos e histórico de status.
            </Text>
          </View>

          <Feather name="chevron-right" size={18} color="#f87171" />
        </Pressable>
      </ScrollView>

      <AppointmentStatusSelectionSheet
        kind="payment"
        sheetRef={paymentSheetRef}
        currentStatus={paymentStatus}
        updatingStatus={updatingPaymentStatus}
        onSelect={selectPaymentStatus}
      />

      <AppointmentStatusSelectionSheet
        kind="service"
        sheetRef={serviceSheetRef}
        currentStatus={serviceStatus}
        updatingStatus={updatingServiceStatus}
        onSelect={selectServiceStatus}
      />

      <AppointmentMessageShareSheet
        key={`confirmation-share-sheet-${appointment.id}`}
        sheetRef={confirmationShareSheetRef}
        title="Confirmação do agendamento"
        description="Compartilhe uma mensagem pronta com os dados do agendamento e os status atuais."
        clientName={appointment.client.name}
        message={confirmationDraftMessage}
        onChangeMessage={setConfirmationDraftMessage}
        serviceName={appointment.service.name}
        formattedDate={formattedAppointmentDate}
        time={appointment.timeSlot.time}
        paymentStatusConfig={APPOINTMENT_PAYMENT_STATUS_CONFIG[paymentStatus]}
        serviceStatusConfig={APPOINTMENT_SERVICE_STATUS_CONFIG[serviceStatus]}
        disableWhatsApp={!hasClientPhone}
        onDismiss={handleDismissConfirmationShareSheet}
        onShareWhatsApp={() =>
          void handleShareViaWhatsApp("confirmation", confirmationDraftMessage)
        }
        onShareMore={() =>
          void handleShareNative("confirmation", confirmationDraftMessage)
        }
      />

      <AppointmentMessageShareSheet
        key={`reminder-share-sheet-${appointment.id}`}
        sheetRef={reminderShareSheetRef}
        title="Lembrete do atendimento"
        description="Envie um aviso automático dizendo que o atendimento está próximo e quanto tempo falta."
        clientName={appointment.client.name}
        message={reminderDraftMessage}
        onChangeMessage={setReminderDraftMessage}
        serviceName={appointment.service.name}
        formattedDate={formattedAppointmentDate}
        time={appointment.timeSlot.time}
        paymentStatusConfig={APPOINTMENT_PAYMENT_STATUS_CONFIG[paymentStatus]}
        serviceStatusConfig={APPOINTMENT_SERVICE_STATUS_CONFIG[serviceStatus]}
        highlightLabel={countdownLabel ? `Faltam ${countdownLabel}` : null}
        disableWhatsApp={!hasClientPhone}
        onDismiss={handleDismissReminderShareSheet}
        onShareWhatsApp={() =>
          void handleShareViaWhatsApp("reminder", reminderDraftMessage)
        }
        onShareMore={() => void handleShareNative("reminder", reminderDraftMessage)}
      />

      <SelectionSheet
        sheetRef={uploadSourceSheetRef}
        title={uploadSheetTitle}
        description="Escolha a origem da imagem para manter o padrão visual do atendimento."
        onClose={() => setUploadTarget(null)}
        onSelect={handleSelectUploadSource}
        options={[
          {
            value: "camera",
            title: "Usar camera",
            description: "Tire a foto agora e envie direto para o agendamento.",
            icon: <Feather name="camera" size={18} color="#f43f5e" />,
          },
          {
            value: "gallery",
            title: "Escolher da galeria",
            description: "Selecione uma imagem que já está no dispositivo.",
            icon: <Feather name="image" size={18} color="#f43f5e" />,
          },
        ]}
      />

      <ConfirmActionSheet
        sheetRef={deleteAppointmentSheetRef}
        title="Deletar agendamento"
        description={`Tem certeza que deseja deletar este agendamento de ${appointment.service.name} em ${formatAppointmentDate(appointment.date)} às ${formatAppointmentTimeWithPeriod(appointment.timeSlot.time)}?`}
        confirmLabel="Deletar agendamento"
        loading={deleteAppointmentMutation.isPending}
        onConfirm={() => {
          if (!id) return;
          deleteAppointmentMutation.mutate(id);
        }}
      />

      <ConfirmActionSheet
        sheetRef={deleteWorkImageSheetRef}
        title="Remover imagem"
        description={
          media.pendingDeleteSlot
            ? `Tem certeza que deseja remover a foto "${media.pendingDeleteSlot === "before" ? "Antes" : "Depois"}"?`
            : "Tem certeza que deseja remover esta imagem?"
        }
        confirmLabel="Remover imagem"
        loading={media.deletingSlot !== null}
        onClose={media.clearPendingDeleteImage}
        onConfirm={() => {
          void media.confirmDeleteImage().then((success) => {
            if (success) {
              deleteWorkImageSheetRef.current?.dismiss();
            }
          });
        }}
      />

      <ConfirmActionSheet
        sheetRef={deleteProfileImageSheetRef}
        title="Remover foto"
        description="Tem certeza que deseja remover a foto de perfil?"
        confirmLabel="Remover foto"
        loading={media.deletingProfileImage}
        onClose={media.clearPendingDeleteProfileImage}
        onConfirm={() => {
          void media.confirmDeleteProfileImage().then((success) => {
            if (success) {
              deleteProfileImageSheetRef.current?.dismiss();
            }
          });
        }}
      />

      <AppointmentImageViewerModal
        visible={!!media.viewerImageUrl}
        imageUrl={media.viewerImageUrl}
        imageCacheKey={media.viewerImageKey}
        label={media.viewerLabel}
        onClose={media.closeViewer}
      />
      <SquareImageCropModal {...imagePicker.cropperProps} />
    </SafeAreaView>
  );
}
