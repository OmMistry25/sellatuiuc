'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { acceptOrder, rejectOrder } from '@/lib/actions/seller-orders'

interface Order {
  id: string
  state: string
  total_cents: number
  quantity: number
  created_at: string
  stripe_payment_intent_id: string | null
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

export default function SellerOrdersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    fetchOrders()
  }, [user, router])

  const fetchOrders = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          state,
          total_cents,
          quantity,
          created_at,
          stripe_payment_intent_id,
          listings (
            id,
            title,
            price_cents,
            is_rental
          ),
          profiles!orders_buyer_id_fkey (
            user_id,
            display_name,
            handle
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders:', error)
        setError('Failed to load orders')
      } else {
        setOrders(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (state: string) => {
    switch (state) {
      case 'initiated':
        return 'bg-yellow-100 text-yellow-800'
      case 'seller_accept':
        return 'bg-blue-100 text-blue-800'
      case 'delivering':
        return 'bg-purple-100 text-purple-800'
      case 'delivered_pending_confirm':
        return 'bg-orange-100 text-orange-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
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

  const getBuyerName = (profile: any) => {
    return profile?.display_name || profile?.handle || 'Anonymous'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={fetchOrders}>Try Again</Button>
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
                <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage incoming orders from buyers
                </p>
              </div>
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Orders from buyers will appear here when they purchase your items.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <Badge className={getStatusColor(order.state)}>
                      {order.state.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {formatDate(order.created_at)}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Order Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Item Details</h4>
                      <p className="text-sm text-gray-600">{order.listings.title}</p>
                      <p className="text-sm text-gray-500">
                        {order.listings.is_rental ? 'Rental' : 'Purchase'} • Qty: {order.quantity}
                      </p>
                    </div>

                    {/* Buyer Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Buyer</h4>
                      <p className="text-sm text-gray-600">
                        {getBuyerName(order.profiles)}
                      </p>
                    </div>

                    {/* Payment Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Payment</h4>
                      <p className="text-lg font-semibold text-green-600">
                        {formatPrice(order.total_cents)}
                      </p>
                      {order.stripe_payment_intent_id && (
                        <p className="text-xs text-gray-500">
                          Payment: {order.stripe_payment_intent_id.slice(0, 20)}...
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex space-x-3">
                      <Button
                        onClick={() => router.push(`/listing/${order.listings.id}`)}
                        variant="outline"
                        size="sm"
                      >
                        View Listing
                      </Button>
                      
                      {order.state === 'seller_accept' && (
                        <>
                          <Button
                            onClick={() => handleAcceptOrder(order.id)}
                            size="sm"
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? 'Processing...' : 'Accept Order'}
                          </Button>
                          <Button
                            onClick={() => handleRejectOrder(order.id)}
                            variant="destructive"
                            size="sm"
                            disabled={actionLoading === order.id}
                          >
                            {actionLoading === order.id ? 'Processing...' : 'Reject Order'}
                          </Button>
                        </>
                      )}
                      
                      {order.state === 'delivering' && (
                        <Button
                          onClick={() => router.push(`/order/${order.id}/deliver`)}
                          size="sm"
                        >
                          Mark as Delivered
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return

    setActionLoading(orderId)
    try {
      const result = await acceptOrder(orderId, user.id)
      
      if (result.error) {
        alert(`Error: ${result.error}`)
      } else {
        // Refresh orders to show updated state
        await fetchOrders()
        alert('Order accepted successfully!')
      }
    } catch (error) {
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectOrder = async (orderId: string) => {
    if (!user) return

    const confirmed = confirm('Are you sure you want to reject this order? This action cannot be undone.')
    if (!confirmed) return

    setActionLoading(orderId)
    try {
      const result = await rejectOrder(orderId, user.id)
      
      if (result.error) {
        alert(`Error: ${result.error}`)
      } else {
        // Refresh orders to show updated state
        await fetchOrders()
        alert('Order rejected successfully!')
      }
    } catch (error) {
      alert('An unexpected error occurred')
    } finally {
      setActionLoading(null)
    }
  }
}
