import type { Metadata } from "next";
import { Suspense } from "react";
import { SignUp } from "@clerk/nextjs";
import AuthMarco from "@/components/AuthMarco";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegistroPage() {
  return (
    <AuthMarco titulo="Creá tu cuenta" bajada="En dos minutos dejás protegido el WhatsApp de alguien de tu familia.">
      <Suspense>
        <SignUp routing="path" path="/registro" signInUrl="/entrar" fallbackRedirectUrl="/app" />
      </Suspense>
    </AuthMarco>
  );
}
