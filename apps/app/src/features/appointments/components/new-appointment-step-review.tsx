import { appointmentKeys } from "@/features/appointments/api/appointment-query-options";
import { useAppStorePrompts } from "@/features/app-experience/lib/app-store-prompts-context";
import { AppointmentClientAvatar } from "@/features/appointments/components/appointment-client-avatar";
import { createAppointment } from "@/features/appointments/api/appointment-mutations";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { ServiceImage } from "@/features/services/components/service-image";
import { timeSlotKeys } from "@/features/time-slots/api/time-slot-query-options";
import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useApiError } from "@/hooks/use-api-error";
import { formatPhone } from "@/lib/formatters";
import { useResolvedImage } from "@/lib/media/use-resolved-image";
import { scheduleAppointmentReminders } from "@/lib/notifications";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { toast } from "sonner-native";

function formatPrice(cents: number): string {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

interface Props {
  onClose: () => void;
}

export function StepReview({ onClose }: Props) {
  const { client, service, timeSlot, date, notes, setNotes, goBack, reset } =
    useAppointmentDraft();
  const appStorePrompts = useAppStorePrompts();
  const { showError } = useApiError();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const { imageUrl: clientProfileImageUrl } = useResolvedImage({
    imageKey: client?.profileImageKey,
  });

  const formattedDate = (() => {
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  })();

  const handleConfirm = async () => {
    if (!client || !service || !timeSlot) return;

    setLoading(true);
    try {
      const appointment = await createAppointment({
        clientId: client.id,
        serviceId: service.id,
        timeSlotId: timeSlot.id,
        date,
        notes: notes || undefined,
      });

      try {
        const reminderResult = await scheduleAppointmentReminders(
          appointment.date,
          appointment.timeSlot.time,
          appointment.id,
        );

        if (
          reminderResult.permissionGranted &&
          reminderResult.scheduledCount > 0
        ) {
          toast.success("Agendamento criado e lembretes ativados!");
        } else if (!reminderResult.permissionGranted) {
          toast.success("Agendamento criado com sucesso!");
          toast.error("Ative as notificações para receber os lembretes.");
        } else {
          toast.success("Agendamento criado com sucesso!");
        }
      } catch {
        toast.success("Agendamento criado com sucesso!");
        toast.error("Não foi possível ativar os lembretes deste agendamento.");
      }
      await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
      await queryClient.invalidateQueries({ queryKey: timeSlotKeys.all });
      await appStorePrompts.registerSuccessfulAppointment();
      reset();
      onClose();
    } catch (err) {
      showError(err);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1">
      <Text className="text-lg font-bold text-zinc-900 mb-1">Resumo</Text>
      <Text className="text-sm text-zinc-400 mb-5">
        Confirme as informações antes de finalizar
      </Text>

      <View className="bg-zinc-50 rounded-2xl p-4 gap-4 mb-4">
        {/* Data */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-zinc-400 uppercase tracking-wide">
            Data
          </Text>
          <Text className="text-sm font-semibold text-zinc-800 capitalize">
            {formattedDate} • {timeSlot?.time}
          </Text>
        </View>

        <View className="h-px bg-zinc-200" />

        {/* Cliente */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-zinc-400 uppercase tracking-wide">
            Cliente
          </Text>
          <View className="flex-row items-center gap-2">
            {client ? (
              <AppointmentClientAvatar
                name={client.name}
                profileImageUrl={clientProfileImageUrl}
                profileImageKey={client.profileImageKey}
                size={28}
              />
            ) : null}
            <View className="items-end">
              <Text className="text-sm font-semibold text-zinc-800">
                {client?.name}
              </Text>
              <Text className="text-xs text-zinc-400">
                {client?.phone ? formatPhone(client.phone) : ""}
              </Text>
            </View>
          </View>
        </View>

        <View className="h-px bg-zinc-200" />

        {/* Serviço */}
        <View className="flex-row items-center justify-between">
          <Text className="text-xs text-zinc-400 uppercase tracking-wide">
            Serviço
          </Text>
          <View className="items-end">
            {service ? (
              <View className="flex-row items-center gap-2">
                <ServiceImage
                  imageKey={service.imageKey}
                  backgroundColor={service.color}
                  size={28}
                  borderRadius={10}
                  iconSize={14}
                />
                <Text className="text-sm font-semibold text-zinc-800">
                  {service.name}
                </Text>
              </View>
            ) : null}
            <Text className="text-xs text-zinc-400">
              {service ? formatPrice(service.price) : ""}
            </Text>
          </View>
        </View>

        {service?.depositPercentage != null &&
          (() => {
            const depositAmount = Math.round(
              (service.price * service.depositPercentage) / 100,
            );
            const remaining = service.price - depositAmount;
            return (
              <>
                <View className="h-px bg-zinc-200" />
                <View className="gap-1.5">
                  <Text className="text-xs text-zinc-400 uppercase tracking-wide mb-1">
                    Valores
                  </Text>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-zinc-500">Total</Text>
                    <Text className="text-xs font-semibold text-zinc-700">
                      {formatPrice(service.price)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-blue-500">
                      Sinal ({service.depositPercentage}%)
                    </Text>
                    <Text className="text-xs font-semibold text-blue-600">
                      {formatPrice(depositAmount)}
                    </Text>
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-xs text-zinc-500">
                      Restante no dia
                    </Text>
                    <Text className="text-xs font-semibold text-zinc-700">
                      {formatPrice(remaining)}
                    </Text>
                  </View>
                </View>
              </>
            );
          })()}
      </View>

      {/* Observações */}
      <SheetTextInput
        className="bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-sm text-zinc-900 mb-6"
        placeholder="Observações (opcional)..."
        placeholderTextColor="#a1a1aa"
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={2}
        textAlignVertical="top"
        maxLength={500}
        editable={!loading}
      />

      {/* Ações */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={goBack}
          disabled={loading}
          className="flex-1 bg-zinc-100 rounded-2xl py-4 items-center"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <Text className="text-zinc-600 font-semibold text-sm">Voltar</Text>
        </Pressable>

        <Pressable
          onPress={handleConfirm}
          disabled={loading}
          className="flex-2 bg-rose-500 rounded-2xl py-4 px-8 items-center active:opacity-80"
          style={{ flex: 2 }}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Text className="text-white font-bold text-sm">Confirmar</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
