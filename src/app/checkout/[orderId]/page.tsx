'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Order {
  id: string
  state: string
  total_cents: number
  created_at: string
  stripe_payment_intent_id: string | null
  listings: {
    id: string
    title: string
    price_cents: number
    is_rental: boolean
  }
}

interface CheckoutFormProps {
  order: Order
  clientSecret: string
  onSuccess: () => void
  onError: (error: string) => void
}

function CheckoutForm({ order, clientSecret, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/${order.id}/success`,
        },
      })

      if (error) {
        onError(error.message || 'Payment failed')
      } else {
        onSuccess()
      }
    } catch (error) {
      onError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button
        type="submit"
        disabled={!stripe || loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Processing...' : `Pay ${(order.total_cents / 100).toFixed(2)}`}
      </Button>
    </form>
  )
}

export default function CheckoutPage() {
  const { orderId } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentError, setPaymentError] = useState<string | null>(null)

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
      // Get order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          id,
          state,
          total_cents,
          created_at,
          stripe_payment_intent_id,
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

      // Check if order is in correct state (initiated or seller_accept)
      if (!['initiated', 'seller_accept'].includes(orderData.state)) {
        setError('Order is not ready for payment')
        return
      }

      setOrder(orderData)

      // If we already have a PaymentIntent, get its client secret
      if (orderData.stripe_payment_intent_id) {
        await fetchPaymentIntentClientSecret(orderData.stripe_payment_intent_id)
      } else {
        // Create a new PaymentIntent
        await createPaymentIntent()
      }

    } catch (error) {
      console.error('Error fetching order:', error)
      setError('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const createPaymentIntent = async () => {
    if (!user || !orderId) return

    try {
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, userId: user.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create payment intent')
      }

      setClientSecret(data.client_secret)
    } catch (error) {
      console.error('Error creating payment intent:', error)
      setError('Failed to initialize payment')
    }
  }

  const fetchPaymentIntentClientSecret = async (paymentIntentId: string) => {
    try {
      // We need to get the client secret from our Edge Function
      // For now, we'll recreate the PaymentIntent to get a fresh client secret
      await createPaymentIntent()
    } catch (error) {
      console.error('Error fetching payment intent:', error)
      setError('Failed to load payment information')
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

  const handlePaymentSuccess = () => {
    // Redirect to success page
    router.push(`/checkout/${orderId}/success`)
  }

  const handlePaymentError = (error: string) => {
    setPaymentError(error)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Secure checkout powered by Stripe
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                <span className="text-sm text-gray-600">Type</span>
                <span className="font-medium">
                  {order.listings.is_rental ? 'Rental' : 'Purchase'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Order Date</span>
                <span className="font-medium">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className="bg-blue-100 text-blue-800">
                  {order.state.replace('_', ' ')}
                </Badge>
              </div>
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-green-600">
                    {formatPrice(order.total_cents)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              {clientSecret ? (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                  <CheckoutForm
                    order={order}
                    clientSecret={clientSecret}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                  />
                </Elements>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading payment form...</p>
                </div>
              )}
              
              {paymentError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{paymentError}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
