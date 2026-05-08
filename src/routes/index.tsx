import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Key, Shield, CheckCircle, Lock, LogIn, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "KeyAuth Green — Gerenciamento de Chaves" },
      { name: "description", content: "Sistema completo para criar, validar e gerenciar chaves de acesso com expiração automática." },
    ],
  }),
});

function Home() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-border/50 backdrop-blur bg-background/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg shadow-[var(--shadow-glow)]">
              <Key className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold">KeyAuth Green</h1>
          </div>
          <div className="flex gap-2">
            {isAuthenticated ? (
              <>
                <Button onClick={() => navigate({ to: "/admin" })}>Painel Admin</Button>
                <Button variant="outline" onClick={() => supabase.auth.signOut()}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button asChild>
                <Link to="/auth"><LogIn className="w-4 h-4 mr-2" />Login</Link>
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <header className="text-center mb-14">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Sistema de Gerenciamento de Chaves
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Controle completo das suas chaves de acesso com expiração automática e validação em tempo real.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <Card className="p-8 border-border/60">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-accent p-3 rounded-lg"><Shield className="w-7 h-7 text-primary" /></div>
              <div>
                <h3 className="text-xl font-bold">Painel Administrativo</h3>
                <p className="text-sm text-muted-foreground">Protegido por autenticação</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 text-sm">
              {["Criar chaves personalizadas","Definir períodos de expiração","Pausar e reativar chaves","Deletar quando necessário"].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />{t}</li>
              ))}
            </ul>
            {isAuthenticated ? (
              <Button className="w-full" onClick={() => navigate({ to: "/admin" })}>Acessar Painel</Button>
            ) : (
              <Button className="w-full" asChild><Link to="/auth">Fazer Login</Link></Button>
            )}
          </Card>

          <Card className="p-8 border-border/60">
            <div className="flex items-start gap-4 mb-4">
              <div className="bg-accent p-3 rounded-lg"><Lock className="w-7 h-7 text-primary" /></div>
              <div>
                <h3 className="text-xl font-bold">Verificar Acesso</h3>
                <p className="text-sm text-muted-foreground">Página pública</p>
              </div>
            </div>
            <ul className="space-y-2 mb-6 text-sm">
              {["Validação instantânea de chaves","Verificação de expiração automática","Status em tempo real","Mensagens claras de erro"].map((t) => (
                <li key={t} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />{t}</li>
              ))}
            </ul>
            <Button className="w-full" variant="secondary" asChild><Link to="/verify">Verificar Chave</Link></Button>
          </Card>
        </div>

        <Card className="p-8 border-border/60">
          <h3 className="text-2xl font-bold mb-6">Como Funciona</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { step: "1", title: "Criar Chaves", desc: "Admins criam chaves com nome e validade." },
              { step: "2", title: "Validar Acesso", desc: "Usuários informam o nome de usuário." },
              { step: "3", title: "Verificar Status", desc: "Sistema confere se está ativa e válida." },
              { step: "4", title: "Gerenciar", desc: "Admins pausam, reativam ou deletam." },
            ].map((i) => (
              <div key={i.step} className="text-center">
                <div className="bg-primary text-primary-foreground font-bold w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3">{i.step}</div>
                <h4 className="font-semibold mb-1">{i.title}</h4>
                <p className="text-sm text-muted-foreground">{i.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          KeyAuth Green — Sistema de Gerenciamento de Chaves © 2026
        </div>
      </footer>
    </div>
  );
}
