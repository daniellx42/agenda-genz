import { Text, TextInput, type TextInputProps, View } from "react-native";

type AuthTextFieldProps = TextInputProps & {
  error?: string;
  label: string;
};

export function AuthTextField({
  error,
  label,
  ...props
}: AuthTextFieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-xs font-medium text-zinc-500">
        {label}
      </Text>

      <TextInput
        {...props}
        className={`rounded-2xl border bg-zinc-50 px-4 py-3.5 text-sm text-zinc-900 ${error ? "border-red-300" : "border-zinc-200"}`}
        placeholderTextColor="#a1a1aa"
      />

      <View style={{ minHeight: 18 }}>
        {error ? (
          <Text className="text-xs text-red-400">
            {error}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
