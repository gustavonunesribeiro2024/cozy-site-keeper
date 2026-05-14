import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2, Pause, Play, Plus, Clock, Calendar, Copy, Key, LogOut, Home as HomeIcon } from "lucide-react";
import { listKeys, createKey, togglePauseKey, deleteKey } from "@/lib/keys.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({ meta: [{ title: "Painel Admin — KeyAuth Green" }] }),
});

function AdminPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/auth" });
  }, [loading, isAuthenticated, navigate]);

  const list = useServerFn(listKeys);
  const create = useServerFn(createKey);
  const toggle = useServerFn(togglePauseKey);
  const remove = useServerFn(deleteKey);
  const qc = useQueryClient();

  const { data: keys, isLoading, error } = useQuery({
    queryKey: ["keys"],
    queryFn: () => list(),
    enabled: isAuthenticated,
  });

  const createMut = useMutation({
    mutationFn: (data: { username: string; expirationDays: "1"|"7"|"30"|"90"|"vitalicio" }) => create({ data }),
    onSuccess: (r) => { setLastCode(r.code); toast.success("Chave criada!"); qc.invalidateQueries({ queryKey: ["keys"] }); },
    onError: (e: Error) => toast.error(e.message),
  });
  const toggleMut = useMutation({
    mutationFn: (keyId: string) => toggle({ data: { keyId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["keys"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const deleteMut = useMutation({
    mutationFn: (keyId: string) => remove({ data: { keyId } }),
    onSuccess: () => { toast.success("Chave deletada"); qc.invalidateQueries({ queryKey: ["keys"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [username, setUsername] = useState("");
  const [exp, setExp] = useState<"1"|"7"|"30"|"90"|"vitalicio">("7");
  const [lastCode, setLastCode] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copiado!"); };
  const statusClass = (s: string) =>
    s === "ativa" ? "bg-primary/20 text-primary"
    : s === "pausada" ? "bg-yellow-500/20 text-yellow-400"
    : "bg-destructive/20 text-destructive";
  const remaining = (exp: string | null, status: string) => {
    if (status === "expirada") return "Expirada";
    if (!exp) return "Vitalício";
    const d = new Date(exp);
    if (d < new Date()) return "Expirada";
    return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
  };

  if (loading || !isAuthenticated) return <div className="p-8 text-center text-muted-foreground">Carregando...</div>;

  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 backdrop-blur bg-background/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg"><Key className="w-5 h-5 text-primary-foreground" /></div>
            <div>
              <h1 className="font-bold">Painel Admin</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/"><HomeIcon className="w-4 h-4" /></Link></Button>
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()}><LogOut className="w-4 h-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Criar Nova Chave</h2>
          <form
            onSubmit={(e) => { e.preventDefault(); if (!username.trim()) return toast.error("Nome obrigatório"); createMut.mutate({ username: username.trim(), expirationDays: exp }); setUsername(""); }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div>
              <Label htmlFor="u">Nome de usuário</Label>
              <Input id="u" value={username} onChange={e => setUsername(e.target.value)} placeholder="usuario01" className="mt-2" disabled={createMut.isPending} />
            </div>
            <div>
              <Label>Expiração</Label>
              <Select value={exp} onValueChange={(v) => setExp(v as any)}>
                <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Dia</SelectItem>
                  <SelectItem value="7">7 Dias</SelectItem>
                  <SelectItem value="30">30 Dias</SelectItem>
                  <SelectItem value="90">3 Meses</SelectItem>
                  <SelectItem value="vitalicio">Vitalício</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full" disabled={createMut.isPending}>
                <Plus className="w-4 h-4 mr-2" />{createMut.isPending ? "Criando..." : "Criar Chave"}
              </Button>
            </div>
          </form>

          {lastCode && (
            <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Key className="w-4 h-4" />Código gerado — envie ao usuário:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-background border border-border rounded px-3 py-2 font-mono text-sm tracking-widest">{lastCode}</code>
                <Button size="sm" variant="outline" onClick={() => copy(lastCode)}><Copy className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => setLastCode(null)}>✕</Button>
              </div>
            </div>
          )}
        </Card>

        <div>
          <h2 className="text-lg font-semibold mb-4">Chaves Registradas</h2>
          {error ? (
            <Card className="p-6 text-center text-destructive">{(error as Error).message}</Card>
          ) : isLoading ? (
            <div className="text-center text-muted-foreground py-12">Carregando...</div>
          ) : keys && keys.length > 0 ? (
            <div className="space-y-3">
              {keys.map((k) => (
                <Card key={k.id} className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-semibold">{k.username}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusClass(k.status)}`}>{k.status}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Key className="w-4 h-4 text-primary" />
                        <code className="text-xs font-mono bg-muted border border-border rounded px-2 py-0.5 tracking-wider break-all">{k.code}</code>
                        <button onClick={() => copy(k.code)} className="text-muted-foreground hover:text-primary"><Copy className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1"><Clock className="w-4 h-4 text-primary" />{remaining(k.expires_at, k.status)}</div>
                        <div className="flex items-center gap-1"><Calendar className="w-4 h-4 text-primary" />Criada: {new Date(k.created_at).toLocaleDateString("pt-BR")}</div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {k.status !== "expirada" && (
                        <Button size="sm" variant="outline" onClick={() => toggleMut.mutate(k.id)}>
                          {k.status === "pausada" ? <><Play className="w-4 h-4 mr-1" />Ativar</> : <><Pause className="w-4 h-4 mr-1" />Pausar</>}
                        </Button>
                      )}
                      <Button size="sm" variant="destructive" onClick={() => setConfirmDel(k.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center text-muted-foreground">Nenhuma chave registrada ainda</Card>
          )}
        </div>
      </main>

      <AlertDialog open={confirmDel !== null} onOpenChange={() => setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar Chave</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDel) deleteMut.mutate(confirmDel); setConfirmDel(null); }} className="bg-destructive hover:bg-destructive/90">Deletar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
