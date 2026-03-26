import { SheetTextInput } from "@/components/ui/sheet-text-input";
import { useFormSheet } from "@/hooks/use-form-sheet";
import { formatPrice } from "@/features/billing/lib/billing-formatters";
import { currencyToCents, formatCurrency } from "@/lib/formatters";
import {
  DEFAULT_MIN_WITHDRAWAL_IN_CENTS,
  getWithdrawalAmountError,
  maskPixKey,
  resolvePixKey,
} from "../lib/referral-form";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

interface ReferralWithdrawalSheetProps {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  availableBalanceInCents: number;
  savedPixKey: string | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: (input: {
    amountInCents: number;
    pixKey: string;
    savePixKey: boolean;
  }) => void;
}

export function ReferralWithdrawalSheet({
  sheetRef,
  availableBalanceInCents,
  savedPixKey,
  loading,
  onClose,
  onSubmit,
}: ReferralWithdrawalSheetProps) {
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [amountError, setAmountError] = useState("");
  const [pixKeyError, setPixKeyError] = useState("");
  const [useSavedPixKey, setUseSavedPixKey] = useState(Boolean(savedPixKey));
  const formSheet = useFormSheet({
    horizontalPadding: 24,
    bottomPadding: 24,
  });

  useEffect(() => {
    setUseSavedPixKey(Boolean(savedPixKey));
  }, [savedPixKey]);

  const resetForm = useCallback(() => {
    setAmount("");
    setPixKey("");
    setAmountError("");
    setPixKeyError("");
    setUseSavedPixKey(Boolean(savedPixKey));
  }, [savedPixKey]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.45}
      />
    ),
    [],
  );

  const handleDismiss = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = () => {
    const nextAmountError = getWithdrawalAmountError({
      value: amount,
      availableBalanceInCents,
    });
    const submittedPixKey = useSavedPixKey ? savedPixKey ?? "" : pixKey;
    const resolvedPixKey = resolvePixKey(submittedPixKey);

    setAmountError(nextAmountError ?? "");

    if (!submittedPixKey.trim()) {
      setPixKeyError("Informe a chave Pix para receber o saque.");
      return;
    }

    if (!resolvedPixKey) {
      setPixKeyError("Informe uma chave Pix valida.");
      return;
    }

    setPixKeyError("");

    if (nextAmountError) {
      return;
    }

    const amountInCents = currencyToCents(amount);
    if (!amountInCents) {
      return;
    }

    onSubmit({
      amountInCents,
      pixKey: resolvedPixKey.value,
      savePixKey: !useSavedPixKey,
    });
  };

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["78%"]}
      bottomInset={formSheet.bottomInset}
      enablePanDownToClose={!loading}
      enableBlurKeyboardOnGesture={formSheet.enableBlurKeyboardOnGesture}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: "#fbcfe8", width: 42 }}
      backgroundStyle={{ backgroundColor: "#fff9fb", borderRadius: 28 }}
      onDismiss={handleDismiss}
      keyboardBehavior="fillParent"
      keyboardBlurBehavior={formSheet.keyboardBlurBehavior}
      android_keyboardInputMode={formSheet.androidKeyboardInputMode}
    >
      <BottomSheetScrollView
        contentContainerStyle={formSheet.scrollContentContainerStyle}
        keyboardShouldPersistTaps={formSheet.keyboardShouldPersistTaps}
        keyboardDismissMode="interactive"
      >
        <Text className="text-lg font-bold text-zinc-900">
          Solicitar saque
        </Text>
        <Text className="mt-2 text-sm leading-6 text-zinc-500">
          Saldo disponivel: {formatPrice(availableBalanceInCents)}. O minimo
          para saque e {formatPrice(DEFAULT_MIN_WITHDRAWAL_IN_CENTS)}.
        </Text>

        <View className="mt-5 rounded-[24px] border border-rose-100 bg-white p-4">
          <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-rose-500">
            Valor do saque
          </Text>
          <SheetTextInput
            style={{
              marginTop: 10,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: amountError ? "#fca5a5" : "#e4e4e7",
              backgroundColor: "#fafafa",
              paddingHorizontal: 16,
              paddingVertical: 14,
              fontSize: 18,
              fontWeight: "800",
              color: "#18181b",
            }}
            placeholder="0,00"
            placeholderTextColor="#a1a1aa"
            keyboardType="numeric"
            editable={!loading}
            value={amount}
            onChangeText={(value) => {
              setAmount(formatCurrency(value));
              setAmountError("");
            }}
          />
          <Text
            className={`mt-3 text-xs ${
              amountError ? "text-red-400" : "text-zinc-400"
            }`}
          >
            {amountError || "Informe quanto deseja sacar agora."}
          </Text>
        </View>

        {savedPixKey ? (
          <View className="mt-4 rounded-[24px] border border-emerald-100 bg-white p-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-emerald-600">
              Chave Pix
            </Text>
            <Text className="mt-2 text-sm leading-6 text-zinc-500">
              Escolha se deseja usar a mesma chave salva neste dispositivo ou
              informar uma nova.
            </Text>

            <View className="mt-4 flex-row gap-3">
              <Pressable
                onPress={() => {
                  setUseSavedPixKey(true);
                  setPixKeyError("");
                }}
                className={`flex-1 rounded-2xl px-4 py-4 ${
                  useSavedPixKey
                    ? "border border-emerald-200 bg-emerald-50"
                    : "border border-zinc-200 bg-zinc-50"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    useSavedPixKey ? "text-emerald-700" : "text-zinc-700"
                  }`}
                >
                  Usar a mesma
                </Text>
                <Text className="mt-2 text-xs text-zinc-500">
                  {maskPixKey(savedPixKey)}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setUseSavedPixKey(false)}
                className={`flex-1 rounded-2xl px-4 py-4 ${
                  !useSavedPixKey
                    ? "border border-rose-200 bg-[#fff7f9]"
                    : "border border-zinc-200 bg-zinc-50"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    !useSavedPixKey ? "text-rose-600" : "text-zinc-700"
                  }`}
                >
                  Inserir nova
                </Text>
                <Text className="mt-2 text-xs text-zinc-500">
                  Para receber este pagamento em outra chave.
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {!useSavedPixKey || !savedPixKey ? (
          <View className="mt-4 rounded-[24px] border border-rose-100 bg-white p-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.5px] text-rose-500">
              Chave Pix para este saque
            </Text>
            <SheetTextInput
              style={{
                marginTop: 10,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: pixKeyError ? "#fca5a5" : "#e4e4e7",
                backgroundColor: "#fafafa",
                paddingHorizontal: 16,
                paddingVertical: 14,
                fontSize: 15,
                fontWeight: "600",
                color: "#18181b",
              }}
              placeholder="CPF, telefone, email ou chave aleatoria"
              placeholderTextColor="#a1a1aa"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              value={pixKey}
              onChangeText={(value) => {
                setPixKey(value);
                setPixKeyError("");
              }}
            />
            <Text
              className={`mt-3 text-xs ${
                pixKeyError ? "text-red-400" : "text-zinc-400"
              }`}
            >
              {pixKeyError ||
                "A ultima chave usada pode ficar salva localmente neste dispositivo."}
            </Text>
          </View>
        ) : null}

        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            disabled={loading}
            className="flex-1 items-center rounded-2xl bg-zinc-100 py-3.5 active:opacity-80"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-sm font-semibold text-zinc-600">
              Cancelar
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={loading}
            className="flex-1 items-center rounded-2xl bg-rose-500 py-3.5 active:opacity-80"
            style={{ opacity: loading ? 0.75 : 1 }}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text className="text-sm font-bold text-white">
                Enviar solicitacao
              </Text>
            )}
          </Pressable>
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}
