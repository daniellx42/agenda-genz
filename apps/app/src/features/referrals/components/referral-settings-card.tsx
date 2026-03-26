import { formatPrice } from "@/features/billing/lib/billing-formatters";
import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface ReferralSettingsCardProps {
  referralCode: string | null;
  copiedCode: boolean;
  availableBalanceInCents: number;
  referralUsersCount: number;
  canWithdraw: boolean;
  generatingCode: boolean;
  requestingWithdrawal: boolean;
  onGenerateCode: () => void;
  onCopyCode: () => void;
  onWithdraw: () => void;
}

export function ReferralSettingsCard({
  referralCode,
  copiedCode,
  availableBalanceInCents,
  referralUsersCount,
  canWithdraw,
  generatingCode,
  requestingWithdrawal,
  onGenerateCode,
  onCopyCode,
  onWithdraw,
}: ReferralSettingsCardProps) {
  return (
    <View className="rounded-[28px] border border-rose-100 bg-white p-5">
      <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
        Convites
      </Text>

      <Text className="mt-3 text-lg font-bold text-zinc-900">
        {referralCode
          ? "Nao esqueca de divulgar o aplicativo"
          : "Crie seu codigo e comece a divulgar"}
      </Text>
      <Text className="mt-2 text-sm leading-6 text-zinc-500">
        {referralCode
          ? "Grave videos mostrando o app, compartilhe o seu codigo e acompanhe tudo aqui. A cada pessoa que usar, voce e a pessoa ganham R$ 1,00."
          : "Entre no programa de convites para divulgar o Agenda GenZ e ganhar R$ 1,00 sempre que uma nova pessoa usar o seu codigo."}
      </Text>

      {referralCode ? (
        <View className="mt-5 flex-row gap-3">
          <View className="flex-1 rounded-[24px] border border-rose-100 bg-[#fff9fb] px-4 py-4">
            <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-rose-500">
              Seu codigo
            </Text>
            <Text
              selectable
              className="mt-2 text-2xl font-black tracking-[2px] text-zinc-900"
            >
              {referralCode}
            </Text>
          </View>

          <Pressable
            onPress={onCopyCode}
            accessibilityRole="button"
            accessibilityLabel="Copiar codigo de convite"
            className={`items-center justify-center rounded-[24px] px-5 py-4 active:opacity-80 ${
              copiedCode ? "bg-emerald-500" : "bg-rose-500"
            }`}
          >
            <Feather
              name={copiedCode ? "check" : "copy"}
              size={18}
              color="white"
            />
            <Text className="mt-2 text-sm font-bold text-white">
              {copiedCode ? "Copiado" : "Copiar"}
            </Text>
          </Pressable>
        </View>
      ) : (
        <Pressable
          onPress={onGenerateCode}
          disabled={generatingCode}
          className="mt-5 flex-row items-center justify-center gap-3 rounded-[26px] bg-rose-500 px-5 py-4 active:opacity-80"
          style={{ opacity: generatingCode ? 0.7 : 1 }}
        >
          {generatingCode ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <Feather name="star" size={18} color="white" />
          )}
          <Text className="text-sm font-bold text-white">
            Gerar meu codigo de convite
          </Text>
        </Pressable>
      )}

      <View className="mt-4 flex-row gap-3">
        <View className="flex-1 rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4">
          <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-emerald-700">
            Saldo disponivel
          </Text>
          <Text className="mt-2 text-xl font-black text-zinc-900">
            {formatPrice(availableBalanceInCents)}
          </Text>
        </View>

        <View className="flex-1 rounded-[24px] border border-rose-100 bg-[#fff9fb] px-4 py-4">
          <Text className="text-[11px] font-semibold uppercase tracking-[1.4px] text-rose-500">
            Pessoas
          </Text>
          <Text className="mt-2 text-xl font-black text-zinc-900">
            {referralUsersCount}
          </Text>
          <Text className="mt-1 text-xs text-zinc-500">usaram seu codigo</Text>
        </View>
      </View>

      <Text className="mt-4 text-xs leading-5 text-zinc-400">
        Saque minimo de {formatPrice(10_000)}.
      </Text>

      <Pressable
        onPress={onWithdraw}
        disabled={!canWithdraw || requestingWithdrawal}
        className={`mt-4 flex-row items-center justify-center gap-3 rounded-[26px] px-5 py-4 active:opacity-80 ${canWithdraw ? "bg-rose-500" : "bg-zinc-200"
          }`}
        style={{ opacity: requestingWithdrawal ? 0.75 : 1 }}
      >
        {requestingWithdrawal ? (
          <ActivityIndicator size="small" color={canWithdraw ? "white" : "#71717a"} />
        ) : (
          <Feather
            name="credit-card"
            size={18}
            color={canWithdraw ? "white" : "#71717a"}
          />
        )}
        <Text
          className={`text-sm font-bold ${canWithdraw ? "text-white" : "text-zinc-500"
            }`}
        >
          {canWithdraw ? "Solicitar saque" : "Saque bloqueado"}
        </Text>
      </Pressable>
    </View>
  );
}
