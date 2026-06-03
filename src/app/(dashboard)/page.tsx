import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao Dashboard</h1>
        <p className="text-muted-foreground">
          Esta é uma rota protegida. Você está logado como <strong className="text-foreground">{user?.email}</strong>.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg">Métricas da Organização</h3>
          <p className="text-sm text-muted-foreground mt-2">Dados de uso e faturamento do multitenant.</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg">Assinatura Stripe</h3>
          <p className="text-sm text-muted-foreground mt-2">Gerencie planos e métodos de pagamento.</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-lg">Configurações</h3>
          <p className="text-sm text-muted-foreground mt-2">Configurar membros e permissões.</p>
        </div>
      </div>
    </div>
  )
}
