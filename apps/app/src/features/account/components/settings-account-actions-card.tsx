import Feather from "@expo/vector-icons/Feather";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

interface SettingsActionRowProps {
  title: string;
  description: string;
  iconName: React.ComponentProps<typeof Feather>["name"];
  iconColor: string;
  chevronColor: string;
  containerClassName: string;
  iconContainerClassName: string;
  titleClassName: string;
  descriptionClassName: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

function SettingsActionRow({
  title,
  description,
  iconName,
  iconColor,
  chevronColor,
  containerClassName,
  iconContainerClassName,
  titleClassName,
  descriptionClassName,
  loading,
  disabled,
  onPress,
}: SettingsActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={containerClassName}
      style={{ opacity: disabled ? 0.65 : 1 }}
    >
      <View className={iconContainerClassName}>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <Feather name={iconName} size={18} color={iconColor} />
        )}
      </View>

      <View className="flex-1">
        <Text className={titleClassName}>{title}</Text>
        <Text className={descriptionClassName}>{description}</Text>
      </View>

      <Feather name="chevron-right" size={18} color={chevronColor} />
    </Pressable>
  );
}

interface SettingsAccountActionsCardProps {
  signOutPending: boolean;
  deleteAccountPending: boolean;
  disabled: boolean;
  onSignOut: () => void;
  onDeleteAccount: () => void;
}

export function SettingsAccountActionsCard({
  signOutPending,
  deleteAccountPending,
  disabled,
  onSignOut,
  onDeleteAccount,
}: SettingsAccountActionsCardProps) {
  return (
    <View className="rounded-[28px] border border-rose-100 bg-white p-5">
      <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
        Conta
      </Text>

      <SettingsActionRow
        title="Sair do aplicativo"
        description="Encerra sua sessão neste dispositivo."
        iconName="log-out"
        iconColor="#18181b"
        chevronColor="#a1a1aa"
        containerClassName="mt-4 flex-row items-center gap-4 rounded-3xl bg-[#fff9fb] px-4 py-4 active:opacity-80"
        iconContainerClassName="h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100"
        titleClassName="text-base font-semibold text-zinc-900"
        descriptionClassName="mt-1 text-sm leading-5 text-zinc-500"
        loading={signOutPending}
        disabled={disabled}
        onPress={onSignOut}
      />

      <View className="my-4 h-px bg-rose-100" />

      <SettingsActionRow
        title="Deletar conta"
        description="Remove sua conta e todos os dados do aplicativo."
        iconName="trash-2"
        iconColor="#ef4444"
        chevronColor="#f87171"
        containerClassName="flex-row items-center gap-4 rounded-3xl bg-red-50 px-4 py-4 active:opacity-80"
        iconContainerClassName="h-11 w-11 items-center justify-center rounded-2xl bg-white"
        titleClassName="text-base font-semibold text-red-600"
        descriptionClassName="mt-1 text-sm leading-5 text-red-500"
        loading={deleteAccountPending}
        disabled={disabled}
        onPress={onDeleteAccount}
      />
    </View>
  );
}
