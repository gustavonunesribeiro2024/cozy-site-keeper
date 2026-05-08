import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
} as const;

const JSON_HEADERS = {
  "Content-Type": "application/json",
  ...CORS_HEADERS,
};

const BodySchema = z.object({
  username: z.string().trim().min(1).max(64),
  code: z.string().trim().min(1).max(64),
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export const Route = createFileRoute("/api/validate-key")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: CORS_HEADERS }),
      POST: async ({ request }) => {
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return json({ valid: false, message: "JSON inválido" }, 400);
        }

        const parsed = BodySchema.safeParse(raw);
        if (!parsed.success) {
          return json({ valid: false, message: "Parâmetros inválidos" }, 400);
        }

        const { username, code } = parsed.data;
        const GENERIC = "Usuário ou chave inválidos";

        const { data: key, error } = await supabaseAdmin
          .from("keys")
          .select("*")
          .eq("username", username)
          .maybeSingle();

        if (error) {
          console.error("[validate-key]", error.message);
          return json({ valid: false, message: GENERIC }, 401);
        }
        if (!key || key.code !== code) return json({ valid: false, message: GENERIC }, 401);
        if (key.status === "pausada") return json({ valid: false, message: GENERIC }, 401);
        if (key.status === "expirada") return json({ valid: false, message: GENERIC }, 401);
        if (key.expires_at && new Date(key.expires_at) < new Date()) {
          await supabaseAdmin.from("keys").update({ status: "expirada" }).eq("id", key.id);
          return json({ valid: false, message: GENERIC }, 401);
        }

        return json({ valid: true, message: "Sucesso", username: key.username });
      },
    },
  },
});
