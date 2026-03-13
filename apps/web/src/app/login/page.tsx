
import GoogleSignInButton from "@/components/google-sign-in-button";
import { Card, CardContent } from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { isAdminRole } from "@/lib/roles";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (session?.user) {
    redirect(isAdminRole(session.user.role) ? "/admin" : "/");
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl items-center">
      <section className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/60 bg-card/80">
          <CardContent className="grid gap-4">
            <GoogleSignInButton className="w-full" />
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
