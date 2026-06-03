import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return new NextResponse('Missing stripe-signature header', { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Falha na assinatura do webhook do Stripe: ${errorMessage}`)
    return new NextResponse(`Webhook Error: ${errorMessage}`, { status: 400 })
  }

  // Escuta o evento de checkout concluído
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const organizationId = session.metadata?.organizationId || session.client_reference_id
    const stripeCustomerId = session.customer as string

    if (!organizationId) {
      console.error('Erro no Webhook: organizationId não encontrado nos metadados da sessão.')
      return new NextResponse('Webhook processed but missing organizationId metadata', { status: 400 })
    }

    // Inicializa o cliente admin do Supabase (bypass RLS)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // Atualiza a organização associada com o ID do cliente criado no Stripe
    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ stripe_customer_id: stripeCustomerId })
      .eq('id', organizationId)

    if (error) {
      console.error(`Erro ao atualizar stripe_customer_id da organização ${organizationId}:`, error.message)
      return new NextResponse(`Database Error: ${error.message}`, { status: 500 })
    }

    console.log(`Organização ${organizationId} atualizada com stripe_customer_id: ${stripeCustomerId}`)
  }

  return NextResponse.json({ received: true })
}
