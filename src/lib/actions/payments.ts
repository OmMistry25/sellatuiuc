'use server'

import { createClient } from '@/lib/supabase/server'

export async function createPaymentIntent(orderId: string, userId: string) {
  const supabase = await createClient()
  
  try {
    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create_order', {
      body: {
        orderId,
        userId
      }
    })

    if (error) {
      console.error('Error calling create_order function:', error)
      return { error: 'Failed to create payment intent' }
    }

    if (data.error) {
      console.error('Error from Edge Function:', data.error)
      return { error: data.error }
    }

    return { 
      success: true, 
      client_secret: data.client_secret,
      payment_intent_id: data.payment_intent_id
    }

  } catch (error) {
    console.error('Unexpected error creating payment intent:', error)
    return { error: 'An unexpected error occurred' }
  }
}
