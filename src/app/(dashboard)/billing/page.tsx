import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { createCheckoutSession } from './actions'

interface Organization {
  id: string
  name: string
  stripe_customer_id: string | null
  created_at: string
}

interface MemberMembership {
  organization_id: string
  role: string
  organizations: Organization | null
}

export default async function BillingPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca a associação do usuário com a organização e os dados da organização
  const { data: membershipData } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(*)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const membership = membershipData as unknown as MemberMembership | null
  const organization = membership?.organizations

  if (!organization) {
    return (
      <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
        Nenhuma organização encontrada para este usuário.
      </div>
    )
  }

  const isSubscribed = !!organization.stripe_customer_id

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Faturamento (Billing)</h1>
        <p className="text-muted-foreground">
          Gerencie a assinatura e planos da organização <strong>{organization.name}</strong>.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h3 className="font-semibold text-lg">Plano Atual</h3>
            <p className="text-sm text-muted-foreground">
              {isSubscribed ? 'Você está no Plano Pro' : 'Você está no Plano Gratuito (Free)'}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isSubscribed
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400'
            }`}
          >
            {isSubscribed ? 'Ativo' : 'Básico'}
          </span>
        </div>

        <div className="space-y-2">
          <p className="text-sm">
            <strong>Organização:</strong> {organization.name}
          </p>
          <p className="text-sm">
            <strong>Cargo:</strong> {membership.role === 'owner' ? 'Dono (Owner)' : membership.role === 'admin' ? 'Administrador (Admin)' : 'Membro'}
          </p>
          {isSubscribed && (
            <p className="text-sm">
              <strong>ID do Cliente Stripe:</strong> {organization.stripe_customer_id}
            </p>
          )}
        </div>

        {!isSubscribed ? (
          <form action={createCheckoutSession} className="pt-2">
            <Button type="submit" size="lg" className="w-full sm:w-auto">
              Assinar Plano Pro
            </Button>
          </form>
        ) : (
          <div className="text-sm text-green-600 dark:text-green-400 font-medium pt-2">
            Sua organização já possui uma assinatura Pro ativa!
          </div>
        )}
      </div>
    </div>
  )
}
