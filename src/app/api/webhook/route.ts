import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase/client'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

if (!STRIPE_SECRET_KEY) {
  throw new Error('Missing environment variable STRIPE_SECRET_KEY')
}

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing environment variable STRIPE_WEBHOOK_SECRET')
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
})

export async function POST(request: Request) {
  console.log('Webhook received:', new Date().toISOString())
  
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET
    )

    console.log('Webhook event type:', event.type)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (!userId) {
          console.error('Missing userId in session metadata')
          throw new Error('Missing userId in session metadata')
        }

        console.log('Processing checkout session for user:', userId)

        // Get the price ID from the line items
        const lineItems = await stripe.checkout.sessions.listLineItems(session.id)
        const priceId = lineItems.data[0]?.price?.id

        // Determine token amount based on price ID
        let tokenAmount = 0
        switch (priceId) {
          case 'price_1RCVoG09dcGq3dt0eX4G80dp':
            tokenAmount = 1000
            break
          case 'price_1RCVnp09dcGq3dt0wzYrvtwH':
            tokenAmount = 500
            break
          case 'price_1RCVnT09dcGq3dt0E2n0e8ut':
            tokenAmount = 100
            break
          default:
            console.error('Unknown price ID:', priceId)
            throw new Error(`Unknown price ID: ${priceId}`)
        }

        console.log('Token amount to credit:', tokenAmount)

        // Record the transaction
        const { error: transactionError } = await supabase
          .from('fractitoken_transactions')
          .insert({
            user_id: userId,
            amount: tokenAmount,
            transaction_type: 'CREDIT',
            description: `Purchase of ${tokenAmount} tokens`,
            stripe_session_id: session.id
          })

        if (transactionError) {
          console.error('Transaction recording error:', transactionError)
          throw transactionError
        }

        console.log('Transaction recorded successfully')

        // Update user's token balance
        const { error: balanceError } = await supabase.rpc('update_token_balance', {
          p_user_id: userId,
          p_amount: tokenAmount
        })

        if (balanceError) {
          console.error('Balance update error:', balanceError)
          throw balanceError
        }

        console.log('Balance updated successfully')
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
} 