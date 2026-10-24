"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { PROVINCIAS } from "@/lib/extraccion";
import { validarSetup, type ErroresSetup } from "@/lib/setup";

export interface EstadoSetup {
  errores?: ErroresSetup;
  error?: string;
}

// Una fila de protegidos por usuario (demo): update si existe, insert si no.
export async function guardarProtegido(_prev: EstadoSetup, form: FormData): Promise<EstadoSetup> {
  const sesion = await requireUser();
  const r = validarSetup(
    {
      nombre: form.get("nombre"),
      telefono: form.get("telefono"),
      provincia: form.get("provincia"),
      contactos: form.get("contactos"),
      familiares: form.get("familiares"),
    },
    PROVINCIAS,
  );
  if (!r.ok) return { errores: r.errores };

  const sb = supabaseAdmin();
  const normalizar = async (valor: string) => {
    const { data, error } = await sb.rpc("normalizar", { tipo: "telefono", valor });
    if (error) throw new Error(error.message);
    return (data as string | null) || valor.replace(/\D/g, "");
  };

  try {
    const fila = {
      owner: sesion.userId,
      nombre: r.datos.nombre,
      telefono: await normalizar(r.datos.telefono),
      provincia: r.datos.provincia,
      contactos_confianza: await Promise.all(r.datos.contactos.map(normalizar)),
      familiares: await Promise.all(r.datos.familiares.map(normalizar)),
    };
    const { data: existente, error: errSel } = await sb
      .from("protegidos")
      .select("id")
      .eq("owner", sesion.userId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (errSel) throw new Error(errSel.message);
    const { error } = existente
      ? await sb.from("protegidos").update(fila).eq("id", existente.id).eq("owner", sesion.userId)
      : await sb.from("protegidos").insert(fila);
    if (error) throw new Error(error.message);
  } catch (e) {
    console.error("[app/setup]", (e as Error).message);
    return { error: "No pudimos guardar. Probá de nuevo en unos segundos." };
  }

  revalidatePath("/app");
  redirect("/app");
}
