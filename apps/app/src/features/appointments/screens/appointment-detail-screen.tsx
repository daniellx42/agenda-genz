import { ConfirmActionSheet } from "@/components/ui/confirm-action-sheet";
import { SelectionSheet } from "@/components/ui/selection-sheet";
import { SkeletonBox } from "@/components/ui/skeleton-box";
import { useApiError } from "@/hooks/use-api-error";
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
  const uploadSourceSheetRef = useRef<BottomSheetModal>(null);
  const deleteAppointmentSheetRef = useRef<BottomSheetModal>(null);
  const deleteWorkImageSheetRef = useRef<BottomSheetModal>(null);
  const deleteProfileImageSheetRef = useRef<BottomSheetModal>(null);
  const [uploadTarget, setUploadTarget] = useState<UploadTarget>(null);

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

          {Array.from({ length: 3 }).map((_, index) => (
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

    if (currentTarget.kind === "work") {
      await media.uploadWorkImageFromSource(currentTarget.slot, source);
      return;
    }

    await media.uploadProfileImageFromSource(source);
  };

  const uploadSheetTitle =
    uploadTarget === null
      ? "Selecionar imagem"
      : uploadTarget.kind === "profile"
        ? "Foto de perfil"
        : uploadTarget.slot === "before"
          ? "Foto do antes"
          : "Foto do depois";

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
          uploading={media.uploadingProfileImage}
          deleting={media.deletingProfileImage}
          onProfileAction={
            media.profileImageUrl
              ? handleRequestDeleteProfileImage
              : handleOpenProfileUploadSheet
          }
        />

        <AppointmentServiceCard
          emoji={appointment.service.emoji}
          name={appointment.service.name}
          price={appointment.service.price}
          depositPercentage={appointment.service.depositPercentage}
          formattedDate={formatAppointmentDate(appointment.date)}
          time={appointment.timeSlot.time}
        />

        <AppointmentStatusCard
          title="Status do pagamento"
          description="Mostra se o valor deste agendamento ja foi recebido."
          statusConfig={APPOINTMENT_PAYMENT_STATUS_CONFIG[paymentStatus]}
          loading={isUpdatingPayment}
          onPress={openPaymentSheet}
        />

        <AppointmentStatusCard
          title="Status do serviço"
          description="Controla o andamento do atendimento para voce e para a agenda."
          statusConfig={APPOINTMENT_SERVICE_STATUS_CONFIG[serviceStatus]}
          loading={isUpdatingService}
          onPress={openServiceSheet}
        />

        {appointment.notes ? (
          <AppointmentNotesCard notes={appointment.notes} />
        ) : null}

        <AppointmentWorkImagesCard
          beforeImageUrl={media.beforeImageUrl}
          afterImageUrl={media.afterImageUrl}
          uploadingSlot={media.uploadingSlot}
          deletingSlot={media.deletingSlot}
          onUpload={handleOpenWorkUploadSheet}
          onOpenViewer={media.openViewer}
          onDelete={handleRequestDeleteWorkImage}
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

      <SelectionSheet
        sheetRef={uploadSourceSheetRef}
        title={uploadSheetTitle}
        description="Escolha a origem da imagem para manter o padrao visual do atendimento."
        onClose={() => setUploadTarget(null)}
        onSelect={handleSelectUploadSource}
        options={[
          {
            value: "camera",
            title: "Usar camera",
            description: "Tire a foto agora e envie direto para o agendamento.",
            icon: "📷",
          },
          {
            value: "gallery",
            title: "Escolher da galeria",
            description: "Selecione uma imagem que ja esta no dispositivo.",
            icon: "🖼",
          },
        ]}
      />

      <ConfirmActionSheet
        sheetRef={deleteAppointmentSheetRef}
        title="Deletar agendamento"
        description={`Tem certeza que deseja deletar este agendamento de ${appointment.service.name} em ${formatAppointmentDate(appointment.date)} as ${appointment.timeSlot.time}?`}
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
        label={media.viewerLabel}
        onClose={media.closeViewer}
      />
    </SafeAreaView>
  );
}
