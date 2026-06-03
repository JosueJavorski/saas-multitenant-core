import Stripe from 'stripe'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.warn('Warning: STRIPE_SECRET_KEY is not defined in environment variables.')
}

export const stripe = new Stripe(stripeSecretKey || '', {
  // We can specify API version here or let it default to the library's version
})
