"use server";

import { createClient, requireAdminAction } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function saveClient(prevState: { error: string } | null, formData: FormData) {
  try {
    await requireAdminAction();
  } catch {
    return { error: "No autorizado" };
  }

  const supabase = await createClient();
  const id = formData.get("id") as string | null;
  const isEditing = !!id;

  const name = (formData.get("name") as string) || "";
  if (!name.trim()) {
    return { error: "El nombre es obligatorio" };
  }

  const payload = {
    name,
    email: ((formData.get("email") as string) || "").trim() || null,
    phone: ((formData.get("phone") as string) || "").trim() || null,
    phone_landline: ((formData.get("phone_landline") as string) || "").trim() || null,
    postal_code: ((formData.get("postal_code") as string) || "").trim() || null,
    billing_address: ((formData.get("billing_address") as string) || "").trim() || null,
    billing_name: ((formData.get("billing_name") as string) || "").trim() || null,
    cuit: ((formData.get("cuit") as string) || "").trim() || null,
    notes: ((formData.get("notes") as string) || "").trim() || null,
  };

  if (isEditing) {
    const { error } = await supabase.from("clients").update(payload).eq("id", id!);
    if (error) return { error: "Error al actualizar: " + error.message };
  } else {
    const { error } = await supabase.from("clients").insert(payload);
    if (error) return { error: "Error al crear: " + error.message };
  }

  revalidatePath("/admin/clients");
  revalidatePath(`/admin/clients/${id}`);
  return { error: null };
}