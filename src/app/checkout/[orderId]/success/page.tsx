'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
}

export default function CheckoutSuccessPage() {
  const { orderId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/auth/signin')
      return
    }
    if (orderId) {
      fetchOrder()
    }
  }, [user, orderId, router])

  const fetchOrder = async () => {
    if (!user || !orderId) return

    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          state,
          total_cents,
          created_at,
          buyer_id,
          listings (
            id,
            title,
            price_cents,
            is_rental
          )
        `)
        .eq('id', orderId)
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

      setOrder(orderData)

    } catch (error) {
      console.error('Error fetching order:', error)
      setError('An error occurred')
    } finally {
      setLoading(false)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Payment Successful!</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Your order has been processed
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

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="text-center">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <CardTitle className="text-2xl text-green-600">Payment Complete!</CardTitle>
            <p className="text-gray-600">
              Thank you for your purchase. Your order is now being processed.
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Order Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Order ID</span>
                <span className="font-mono text-sm">#{order.id.slice(0, 8)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Item</span>
                <span className="font-medium">{order.listings.title}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Paid</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPrice(order.total_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {order.state.replace('_', ' ')}
                </Badge>
              </div>
            </div>

            {/* Next Steps */}
            <div className="text-left">
              <h3 className="font-semibold text-gray-900 mb-2">What's Next?</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• The seller will be notified of your payment</li>
                <li>• You can chat with the seller about delivery details</li>
                <li>• The seller will confirm the order and arrange delivery</li>
                <li>• You'll receive updates as the order progresses</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button
                onClick={() => router.push(`/listing/${order.listings.id}`)}
                variant="outline"
                className="flex-1"
              >
                View Listing
              </Button>
              <Button
                onClick={() => router.push(`/order/${order.id}/chat`)}
                className="flex-1"
              >
                Chat with Seller
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
