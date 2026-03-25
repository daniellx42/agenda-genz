import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { useApiError } from "@/hooks/use-api-error";
import { authClient } from "@/lib/auth-client";
import {
  isValidEmail,
  normalizeEmail,
  normalizeWhitespace,
} from "@/lib/formatters";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { toast } from "sonner-native";

function getNameError(value: string, submitted: boolean) {
  if (!value) {
    return submitted ? "Informe seu nome" : undefined;
  }

  return value.length >= 2 ? undefined : "Use pelo menos 2 caracteres";
}

function getEmailError(value: string, submitted: boolean) {
  if (!value) {
    return submitted ? "Informe seu email" : undefined;
  }

  return isValidEmail(value) ? undefined : "Email invalido";
}

function getPasswordError(value: string, submitted: boolean) {
  if (!value) {
    return submitted ? "Informe uma senha" : undefined;
  }

  return value.length >= 8 ? undefined : "Use no minimo 8 caracteres";
}

function getConfirmPasswordError(
  password: string,
  confirmPassword: string,
  submitted: boolean,
) {
  if (!confirmPassword) {
    return submitted ? "Confirme sua senha" : undefined;
  }

  return confirmPassword === password ? undefined : "As senhas nao conferem";
}

export default function EmailSignUpScreen() {
  const router = useRouter();
  const { showError } = useApiError();
  const { refetch: refetchSession } = authClient.useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedName = useMemo(() => normalizeWhitespace(name), [name]);
  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const nameError = getNameError(normalizedName, submitted);
  const emailError = getEmailError(normalizedEmail, submitted);
  const passwordError = getPasswordError(password, submitted);
  const confirmPasswordError = getConfirmPasswordError(
    password,
    confirmPassword,
    submitted,
  );
  const canSubmit =
    normalizedName.length >= 2 &&
    normalizedEmail.length > 0 &&
    !emailError &&
    password.length >= 8 &&
    confirmPassword === password &&
    !isSubmitting;

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authClient.signUp.email({
        name: normalizedName,
        email: normalizedEmail,
        password,
      });

      if (result.error) {
        throw result.error;
      }

      toast.success("Conta criada com sucesso.");
      await refetchSession();
      router.replace("/");
    } catch (error) {
      showError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      style={{ flex: 1, backgroundColor: "#fff9fb" }}
      contentContainerStyle={{
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 40,
        gap: 16,
      }}
    >
      <View className="rounded-[28px] border border-rose-100 bg-white p-6">
        <Text className="text-xs font-semibold uppercase tracking-[1.8px] text-rose-400">
          Cadastro alternativo
        </Text>
        <Text className="mt-2 text-2xl font-bold text-zinc-900">
          Criar acesso com email
        </Text>
        <Text className="mt-2 text-sm leading-6 text-zinc-500">
          Mantive esse fluxo mais discreto para cumprir a exigencia da Apple sem
          competir com Google e Apple na tela principal.
        </Text>

        <View className="mt-6 gap-2">
          <AuthTextField
            label="Nome"
            error={nameError}
            placeholder="Seu nome completo"
            autoCapitalize="words"
            textContentType="name"
            value={name}
            onChangeText={setName}
          />

          <AuthTextField
            label="Email"
            error={emailError}
            placeholder="email@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />

          <AuthTextField
            label="Senha"
            error={passwordError}
            placeholder="Crie uma senha"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          />

          <AuthTextField
            label="Confirmar senha"
            error={confirmPasswordError}
            placeholder="Repita a senha"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password-new"
            textContentType="newPassword"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <Pressable
          onPress={() => {
            void handleSubmit();
          }}
          disabled={!canSubmit}
          className="mt-4 flex-row items-center justify-center rounded-2xl bg-rose-500 px-4 py-4 active:opacity-80"
          style={{ opacity: canSubmit ? 1 : 0.6 }}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Text className="text-sm font-semibold text-white">
              Criar conta
            </Text>
          )}
        </Pressable>

        <Text className="mt-5 text-center text-xs leading-5 text-zinc-400">
          Ja possui conta?{" "}
          <Text
            className="text-zinc-500 underline"
            accessibilityRole="link"
            onPress={() => {
              router.replace("/email-login");
            }}
          >
            Entrar com email
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}
