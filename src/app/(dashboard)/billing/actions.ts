'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'

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

export async function createCheckoutSession() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Busca a organização do usuário logado
  const { data: membershipData } = await supabase
    .from('organization_members')
    .select('organization_id, role, organizations(*)')
    .eq('user_id', user.id)
    .limit(1)
    .single()

  const membership = membershipData as unknown as MemberMembership | null
  const organization = membership?.organizations

  if (!organization) {
    redirect('/billing?error=organizacao_nao_encontrada')
  }

  // Obtém o host e protocolo atuais para montar as URLs de retorno absoluto
  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  let checkoutUrl: string | null = null

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Plano Pro SaaS',
              description: 'Acesso total aos recursos do SaaS Multitenant Core',
            },
            unit_amount: 4900, // R$ 49,90 = 4900 centavos
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      client_reference_id: organization.id,
      metadata: {
        organizationId: organization.id,
      },
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/billing?checkout=cancel`,
    })

    checkoutUrl = session.url
  } catch (stripeError) {
    console.error('Erro ao gerar checkout do Stripe:', stripeError)
    redirect('/billing?error=stripe_checkout_failed')
  }

  if (checkoutUrl) {
    redirect(checkoutUrl)
  } else {
    redirect('/billing?error=checkout_session_not_created')
  }
}
