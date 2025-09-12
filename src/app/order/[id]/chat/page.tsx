'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import OrderChat from '@/components/chat/OrderChat'

interface Order {
  id: string
  state: string
  total_cents: number
  created_at: string
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

export default function OrderChatPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [threadId, setThreadId] = useState<string | null>(null)

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
      // Get order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          state,
          total_cents,
          created_at,
          buyer_id,
          seller_id,
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
        .eq('id', id)
        .single()

      if (orderError || !orderData) {
        setError('Order not found')
        return
      }

      // Check if user is either buyer or seller
      if (orderData.buyer_id !== user.id && orderData.seller_id !== user.id) {
        setError('Unauthorized: You are not part of this order')
        return
      }

      setOrder(orderData)

      // Get thread for this order
      const { data: threadData, error: threadError } = await supabase
        .from('threads')
        .select('id')
        .eq('order_id', id)
        .single()

      if (!threadError && threadData) {
        setThreadId(threadData.id)
      }

    } catch (error) {
      console.error('Error fetching order:', error)
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

  const isSeller = order && user && order.seller_id === user.id

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order chat...</p>
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
                  Order Chat #{order.id.slice(0, 8)}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {isSeller ? 'Chat with buyer' : 'Chat with seller'}
                </p>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => router.push('/seller/orders')}
                  variant="outline"
                >
                  Back to Orders
                </Button>
                <Button 
                  onClick={() => router.push('/')}
                  variant="outline"
                >
                  Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {order.listings.title}
              </CardTitle>
              <Badge className={getStatusColor(order.state)}>
                {order.state.replace('_', ' ')}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Item</h4>
                <p className="text-sm text-gray-600">
                  {order.listings.is_rental ? 'Rental' : 'Purchase'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">
                  {isSeller ? 'Buyer' : 'Seller'}
                </h4>
                <p className="text-sm text-gray-600">
                  {isSeller ? getBuyerName(order.profiles) : 'You'}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">Total</h4>
                <p className="text-lg font-semibold text-green-600">
                  {formatPrice(order.total_cents)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chat Component */}
        <Card>
          <CardHeader>
            <CardTitle>Order Communication</CardTitle>
          </CardHeader>
          <CardContent>
            {threadId ? (
              <OrderChat orderId={order.id} threadId={threadId} />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500">Chat thread not found</p>
                <Button 
                  onClick={fetchOrder}
                  variant="outline"
                  className="mt-2"
                >
                  Retry
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
