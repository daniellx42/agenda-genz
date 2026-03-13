"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";

import { Button } from "./ui/button";

type GoogleSignInButtonProps = {
  className?: string;
  label?: string;
};

export default function GoogleSignInButton({
  className,
  label = "Entrar com Google",
}: GoogleSignInButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      className={className}
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          try {
            await authClient.signIn.social({
              provider: "google",
              callbackURL: "/admin",
              errorCallbackURL: "/login",
            });
          } catch (error) {
            toast.error("Nao foi possivel iniciar o login com Google.");
          }
        });
      }}
    >
      <span className="flex size-4 items-center justify-center border text-[10px] font-bold">G</span>
      {isPending ? "Redirecionando..." : label}
    </Button>
  );
}
