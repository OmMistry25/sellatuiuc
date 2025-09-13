'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { confirmDelivery } from '@/lib/actions/delivery'

interface Order {
  id: string
  state: string
  total_cents: number
  created_at: string
  delivery_proof_path: string | null
  delivery_notes: string | null
  delivered_at: string | null
  auto_release_at: string | null
  listings: {
    id: string
    title: string
    price_cents: number
    is_rental: boolean
  }
  profiles: {
    user_id: string
    display_name: string | null
    handle: string | null
  }
}

export default function ConfirmDeliveryPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    if (id) {
      fetchOrder()
    }
  }, [user, id, router])

  const fetchOrder = async () => {
    if (!user || !id) return

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          state,
          total_cents,
          created_at,
          delivery_proof_path,
          delivery_notes,
          delivered_at,
          auto_release_at,
          buyer_id,
          listings (
            id,
            title,
            price_cents,
            is_rental
          ),
          profiles!orders_seller_id_fkey (
            user_id,
            display_name,
            handle
          )
        `)
        .eq('id', id)
        .single()

      if (orderError || !orderData) {
        setError('Order not found')
        return
      }

      // Check if user is the buyer
      if (orderData.buyer_id !== user.id) {
        setError('Unauthorized: You are not the buyer of this order')
        return
      }

      // Check if order is in correct state
      if (orderData.state !== 'delivered_pending_confirm') {
        setError('Order is not waiting for confirmation')
        return
      }

      setOrder(orderData)

    } catch (error) {
      console.error('Error fetching order:', error)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelivery = async () => {
    if (!user || !order) return

    const confirmed = confirm('Are you sure you have received the item and want to confirm delivery? This will release the payment to the seller.')
    if (!confirmed) return

    setConfirming(true)
    setConfirmError(null)

    try {
      const result = await confirmDelivery(order.id, user.id)
      
      if (result.error) {
        setConfirmError(result.error)
      } else {
        // Redirect to success page
        router.push(`/order/${order.id}/completed`)
      }
    } catch (error) {
      setConfirmError('An unexpected error occurred')
    } finally {
      setConfirming(false)
    }
  }

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSellerName = (profile: any) => {
    return profile?.display_name || profile?.handle || 'Anonymous'
  }

  const getDeliveryProofUrl = async (proofPath: string) => {
    const { data } = await supabase.storage
      .from('delivery-proofs')
      .createSignedUrl(proofPath, 3600) // 1 hour expiry
    
    return data?.signedUrl
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Confirm Delivery
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Order #{order.id.slice(0, 8)} - Please confirm you received the item
                </p>
              </div>
              <Button 
                onClick={() => router.push(`/listing/${order.listings.id}`)}
                variant="outline"
              >
                Back to Listing
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Item</span>
                <span className="font-medium">{order.listings.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Seller</span>
                <span className="font-medium">{getSellerName(order.profiles)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Paid</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPrice(order.total_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Delivered At</span>
                <span className="font-medium">
                  {order.delivered_at ? formatDate(order.delivered_at) : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.delivery_notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Seller Notes</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                    {order.delivery_notes}
                  </p>
                </div>
              )}

              {order.delivery_proof_path && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Delivery Proof</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    The seller has uploaded proof of delivery. You can view it in the chat.
                  </p>
                </div>
              )}

              {order.auto_release_at && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <h4 className="text-sm font-medium text-yellow-800 mb-1">Auto-Release Notice</h4>
                  <p className="text-sm text-yellow-700">
                    If you don't confirm delivery by {formatDate(order.auto_release_at)}, 
                    the payment will be automatically released to the seller.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Confirmation Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Confirm Delivery</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Have you received the item?</h4>
                <p className="text-sm text-green-700">
                  Please confirm that you have received the item as described. 
                  Once confirmed, the payment will be released to the seller.
                </p>
              </div>

              {confirmError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{confirmError}</p>
                </div>
              )}

              <div className="flex space-x-3">
                <Button
                  onClick={() => router.push(`/listing/${order.listings.id}`)}
                  variant="outline"
                  className="flex-1"
                >
                  Back to Listing
                </Button>
                <Button
                  onClick={handleConfirmDelivery}
                  disabled={confirming}
                  className="flex-1"
                >
                  {confirming ? 'Confirming...' : 'Confirm Delivery'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
