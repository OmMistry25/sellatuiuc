'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createOrder(listingId: string) {
  const supabase = await createClient()
  
  // Get the current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError || !user) {
    return { error: 'You must be signed in to create an order' }
  }

  // Get the listing details
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .select('*')
    .eq('id', listingId)
    .eq('status', 'active')
    .single()

  if (listingError || !listing) {
    return { error: 'Listing not found or no longer available' }
  }

  // Check if user is the seller
  if (listing.seller_id === user.id) {
    return { error: 'You cannot buy your own listing' }
  }

  // Check if there's already an active order for this listing by this buyer
  const { data: existingOrder, error: existingError } = await supabase
    .from('orders')
    .select('id')
    .eq('listing_id', listingId)
    .eq('buyer_id', user.id)
    .in('status', ['initiated', 'authorized', 'delivered_pending_confirm'])
    .single()

  if (existingOrder) {
    return { error: 'You already have an active order for this item' }
  }

  // Create the order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      status: 'initiated',
      total_cents: listing.price_cents,
      quantity: 1
    })
    .select()
    .single()

  if (orderError) {
    console.error('Error creating order:', orderError)
    return { error: 'Failed to create order' }
  }

  // Create initial order event
  const { error: eventError } = await supabase
    .from('order_events')
    .insert({
      order_id: order.id,
      event_type: 'order_created',
      actor_id: user.id,
      metadata: {
        message: 'Order created successfully'
      }
    })

  if (eventError) {
    console.error('Error creating order event:', eventError)
  }

  // Create thread for buyer-seller communication
  const { data: thread, error: threadError } = await supabase
    .from('threads')
    .insert({
      order_id: order.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      is_anonymous: true
    })
    .select()
    .single()

  if (threadError) {
    console.error('Error creating thread:', threadError)
  }

  // Revalidate the listing page
  revalidatePath(`/listing/${listingId}`)

  return { success: true, orderId: order.id }
}
