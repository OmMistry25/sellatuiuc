'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateRentalOrder(orderId: string, userId: string, rentalDays: number) {
  const adminSupabase = createAdminClient()
  
  try {
    // Verify the user is the buyer of this order
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select(`
        id,
        buyer_id,
        state,
        listings (
          rental_day_price_cents,
          rental_deposit_cents,
          rental_min_days,
          rental_max_days
        )
      `)
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { error: 'Order not found' }
    }

    if (order.buyer_id !== userId) {
      return { error: 'Unauthorized: You are not the buyer of this order' }
    }

    if (!['initiated', 'seller_accept'].includes(order.state)) {
      return { error: 'Order is not in a state that allows rental period changes' }
    }

    // Validate rental days
    const listing = order.listings
    if (rentalDays < listing.rental_min_days || rentalDays > listing.rental_max_days) {
      return { error: `Rental period must be between ${listing.rental_min_days} and ${listing.rental_max_days} days` }
    }

    // Calculate new pricing
    const subtotal_cents = listing.rental_day_price_cents * rentalDays
    const deposit_cents = listing.rental_deposit_cents
    const total_cents = subtotal_cents + deposit_cents

    // Update order with new rental calculation
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({
        subtotal_cents: subtotal_cents,
        deposit_cents: deposit_cents,
        total_cents: total_cents,
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating rental order:', updateError)
      return { error: `Failed to update order: ${updateError.message}` }
    }

    // Create order event
    await adminSupabase
      .from('order_events')
      .insert({
        order_id: orderId,
        type: 'rental_period_updated',
        actor: userId,
        data: {
          message: `Rental period updated to ${rentalDays} days`,
          rental_days: rentalDays,
          new_subtotal: subtotal_cents,
          new_total: total_cents
        }
      })

    // Revalidate relevant paths
    revalidatePath(`/checkout/rental/${orderId}`)
    revalidatePath(`/listing/${orderId}`)

    return { success: true }

  } catch (error) {
    console.error('Error updating rental order:', error)
    return { error: 'An unexpected error occurred' }
  }
}
