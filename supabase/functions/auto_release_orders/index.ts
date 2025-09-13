// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@^14.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Starting auto-release job...')

    // Find orders that are due for auto-release
    const { data: dueOrders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        state,
        stripe_payment_intent_id,
        total_cents,
        seller_id,
        buyer_id,
        auto_release_at,
        delivered_at
      `)
      .eq('state', 'delivered_pending_confirm')
      .lte('auto_release_at', new Date().toISOString())
      .not('stripe_payment_intent_id', 'is', null)

    if (ordersError) {
      console.error('Error fetching due orders:', ordersError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch due orders' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Found ${dueOrders?.length || 0} orders due for auto-release`)

    if (!dueOrders || dueOrders.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'No orders due for auto-release',
          processed: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    let processedCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each due order
    for (const order of dueOrders) {
      try {
        console.log(`Processing order ${order.id} for auto-release`)

        // Capture the Stripe PaymentIntent
        if (order.stripe_payment_intent_id) {
          const paymentIntent = await stripe.paymentIntents.capture(
            order.stripe_payment_intent_id
          )

          console.log(`Captured payment intent ${paymentIntent.id} for order ${order.id}`)
        }

        // Update order state to completed
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            state: 'completed',
            confirmed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            updated_by: order.buyer_id // System action
          })
          .eq('id', order.id)

        if (updateError) {
          throw new Error(`Failed to update order: ${updateError.message}`)
        }

        // Create order event
        await supabase
          .from('order_events')
          .insert({
            order_id: order.id,
            type: 'auto_released',
            actor: order.buyer_id,
            data: {
              message: 'Order auto-released after 7 days',
              auto_release_at: order.auto_release_at,
              delivered_at: order.delivered_at
            }
          })

        // TODO: Create payout record for seller
        // This would involve creating a record in the payouts table
        // and potentially initiating a Stripe transfer to the seller

        processedCount++
        console.log(`Successfully auto-released order ${order.id}`)

      } catch (error) {
        errorCount++
        const errorMessage = `Failed to process order ${order.id}: ${error.message}`
        errors.push(errorMessage)
        console.error(errorMessage)
      }
    }

    const result = {
      message: 'Auto-release job completed',
      processed: processedCount,
      errors: errorCount,
      errorDetails: errors
    }

    console.log('Auto-release job result:', result)

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in auto-release job:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
