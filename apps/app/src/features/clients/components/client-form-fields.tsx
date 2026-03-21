import { SheetTextInput } from "@/components/ui/sheet-text-input";
import type { SheetTextInputRef } from "@/components/ui/sheet-text-input";
import {
  formatCpf,
  formatInstagram,
  formatPhone,
  isValidCpf,
  isValidEmail,
  isValidInstagram,
  isValidPhone,
  normalizeEmail,
  normalizeWhitespace,
} from "@/lib/formatters";
import { Pressable, Switch, Text, View } from "react-native";
import type { ClientFormApi } from "../hooks/use-client-form";
import type { ClientGender } from "../types";

interface ClientFormFieldsProps {
  form: ClientFormApi;
  disabled?: boolean;
  showAdditionalInfo: boolean;
  onToggleAdditionalInfo: (value: boolean) => void;
  inputRefs?: {
    name?: React.RefObject<SheetTextInputRef | null>;
    phone?: React.RefObject<SheetTextInputRef | null>;
  };
}

const GENDER_OPTIONS: Array<{
  label: string;
  value: ClientGender;
}> = [
  { label: "Feminino", value: "FEMALE" },
  { label: "Masculino", value: "MALE" },
  { label: "Outro", value: "OTHER" },
];

function renderFieldErrors(field: {
  state: {
    meta: {
      errors: Array<string | undefined>;
    };
  };
}) {
  return field.state.meta.errors
    .filter((error): error is string => typeof error === "string")
    .map((error, index) => (
      <Text key={index} className="mt-1 text-xs text-red-400">
        {error}
      </Text>
    ));
}

export function ClientFormFields({
  form,
  disabled = false,
  showAdditionalInfo,
  onToggleAdditionalInfo,
  inputRefs,
}: ClientFormFieldsProps) {
  return (
    <>
      <form.Field
        name="name"
        validators={{
          onChange: ({ value }: { value: string }) =>
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
              ref={inputRefs?.name}
              className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${field.state.meta.errors.length ? "border-red-300" : "border-zinc-200"}`}
              placeholder="Nome completo"
              placeholderTextColor="#a1a1aa"
              value={field.state.value}
              onChangeText={field.handleChange}
              maxLength={120}
              editable={!disabled}
            />
            {renderFieldErrors(field)}
          </View>
        )}
      </form.Field>

      <form.Field
        name="phone"
        validators={{
          onChange: ({ value }: { value: string }) => {
            if (!value) return "Telefone é obrigatório";
            if (!isValidPhone(value)) return "Telefone inválido";
            return undefined;
          },
        }}
      >
        {(field) => (
          <View className="mb-4">
            <Text className="mb-1.5 text-xs font-medium text-zinc-500">
              Telefone *
            </Text>
            <SheetTextInput
              ref={inputRefs?.phone}
              className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${field.state.meta.errors.length ? "border-red-300" : "border-zinc-200"}`}
              placeholder="(11) 99999-9999"
              placeholderTextColor="#a1a1aa"
              keyboardType="phone-pad"
              value={field.state.value}
              onChangeText={(value: string) => field.handleChange(formatPhone(value))}
              maxLength={16}
              editable={!disabled}
            />
            {renderFieldErrors(field)}
          </View>
        )}
      </form.Field>

      <form.Field
        name="instagram"
        validators={{
          onChange: ({ value }: { value: string }) =>
            value && !isValidInstagram(value) ? "Instagram inválido" : undefined,
        }}
      >
        {(field) => (
          <View className="mb-4">
            <Text className="mb-1.5 text-xs font-medium text-zinc-500">
              Instagram
            </Text>
            <SheetTextInput
              className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${field.state.meta.errors.length ? "border-red-300" : "border-zinc-200"}`}
              placeholder="@usuario ou url do perfil"
              placeholderTextColor="#a1a1aa"
              autoCapitalize="none"
              value={field.state.value}
              onChangeText={(value: string) =>
                field.handleChange(formatInstagram(value))
              }
              maxLength={120}
              editable={!disabled}
            />
            {renderFieldErrors(field)}
          </View>
        )}
      </form.Field>

      <View className="mb-4 flex-row items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <View className="flex-1 pr-4">
          <Text className="text-sm font-medium text-zinc-700">
            Informações adicionais
          </Text>
          <Text className="mt-0.5 text-xs text-zinc-400">
            Endereço, idade, sexo, CPF, email e observações
          </Text>
        </View>
        <Switch
          value={showAdditionalInfo}
          onValueChange={onToggleAdditionalInfo}
          disabled={disabled}
          trackColor={{ false: "#e4e4e7", true: "#f43f5e" }}
          thumbColor="white"
        />
      </View>

      {showAdditionalInfo ? (
        <>
          <form.Field
            name="email"
            validators={{
              onChange: ({ value }: { value: string }) =>
                value && !isValidEmail(value) ? "Email inválido" : undefined,
            }}
          >
            {(field) => (
              <View className="mb-4">
                <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                  Email
                </Text>
                <SheetTextInput
                  className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${field.state.meta.errors.length ? "border-red-300" : "border-zinc-200"}`}
                  placeholder="email@exemplo.com"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={field.state.value}
                  onChangeText={(value: string) =>
                    field.handleChange(normalizeEmail(value))
                  }
                  maxLength={120}
                  editable={!disabled}
                />
                {renderFieldErrors(field)}
              </View>
            )}
          </form.Field>

          <form.Field
            name="cpf"
            validators={{
              onChange: ({ value }: { value: string }) =>
                value.length > 0 && !isValidCpf(value) ? "CPF inválido" : undefined,
            }}
          >
            {(field) => (
              <View className="mb-4">
                <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                  CPF
                </Text>
                <SheetTextInput
                  className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${field.state.meta.errors.length ? "border-red-300" : "border-zinc-200"}`}
                  placeholder="000.000.000-00"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="numeric"
                  value={field.state.value}
                  onChangeText={(value: string) =>
                    field.handleChange(formatCpf(value))
                  }
                  maxLength={14}
                  editable={!disabled}
                />
                {renderFieldErrors(field)}
              </View>
            )}
          </form.Field>

          <form.Field
            name="address"
            validators={{
              onChange: ({ value }: { value: string }) =>
                normalizeWhitespace(value).length > 240
                  ? "Máximo de 240 caracteres"
                  : undefined,
            }}
          >
            {(field) => (
              <View className="mb-4">
                <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                  Endereço
                </Text>
                <SheetTextInput
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900"
                  placeholder="Rua, número, bairro..."
                  placeholderTextColor="#a1a1aa"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  maxLength={240}
                  editable={!disabled}
                />
                {renderFieldErrors(field)}
              </View>
            )}
          </form.Field>

          <form.Field
            name="age"
            validators={{
              onChange: ({ value }: { value: string }) => {
                if (!value) return undefined;
                const age = Number(value.replace(/\D/g, ""));
                if (!age || age < 1 || age > 120) {
                  return "Idade inválida";
                }
                return undefined;
              },
            }}
          >
            {(field) => (
              <View className="mb-4">
                <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                  Idade
                </Text>
                <SheetTextInput
                  className={`rounded-2xl border bg-zinc-50 px-4 py-3 text-sm text-zinc-900 ${field.state.meta.errors.length ? "border-red-300" : "border-zinc-200"}`}
                  placeholder="Ex: 28"
                  placeholderTextColor="#a1a1aa"
                  keyboardType="numeric"
                  value={field.state.value}
                  onChangeText={(value: string) =>
                    field.handleChange(value.replace(/\D/g, "").slice(0, 3))
                  }
                  maxLength={3}
                  editable={!disabled}
                />
                {renderFieldErrors(field)}
              </View>
            )}
          </form.Field>

          <form.Field name="gender">
            {(field) => (
              <View className="mb-4">
                <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                  Sexo
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {GENDER_OPTIONS.map((option) => {
                    const selected = field.state.value === option.value;

                    return (
                      <Pressable
                        key={option.value}
                        onPress={() =>
                          field.handleChange(selected ? "" : option.value)
                        }
                        disabled={disabled}
                        className={`rounded-full border px-4 py-2.5 ${selected ? "border-rose-200 bg-rose-50" : "border-zinc-200 bg-zinc-50"}`}
                        style={{ opacity: disabled ? 0.6 : 1 }}
                      >
                        <Text
                          className={`text-xs font-semibold ${selected ? "text-rose-500" : "text-zinc-500"}`}
                        >
                          {option.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}
          </form.Field>

          <form.Field name="notes">
            {(field) => (
              <View className="mb-6">
                <Text className="mb-1.5 text-xs font-medium text-zinc-500">
                  Observações
                </Text>
                <SheetTextInput
                  className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900"
                  placeholder="Anotações sobre a cliente..."
                  placeholderTextColor="#a1a1aa"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  maxLength={500}
                  editable={!disabled}
                />
              </View>
            )}
          </form.Field>
        </>
      ) : (
        <View className="mb-6" />
      )}
    </>
  );
}
