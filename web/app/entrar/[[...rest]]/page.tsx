import type { Metadata } from "next";
import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import AuthMarco from "@/components/AuthMarco";

export const metadata: Metadata = { title: "Entrar" };

export default function EntrarPage() {
  return (
    <AuthMarco titulo="Entrá a Mula AI" bajada="Configurá a quién protegés y mirá sus alertas.">
      <Suspense>
        <SignIn routing="path" path="/entrar" signUpUrl="/registro" fallbackRedirectUrl="/app" />
      </Suspense>
    </AuthMarco>
  );
}
