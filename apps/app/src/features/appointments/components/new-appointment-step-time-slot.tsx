import { SkeletonBox } from "@/components/ui/skeleton-box";
import { useAppointmentDraft } from "@/features/appointments/store/appointment-draft";
import { availableTimeSlotsQueryOptions } from "@/features/time-slots/api/time-slot-query-options";
import { useApiError } from "@/hooks/use-api-error";
import { useBottomSheetModal } from "@gorhom/bottom-sheet";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { toast } from "sonner-native";

function getUnavailableMessage(reason?: "BOOKED" | "INACTIVE" | "BLOCKED_DATE") {
  switch (reason) {
    case "INACTIVE":
      return "Este horário está desativado. Para ativá-lo novamente, vá até a página de horários.";
    case "BLOCKED_DATE":
      return "Este horário foi desativado somente para este dia específico. Para ativá-lo novamente, vá até a página de horários e remova o bloqueio para esta data.";
    case "BOOKED":
    default:
      return "Este horário já está agendado nesta data.";
  }
}

export function StepTimeSlot() {
  const { date, setTimeSlot } = useAppointmentDraft();
  const { showError } = useApiError();
  const router = useRouter();
  const { dismissAll } = useBottomSheetModal();

  const { data: slots, isLoading } = useQuery(
    availableTimeSlotsQueryOptions(date, showError),
  );

  const formattedDate = (() => {
    const d = new Date(date + "T12:00:00");
    return d.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  })();

  return (
    <View className="flex-1">
      <Text className="text-lg font-bold text-zinc-900 mb-1">
        Selecionar horário
      </Text>
      <Text className="text-sm text-zinc-400 mb-4 capitalize">
        {formattedDate}
      </Text>

      {isLoading && (
        <View className="flex-row flex-wrap gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBox
              key={index}
              style={{ width: 90, height: 52, borderRadius: 16 }}
            />
          ))}
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {slots && slots.length > 0 ? (
          <View className="flex-row flex-wrap gap-3">
            {slots.map((slot) => {
              if (!slot.available) {
                return (
                  <Pressable
                    key={slot.id}
                    onPress={() =>
                      toast.error(getUnavailableMessage(slot.unavailableReason), {
                        duration: 5000,
                      })
                    }
                    className="rounded-2xl px-5 py-4 border border-zinc-100 bg-zinc-50 items-center justify-center"
                    style={{ minWidth: 90 }}
                  >
                    <Text className="text-zinc-300 text-sm font-semibold">
                      {slot.time}
                    </Text>
                    <Text className="text-xs text-zinc-300 mt-0.5">🔒</Text>
                  </Pressable>
                );
              }

              return (
                <Pressable
                  key={slot.id}
                  onPress={() =>
                    setTimeSlot({ id: slot.id, time: slot.time })
                  }
                  className="rounded-2xl px-5 py-4 bg-rose-500 items-center justify-center active:opacity-70"
                  style={{ minWidth: 90 }}
                >
                  <Text className="text-white text-sm font-bold">
                    {slot.time}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          !isLoading && (
            <View className="items-center py-8">
              <Text className="text-zinc-400 text-sm mb-4">
                Nenhum horário cadastrado para este dia
              </Text>
              <Pressable
                onPress={() => {
                  dismissAll();
                  router.navigate("/time-slots" as never);
                }}
                className="bg-rose-50 border border-rose-200 rounded-2xl px-5 py-3"
              >
                <Text className="text-rose-500 font-semibold text-sm">
                  Gerenciar horários
                </Text>
              </Pressable>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}
