import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function generateLicenseCode() {
  const seg = () => {
    const bytes = new Uint8Array(2);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  };
  return `${seg()}-${seg()}-${seg()}-${seg()}`;
}

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Acesso restrito a administradores");
}

export const listKeys = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("keys")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  });

export const createKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      username: z.string().min(1),
      expirationDays: z.enum(["1", "7", "30", "90", "vitalicio"]),
    })
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: existing } = await supabaseAdmin
      .from("keys").select("id").eq("username", data.username).maybeSingle();
    if (existing) throw new Error("Nome de usuário já existe");

    let expires_at: string | null = null;
    if (data.expirationDays !== "vitalicio") {
      const d = new Date();
      d.setDate(d.getDate() + parseInt(data.expirationDays));
      expires_at = d.toISOString();
    }
    const code = generateLicenseCode();
    const { error } = await supabaseAdmin.from("keys").insert({
      username: data.username, code, status: "ativa", expires_at,
    });
    if (error) throw new Error(error.message);
    return { success: true, code };
  });

export const togglePauseKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ keyId: z.string() }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { data: key } = await supabaseAdmin.from("keys").select("*").eq("id", data.keyId).maybeSingle();
    if (!key) throw new Error("Chave não encontrada");
    if (key.status === "expirada") throw new Error("Chave expirada não pode ser alterada");
    const newStatus = key.status === "pausada" ? "ativa" : "pausada";
    const { error } = await supabaseAdmin.from("keys").update({
      status: newStatus,
      paused_at: newStatus === "pausada" ? new Date().toISOString() : null,
    }).eq("id", data.keyId);
    if (error) throw new Error(error.message);
    return { success: true, newStatus };
  });

export const deleteKey = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ keyId: z.string() }))
  .handler(async ({ context, data }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.from("keys").delete().eq("id", data.keyId);
    if (error) throw new Error(error.message);
    return { success: true };
  });

export const verifyKeyByUsername = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      username: z.string().trim().min(1).max(64),
      code: z.string().trim().min(1).max(64),
    })
  )
  .handler(async ({ data }) => {
    const GENERIC_ERROR = "Verificação falhou: usuário ou chave inválidos";
    const { data: key, error } = await supabaseAdmin
      .from("keys")
      .select("*")
      .eq("username", data.username)
      .maybeSingle();
    if (error) {
      console.error("[verifyKeyByUsername]", error.message);
      throw new Error(GENERIC_ERROR);
    }
    if (!key) throw new Error(GENERIC_ERROR);
    // Constant-time-ish code comparison
    if (key.code !== data.code) throw new Error(GENERIC_ERROR);
    if (key.status === "pausada") throw new Error(GENERIC_ERROR);
    if (key.status === "expirada") throw new Error(GENERIC_ERROR);
    if (key.expires_at && new Date(key.expires_at) < new Date()) {
      await supabaseAdmin.from("keys").update({ status: "expirada" }).eq("id", key.id);
      throw new Error(GENERIC_ERROR);
    }
    return { valid: true, username: key.username };
  });
