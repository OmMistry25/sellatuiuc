'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function acceptOrder(orderId: string, userId: string) {
  const adminSupabase = createAdminClient()
  
  try {
    // Verify the user is the seller of this order
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('seller_id, state')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { error: 'Order not found' }
    }

    if (order.seller_id !== userId) {
      return { error: 'Unauthorized: You are not the seller of this order' }
    }

    if (order.state !== 'seller_accept') {
      return { error: 'Order is not in the correct state for acceptance' }
    }

    // Update order state to 'delivering'
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({ 
        state: 'delivering',
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return { error: 'Failed to accept order' }
    }

    // Create order event
    await adminSupabase
      .from('order_events')
      .insert({
        order_id: orderId,
        type: 'accepted',
        actor: userId,
        data: {
          message: 'Order accepted by seller'
        }
      })

    // Revalidate relevant paths
    revalidatePath('/seller/orders')
    revalidatePath(`/listing/${orderId}`)

    return { success: true }

  } catch (error) {
    console.error('Error accepting order:', error)
    return { error: 'An unexpected error occurred' }
  }
}

export async function rejectOrder(orderId: string, userId: string) {
  const adminSupabase = createAdminClient()
  
  try {
    // Verify the user is the seller of this order
    const { data: order, error: orderError } = await adminSupabase
      .from('orders')
      .select('seller_id, state')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return { error: 'Order not found' }
    }

    if (order.seller_id !== userId) {
      return { error: 'Unauthorized: You are not the seller of this order' }
    }

    if (order.state !== 'seller_accept') {
      return { error: 'Order is not in the correct state for rejection' }
    }

    // Update order state to 'cancelled'
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({ 
        state: 'cancelled',
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return { error: 'Failed to reject order' }
    }

    // Create order event
    await adminSupabase
      .from('order_events')
      .insert({
        order_id: orderId,
        type: 'cancelled',
        actor: userId,
        data: {
          message: 'Order rejected by seller'
        }
      })

    // TODO: Cancel the Stripe PaymentIntent if it exists
    // This would require calling the Stripe API to cancel the payment intent

    // Revalidate relevant paths
    revalidatePath('/seller/orders')
    revalidatePath(`/listing/${orderId}`)

    return { success: true }

  } catch (error) {
    console.error('Error rejecting order:', error)
    return { error: 'An unexpected error occurred' }
  }
}
