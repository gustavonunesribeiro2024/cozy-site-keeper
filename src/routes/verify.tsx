import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Key, ArrowLeft } from "lucide-react";
import { verifyKeyByUsername } from "@/lib/keys.functions";

export const Route = createFileRoute("/verify")({
  component: VerifyPage,
  head: () => ({
    meta: [
      { title: "Verificar Chave — KeyAuth Green" },
      { name: "description", content: "Valide rapidamente sua chave de acesso pelo nome de usuário." },
    ],
  }),
});

function VerifyPage() {
  const verify = useServerFn(verifyKeyByUsername);
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [verified, setVerified] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return setError("Digite um nome de usuário");
    setBusy(true); setError("");
    try {
      const res = await verify({ data: { username: username.trim() } });
      setVerified(res.username);
      toast.success("Chave válida! Acesso concedido.");
      setTimeout(() => navigate({ to: "/" }), 2200);
    } catch (e: any) {
      setError(e.message || "Erro ao verificar"); toast.error(e.message || "Erro");
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-4 rounded-full shadow-[var(--shadow-glow)]">
              <Key className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-1">KeyAuth Green</h1>
          <p className="text-muted-foreground">Verificar Acesso</p>
        </div>

        <Card className="p-8">
          {!verified ? (
            <>
              <h2 className="text-xl font-semibold mb-6">Valide seu nome de usuário</h2>
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="u">Nome de Usuário</Label>
                  <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="seu-usuario" autoFocus disabled={busy} className="mt-2" />
                </div>
                <Button type="submit" disabled={busy} className="w-full">{busy ? "Verificando..." : "Verificar Chave"}</Button>
              </form>
              {error && (
                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex gap-2 items-start">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Acesso Concedido!</h2>
              <p className="text-muted-foreground mb-6">Bem-vindo, <strong className="text-foreground">{verified}</strong></p>
              <Button asChild className="w-full"><Link to="/">Ir para Home</Link></Button>
            </div>
          )}
        </Card>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-primary inline-flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}
