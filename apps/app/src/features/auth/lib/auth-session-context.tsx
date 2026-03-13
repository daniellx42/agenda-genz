import { authClient } from "@/lib/auth-client";
import { createContext, useContext } from "react";

type AuthSessionValue = {
  isPending: boolean;
  session: ReturnType<typeof authClient.useSession>["data"];
};

const AuthSessionContext = createContext<AuthSessionValue | null>(null);

interface AuthSessionProviderProps extends AuthSessionValue {
  children: React.ReactNode;
}

export function AuthSessionProvider({
  children,
  isPending,
  session,
}: AuthSessionProviderProps) {
  return (
    <AuthSessionContext.Provider value={{ isPending, session }}>
      {children}
    </AuthSessionContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthSessionContext);

  if (!context) {
    throw new Error("useAuthSession must be used within AuthSessionProvider");
  }

  return context;
}
