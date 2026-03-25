import { ProfileAvatarEdit } from "@/features/clients/components/profile-avatar-edit";
import Feather from "@expo/vector-icons/Feather";
import { Pressable, Text, View } from "react-native";

interface SettingsProfileCardProps {
  name: string;
  imageUrl: string | null;
  imageCacheKey?: string | null;
  localImageUri: string | null;
  uploading: boolean;
  deleting: boolean;
  onPickImage: () => void;
  onClearLocalImage: () => void;
  onDeleteImage: () => void;
  onEditName: () => void;
  editNameDisabled: boolean;
}

export function SettingsProfileCard({
  name,
  imageUrl,
  imageCacheKey,
  localImageUri,
  uploading,
  deleting,
  onPickImage,
  onClearLocalImage,
  onDeleteImage,
  onEditName,
  editNameDisabled,
}: SettingsProfileCardProps) {
  return (
    <View className="rounded-[28px] border border-rose-100 bg-white p-6">
      <View className="items-center">
        <View className="rounded-full border border-rose-100 bg-rose-50 p-2">
          <ProfileAvatarEdit
            name={name}
            existingImageUrl={imageUrl}
            existingImageCacheKey={imageCacheKey}
            localUri={localImageUri}
            uploading={uploading}
            deleting={deleting}
            onPick={onPickImage}
            onClearLocal={onClearLocalImage}
            onDelete={onDeleteImage}
          />
        </View>

        <Text className="mt-4 text-lg font-bold text-zinc-900">
          Sua foto de perfil
        </Text>
        <Text className="mt-2 text-center text-sm leading-6 text-zinc-500">
          Se a foto veio do Google ou Apple, ela aparece aqui automaticamente.
          Se quiser trocar, remova a atual e adicione uma nova.
        </Text>
      </View>

      <Pressable
        onPress={onEditName}
        disabled={editNameDisabled}
        className="mt-6 flex-row items-center justify-between rounded-3xl border border-rose-100 bg-[#fff9fb] px-4 py-4 active:opacity-80"
        style={{ opacity: editNameDisabled ? 0.65 : 1 }}
      >
        <View className="flex-1 pr-3">
          <Text className="text-xs font-semibold uppercase tracking-widest text-rose-400">
            Nome
          </Text>
          <Text className="mt-1 text-base font-semibold text-zinc-900">
            {name}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <Text className="text-sm font-medium text-zinc-500">
            Editar
          </Text>
          <Feather name="edit-2" size={16} color="#71717a" />
        </View>
      </Pressable>
    </View>
  );
}
