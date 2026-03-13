import { useAuthSession } from "@/features/auth/lib/auth-session-context";
import { Redirect } from "expo-router";

export default function Index() {
  const { session } = useAuthSession();

  if (session) {
    return <Redirect href="/appointments" />;
  }

  return <Redirect href="/login" />;
}
