import { serviceKeys } from "../api/service-query-options";
import { createService, updateService } from "../api/service-mutations";
import { ServiceImage } from "../components/service-image";
import { SquareImageCropModal } from "@/components/ui/square-image-crop-modal";
import { SelectionSheet } from "@/components/ui/selection-sheet";
import { appointmentKeys } from "@/features/appointments/api/appointment-query-options";
import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useApiError } from "@/hooks/use-api-error";
import { useFormSheet } from "@/hooks/use-form-sheet";
import { useSquareImagePicker } from "@/hooks/use-square-image-picker";
import { uploadImageAsset } from "@/lib/api/image-upload";
import {
  currencyToCents,
  formatCurrency as formatCurrencyInput,
  normalizeWhitespace,
} from "@/lib/formatters";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, Switch, Text, View } from "react-native";
import { toast } from "sonner-native";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";
import type { ImagePickerAsset } from "expo-image-picker";
import type { ServiceItem } from "../types";

interface ServiceFormSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  onClose: () => void;
  service?: ServiceItem | null;
}

function validateServiceName(value: string) {
  return normalizeWhitespace(value).length < 2
    ? "Informe pelo menos 2 caracteres"
    : undefined;
}

function validateServicePrice(value: string) {
  const cents = currencyToCents(value);

  if (cents === null) return "Obrigatório";
  if (cents <= 0) return "Preço inválido";

  return undefined;
}

function validateDepositPercentage(value: string) {
  const pct = parseInt(value, 10);

  if (!value) return "Obrigatório";
  if (isNaN(pct) || pct < 1 || pct > 100) {
    return "Insira um valor de 1 a 100";
  }

  return undefined;
}

export function ServiceFormSheet({
  sheetRef,
  onClose,
  service,
}: ServiceFormSheetProps) {
  const queryClient = useQueryClient();
  const { showError } = useApiError();
  const formSheet = useFormSheet();
  const imagePicker = useSquareImagePicker();
  const imageSourceSheetRef = useRef<BottomSheetModal>(null);
  const [serviceImageAsset, setServiceImageAsset] =
    useState<ImagePickerAsset | null>(null);
  const [didAttemptSubmit, setDidAttemptSubmit] = useState(false);
  const hasImage = Boolean(serviceImageAsset?.uri || service?.imageKey);

  const form = useForm({
    defaultValues: {
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service ? formatCurrencyInput(String(service.price)) : "",
      hasDeposit: service?.depositPercentage !== null && service?.depositPercentage !== undefined,
      depositPercentage: service?.depositPercentage ? String(service.depositPercentage) : "",
    },
    onSubmit: async ({ value }) => {
      const name = normalizeWhitespace(value.name);
      const description = normalizeWhitespace(value.description);
      const priceInCents = currencyToCents(value.price);
      let depositPct: number | undefined | null = undefined;
      if (value.hasDeposit) {
        depositPct = parseInt(value.depositPercentage, 10);
      } else {
        depositPct = null;
      }

      if (priceInCents === null) return;

      let imageKey = service?.imageKey ?? null;
      if (serviceImageAsset) {
        const uploadedImageKey = await uploadImageAsset(
          {
            uri: serviceImageAsset.uri,
            fileName: serviceImageAsset.fileName,
            mimeType: serviceImageAsset.mimeType,
          },
          "services",
          showError,
        );
        imageKey = uploadedImageKey ?? null;
      }

      if (!imageKey) {
        return;
      }

      try {
        if (service) {
          await updateService({
            id: service.id,
            name,
            description: description || null,
            price: priceInCents,
            depositPercentage: depositPct,
            imageKey,
          });
          toast.success("Serviço atualizado!");
        } else {
          await createService({
            name,
            description: description || undefined,
            price: priceInCents,
            depositPercentage: depositPct ?? undefined,
            imageKey,
          });
          toast.success("Serviço cadastrado!");
        }

        await queryClient.invalidateQueries({ queryKey: serviceKeys.all });
        await queryClient.invalidateQueries({ queryKey: appointmentKeys.all });
        form.reset();
        setServiceImageAsset(null);
        setDidAttemptSubmit(false);
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
    });
    setServiceImageAsset(null);
    setDidAttemptSubmit(false);
  }, [form, service]);

  const handleOpenImageSourceSheet = useCallback(() => {
    imageSourceSheetRef.current?.present();
  }, []);

  const handleSelectImageSource = useCallback(async (source: "camera" | "gallery") => {
    imageSourceSheetRef.current?.dismiss();
    const asset = await imagePicker.pickSquareImage(source, {
      title: "Ajustar foto do serviço",
      description:
        "Enquadre a imagem para o serviço ficar mais bonito na agenda.",
      confirmLabel: "Usar imagem",
      quality: 0.85,
    });
    if (asset) {
      setServiceImageAsset(asset);
    }
  }, [imagePicker]);

  const showImageError = didAttemptSubmit && !hasImage;

  const handleSubmit = useCallback(() => {
    setDidAttemptSubmit(true);

    const { name, price, hasDeposit, depositPercentage } = form.state.values;
    const hasValidationError = Boolean(
      validateServiceName(name) ||
        validateServicePrice(price) ||
        (hasDeposit ? validateDepositPercentage(depositPercentage) : undefined) ||
        !hasImage,
    );

    if (hasValidationError) {
      return;
    }

    void form.handleSubmit();
  }, [form, hasImage]);

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        snapPoints={["85%"]}
        bottomInset={formSheet.bottomInset}
        enablePanDownToClose={!form.state.isSubmitting}
        enableBlurKeyboardOnGesture={formSheet.enableBlurKeyboardOnGesture}
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={{ backgroundColor: "#e4e4e7", width: 40 }}
        backgroundStyle={{ backgroundColor: "white", borderRadius: 24 }}
        onDismiss={() => {
          setServiceImageAsset(null);
          setDidAttemptSubmit(false);
          onClose();
        }}
        keyboardBehavior={formSheet.keyboardBehavior}
        keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
        android_keyboardInputMode={formSheet.androidKeyboardInputMode}
      >
        <BottomSheetScrollView
          contentContainerStyle={formSheet.scrollContentContainerStyle}
          keyboardShouldPersistTaps={formSheet.keyboardShouldPersistTaps}
          keyboardDismissMode="interactive"
        >
          <Text className="mb-5 mt-2 text-lg font-bold text-zinc-900">
            {service ? "Editar serviço" : "Novo serviço"}
          </Text>

          <form.Field
            name="name"
            validators={{
              onChange: ({ value }) => validateServiceName(value),
            }}
          >
            {(field) => (
              <View className="mb-4">
                {(() => {
                  const error =
                    field.state.meta.errors.find((value) => Boolean(value)) ??
                    (didAttemptSubmit ? validateServiceName(field.state.value) : undefined);

                  return (
                    <>
                      <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                        Nome *
                      </Text>
                      <SheetTextInput
                        className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${error ? "border-red-300" : "border-zinc-200"}`}
                        placeholder="Ex: Unhas em Gel"
                        placeholderTextColor="#a1a1aa"
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        maxLength={120}
                        editable={!form.state.isSubmitting}
                      />
                      {error ? (
                        <Text className="mt-1 text-xs text-red-400">
                          {String(error)}
                        </Text>
                      ) : null}
                    </>
                  );
                })()}
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

          <View className="mb-6">
            <Text
              className={`mb-1.5 text-xs font-medium ${showImageError ? "text-red-400" : "text-zinc-500"}`}
            >
              Imagem do serviço *
            </Text>
            <Pressable
              onPress={handleOpenImageSourceSheet}
              disabled={form.state.isSubmitting}
              className={`flex-row items-center gap-4 rounded-3xl border p-4 active:opacity-80 ${showImageError ? "border-red-300 bg-red-50" : "border-zinc-200 bg-zinc-50"}`}
              style={{ opacity: form.state.isSubmitting ? 0.65 : 1 }}
            >
              <ServiceImage
                imageKey={service?.imageKey ?? null}
                previewUri={serviceImageAsset?.uri ?? null}
                backgroundColor={service?.color}
                size={84}
                borderRadius={24}
                iconSize={28}
              />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-zinc-900">
                  {hasImage ? "Trocar imagem" : "Adicionar imagem"}
                </Text>
                <Text className="mt-1 text-xs leading-5 text-zinc-500">
                  {serviceImageAsset
                    ? "Nova imagem pronta para ser enviada ao salvar."
                    : hasImage
                      ? "Toque para escolher outra foto para este serviço."
                      : "Campo obrigatório. Use uma imagem quadrada para representar o serviço."}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="#71717a" />
            </Pressable>
            {serviceImageAsset ? (
              <Pressable
                onPress={() => setServiceImageAsset(null)}
                disabled={form.state.isSubmitting}
                className="mt-2 self-start rounded-full bg-zinc-100 px-3 py-1.5 active:opacity-80"
              >
                <Text className="text-xs font-medium text-zinc-600">
                  Descartar nova imagem
                </Text>
              </Pressable>
            ) : null}
            {showImageError ? (
              <Text className="mt-2 text-xs text-red-400">
                Adicione a imagem do serviço para continuar.
              </Text>
            ) : null}
          </View>

          <form.Field
            name="price"
            validators={{
              onChange: ({ value }) => validateServicePrice(value),
            }}
          >
            {(field) => (
              <View className="mb-4">
                {(() => {
                  const error =
                    field.state.meta.errors.find((value) => Boolean(value)) ??
                    (didAttemptSubmit ? validateServicePrice(field.state.value) : undefined);

                  return (
                    <>
                      <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                        Preço (R$) *
                      </Text>
                      <SheetTextInput
                        className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${error ? "border-red-300" : "border-zinc-200"}`}
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
                      {error ? (
                        <Text className="mt-1 text-xs text-red-400">
                          {String(error)}
                        </Text>
                      ) : null}
                    </>
                  );
                })()}
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

                  if (v) {
                    if (form.getFieldValue("depositPercentage") === undefined) {
                      form.setFieldValue("depositPercentage", "", {
                        dontUpdateMeta: true,
                        dontValidate: true,
                      });
                    }
                    return;
                  }

                  form.deleteField("depositPercentage");
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
                  onChange: ({ value }) => validateDepositPercentage(value),
                }}
              >
                {(field) => (
                  <View className="mb-4">
                    {(() => {
                      const error =
                        field.state.meta.errors.find((value) => Boolean(value)) ??
                        (didAttemptSubmit
                          ? validateDepositPercentage(field.state.value)
                          : undefined);

                      return (
                        <>
                          <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                            Porcentagem do sinal (%) *
                          </Text>
                          <SheetTextInput
                            className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${error ? "border-red-300" : "border-zinc-200"}`}
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
                          {error ? (
                            <Text className="mt-1 text-xs text-red-400">
                              {String(error)}
                            </Text>
                          ) : null}
                        </>
                      );
                    })()}
                  </View>
                )}
              </form.Field>
            ) : null
          }
        </form.Subscribe>

          <form.Subscribe selector={(state) => state.isSubmitting}>
            {(isSubmitting) => (
              <Pressable
                onPress={handleSubmit}
                disabled={isSubmitting}
                className="items-center rounded-2xl bg-rose-500 py-4 active:opacity-80"
                style={{ opacity: isSubmitting ? 0.6 : 1 }}
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

      <SelectionSheet
        sheetRef={imageSourceSheetRef}
        title="Imagem do serviço"
        description="Escolha de onde a foto do serviço será enviada."
        onSelect={handleSelectImageSource}
        options={[
          {
            value: "camera",
            title: "Usar câmera",
            description: "Tire uma foto quadrada direto do dispositivo.",
            icon: <Feather name="camera" size={18} color="#f43f5e" />,
          },
          {
            value: "gallery",
            title: "Escolher da galeria",
            description: "Selecione uma imagem que já esteja salva no aparelho.",
            icon: <Feather name="image" size={18} color="#f43f5e" />,
          },
        ]}
      />
      <SquareImageCropModal {...imagePicker.cropperProps} />
    </>
  );
}
