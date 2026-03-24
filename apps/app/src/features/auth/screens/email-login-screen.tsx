import { AuthTextField } from "@/features/auth/components/auth-text-field";
import { useApiError } from "@/hooks/use-api-error";
import { authClient } from "@/lib/auth-client";
import { isValidEmail, normalizeEmail } from "@/lib/formatters";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

function getEmailError(value: string, submitted: boolean) {
  if (!value) {
    return submitted ? "Informe seu email" : undefined;
  }

  return isValidEmail(value) ? undefined : "Email invalido";
}

function getPasswordError(value: string, submitted: boolean) {
  if (!value) {
    return submitted ? "Informe sua senha" : undefined;
  }

  return undefined;
}

export default function EmailLoginScreen() {
  const router = useRouter();
  const { showError } = useApiError();
  const { refetch: refetchSession } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedEmail = useMemo(() => normalizeEmail(email), [email]);
  const emailError = getEmailError(normalizedEmail, submitted);
  const passwordError = getPasswordError(password, submitted);
  const canSubmit =
    normalizedEmail.length > 0 &&
    !emailError &&
    password.length > 0 &&
    !passwordError &&
    !isSubmitting;

  const handleSubmit = async () => {
    setSubmitted(true);

    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await authClient.signIn.email({
        email: normalizedEmail,
        password,
        callbackURL: "/appointments",
        rememberMe: true,
      });

      if (result.error) {
        throw result.error;
      }

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
          Acesso alternativo
        </Text>
        <Text className="mt-2 text-2xl font-bold text-zinc-900">
          Entrar com email e senha
        </Text>
        <Text className="mt-2 text-sm leading-6 text-zinc-500">
          Esse acesso fica disponivel para revisao e suporte. Para uso normal,
          priorize Google ou Apple na tela principal.
        </Text>

        <View className="mt-6 gap-2">
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
            placeholder="Sua senha"
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="current-password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
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
              Entrar
            </Text>
          )}
        </Pressable>

        <Text className="mt-5 text-center text-xs leading-5 text-zinc-400">
          Ainda nao tem acesso por email?{" "}
          <Text
            className="text-zinc-500 underline"
            accessibilityRole="link"
            onPress={() => {
              router.push("/email-sign-up");
            }}
          >
            Criar conta
          </Text>
        </Text>
      </View>
    </ScrollView>
  );
}
