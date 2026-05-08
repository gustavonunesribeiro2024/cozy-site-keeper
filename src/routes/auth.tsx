import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Key, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({ meta: [{ title: "Entrar — KeyAuth Green" }] }),
});

function AuthPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) navigate({ to: "/admin" });
  }, [loading, isAuthenticated, navigate]);

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Bem-vindo!"); navigate({ to: "/admin" });
  };

  const signUp = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${window.location.origin}/admin` },
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Conta criada! Faça login.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="bg-primary p-3 rounded-full shadow-[var(--shadow-glow)]">
              <Key className="w-7 h-7 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-2xl font-bold">KeyAuth Green</h1>
          <p className="text-muted-foreground text-sm">Acesso administrativo</p>
        </div>
        <Card className="p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="signin">Entrar</TabsTrigger>
              <TabsTrigger value="signup">Criar conta</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={signIn} className="space-y-4">
                <div><Label htmlFor="e1">Email</Label><Input id="e1" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-2" /></div>
                <div><Label htmlFor="p1">Senha</Label><Input id="p1" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="mt-2" /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={signUp} className="space-y-4">
                <div><Label htmlFor="e2">Email</Label><Input id="e2" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="mt-2" /></div>
                <div><Label htmlFor="p2">Senha</Label><Input id="p2" type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} required className="mt-2" /></div>
                <Button type="submit" className="w-full" disabled={busy}>{busy ? "Criando..." : "Criar conta"}</Button>
                <p className="text-xs text-muted-foreground">A primeira conta criada vira administrador automaticamente.</p>
              </form>
            </TabsContent>
          </Tabs>
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
