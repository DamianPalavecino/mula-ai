import { redirect } from "next/navigation";

// El simulador público (que llamaba al worker desde el browser) se reemplazó por la
// demo guiada de la landing.
export default function SimuladorPage() {
  redirect("/");
}
