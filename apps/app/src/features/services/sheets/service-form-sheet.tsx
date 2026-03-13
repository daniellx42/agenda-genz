import { serviceKeys } from "../api/service-query-options";
import { createService, updateService } from "../api/service-mutations";
import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useApiError } from "@/hooks/use-api-error";
import { useFormSheet } from "@/hooks/use-form-sheet";
import {
  currencyToCents,
  formatCurrency as formatCurrencyInput,
  normalizeWhitespace,
} from "@/lib/formatters";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";
import { ActivityIndicator, Pressable, Switch, Text, View } from "react-native";
import { toast } from "sonner-native";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import type { ServiceItem } from "../types";

interface ServiceFormSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
  service?: ServiceItem | null;
}

export function ServiceFormSheet({
  sheetRef,
  onClose,
  service,
}: ServiceFormSheetProps) {
  const queryClient = useQueryClient();
  const { showError } = useApiError();
  const formSheet = useFormSheet();

  const form = useForm({
    defaultValues: {
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service ? formatCurrencyInput(String(service.price)) : "",
      hasDeposit: service?.depositPercentage !== null && service?.depositPercentage !== undefined,
      depositPercentage: service?.depositPercentage ? String(service.depositPercentage) : "",
      emoji: service?.emoji ?? "",
    },
    onSubmit: async ({ value }) => {
      const name = normalizeWhitespace(value.name);
      const description = normalizeWhitespace(value.description);
      const priceInCents = currencyToCents(value.price);
      const emoji = value.emoji.trim();

      if (!name || !priceInCents) {
        toast.error("Preencha os campos obrigatórios");
        return;
      }

      let depositPct: number | undefined | null = undefined;
      if (value.hasDeposit) {
        const pct = parseInt(value.depositPercentage, 10);
        if (isNaN(pct) || pct < 1 || pct > 100) {
          toast.error("Informe uma porcentagem válida (1 a 100)");
          return;
        }
        depositPct = pct;
      } else {
        depositPct = null;
      }

      try {
        if (service) {
          await updateService({
            id: service.id,
            name,
            description: description || null,
            price: priceInCents,
            depositPercentage: depositPct,
            emoji: emoji || null,
          });
          toast.success("Serviço atualizado!");
        } else {
          await createService({
            name,
            description: description || undefined,
            price: priceInCents,
            depositPercentage: depositPct ?? undefined,
            emoji: emoji || undefined,
          });
          toast.success("Serviço cadastrado!");
        }

        await queryClient.invalidateQueries({ queryKey: serviceKeys.all });
        form.reset();
        onClose();
      } catch (error) {
        showError(error);
        onClose();
      }
    },
  });

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  useEffect(() => {
    form.reset({
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service ? formatCurrencyInput(String(service.price)) : "",
      hasDeposit: service?.depositPercentage !== null && service?.depositPercentage !== undefined,
      depositPercentage: service?.depositPercentage ? String(service.depositPercentage) : "",
      emoji: service?.emoji ?? "",
    });
  }, [form, service]);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["85%"]}
      bottomInset={formSheet.bottomInset}
      enablePanDownToClose={!form.state.isSubmitting}
      enableBlurKeyboardOnGesture={formSheet.enableBlurKeyboardOnGesture}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#e4e4e7", width: 40 }}
      backgroundStyle={{ backgroundColor: "white", borderRadius: 24 }}
      onDismiss={onClose}
      keyboardBehavior={formSheet.keyboardBehavior}
      keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
      android_keyboardInputMode={formSheet.androidKeyboardInputMode}
    >
      <BottomSheetScrollView
        contentContainerStyle={formSheet.scrollContentContainerStyle}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        <Text className="mb-5 mt-2 text-lg font-bold text-zinc-900">
          {service ? "Editar serviço" : "Novo serviço"}
        </Text>

        <form.Field
          name="name"
          validators={{
            onChange: ({ value }) =>
              normalizeWhitespace(value).length < 2
                ? "Informe pelo menos 2 caracteres"
                : undefined,
          }}
        >
          {(field) => (
            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                Nome *
              </Text>
              <SheetTextInput
                className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${field.state.meta.errors.length ? "border-red-300" : "border-zinc-200"}`}
                placeholder="Ex: Unhas em Gel"
                placeholderTextColor="#a1a1aa"
                value={field.state.value}
                onChangeText={field.handleChange}
                maxLength={120}
                editable={!form.state.isSubmitting}
              />
              {field.state.meta.errors.map((error, index) => (
                <Text key={index} className="mt-1 text-xs text-red-400">
                  {String(error)}
                </Text>
              ))}
            </View>
          )}
        </form.Field>

        <form.Field
          name="description"
          validators={{
            onChange: ({ value }) =>
              normalizeWhitespace(value).length > 500
                ? "Máximo de 500 caracteres"
                : undefined,
          }}
        >
          {(field) => (
            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                Descrição
              </Text>
              <SheetTextInput
                className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900"
                placeholder="Descreva o serviço..."
                placeholderTextColor="#a1a1aa"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
                value={field.state.value}
                onChangeText={field.handleChange}
                maxLength={500}
                editable={!form.state.isSubmitting}
              />
              {field.state.meta.errors.map((error, index) => (
                <Text key={index} className="mt-1 text-xs text-red-400">
                  {String(error)}
                </Text>
              ))}
            </View>
          )}
        </form.Field>

        <form.Field
          name="price"
          validators={{
            onChange: ({ value }) => {
              const cents = currencyToCents(value);
              if (cents === null) return "Obrigatório";
              if (cents <= 0) return "Preço inválido";
              return undefined;
            },
          }}
        >
          {(field) => (
            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                Preço (R$) *
              </Text>
              <SheetTextInput
                className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${field.state.meta.errors.length ? "border-red-300" : "border-zinc-200"}`}
                placeholder="150,00"
                placeholderTextColor="#a1a1aa"
                keyboardType="decimal-pad"
                value={field.state.value}
                onChangeText={(value) =>
                  field.handleChange(formatCurrencyInput(value))
                }
                maxLength={13}
                editable={!form.state.isSubmitting}
              />
              {field.state.meta.errors.map((error, index) => (
                <Text key={index} className="mt-1 text-xs text-red-400">
                  {String(error)}
                </Text>
              ))}
            </View>
          )}
        </form.Field>

        {/* Sinal */}
        <form.Field name="hasDeposit">
          {(field) => (
            <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <View>
                <Text className="text-sm font-medium text-zinc-700">
                  Cobrar sinal?
                </Text>
                <Text className="mt-0.5 text-xs text-zinc-400">
                  Porcentagem adiantada para reservar o horário
                </Text>
              </View>
              <Switch
                value={field.state.value}
                disabled={form.state.isSubmitting}
                onValueChange={(v) => {
                  field.handleChange(v);
                }}
                trackColor={{ false: "#e4e4e7", true: "#f43f5e" }}
                thumbColor="white"
              />
            </View>
          )}
        </form.Field>

        <form.Subscribe selector={(s) => s.values.hasDeposit}>
          {(hasDeposit) =>
            hasDeposit ? (
              <form.Field
                name="depositPercentage"
                validators={{
                  onChange: ({ value }) => {
                    const pct = parseInt(value, 10);
                    if (!value) return "Obrigatório";
                    if (isNaN(pct) || pct < 1 || pct > 100)
                      return "Insira um valor de 1 a 100";
                    return undefined;
                  },
                }}
              >
                {(field) => (
                  <View className="mb-4">
                    <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                      Porcentagem do sinal (%) *
                    </Text>
                    <SheetTextInput
                      className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${field.state.meta.errors.length ? "border-red-300" : "border-zinc-200"}`}
                      placeholder="30"
                      placeholderTextColor="#a1a1aa"
                      keyboardType="numeric"
                      value={field.state.value}
                      onChangeText={(v) =>
                        field.handleChange(v.replace(/[^0-9]/g, "").slice(0, 3))
                      }
                      maxLength={3}
                      editable={!form.state.isSubmitting}
                    />
                    {field.state.meta.errors.map((error, index) => (
                      <Text key={index} className="mt-1 text-xs text-red-400">
                        {String(error)}
                      </Text>
                    ))}
                  </View>
                )}
              </form.Field>
            ) : null
          }
        </form.Subscribe>

        <form.Field name="emoji">
          {(field) => (
            <View className="mb-6">
              <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                Emoji
              </Text>
              <SheetTextInput
                className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900"
                placeholder="💅"
                placeholderTextColor="#a1a1aa"
                value={field.state.value}
                onChangeText={field.handleChange}
                maxLength={8}
                editable={!form.state.isSubmitting}
              />
            </View>
          )}
        </form.Field>

        <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
          {([canSubmit, isSubmitting]) => (
            <Pressable
              onPress={() => form.handleSubmit()}
              disabled={!canSubmit || isSubmitting}
              className="items-center rounded-2xl bg-rose-500 py-4 active:opacity-80"
              style={{ opacity: !canSubmit || isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text className="text-sm font-bold text-white">
                  {service ? "Salvar alterações" : "Cadastrar serviço"}
                </Text>
              )}
            </Pressable>
          )}
        </form.Subscribe>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
