'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function markOrderAsDelivered(
  orderId: string, 
  userId: string, 
  deliveryProofPath: string,
  deliveryNotes?: string
) {
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

    if (order.state !== 'delivering') {
      return { error: 'Order is not in delivering state' }
    }

    // Update order state to delivered_pending_confirm
    const { error: updateError } = await adminSupabase
      .from('orders')
      .update({
        state: 'delivered_pending_confirm',
        delivery_proof_path: deliveryProofPath,
        delivery_notes: deliveryNotes || null,
        delivered_at: new Date().toISOString(),
        auto_release_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        updated_at: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return { error: 'Failed to update order' }
    }

    // Create order event
    await adminSupabase
      .from('order_events')
      .insert({
        order_id: orderId,
        type: 'delivered',
        actor: userId,
        data: {
          message: 'Item delivered with proof',
          delivery_proof_path: deliveryProofPath,
          delivery_notes: deliveryNotes
        }
      })

    // Revalidate relevant paths
    revalidatePath('/seller/orders')
    revalidatePath(`/order/${orderId}/deliver`)

    return { success: true }

  } catch (error) {
    console.error('Error marking order as delivered:', error)
    return { error: 'An unexpected error occurred' }
  }
}
