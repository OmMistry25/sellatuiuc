'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { markOrderAsDelivered } from '@/lib/actions/delivery'

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

export default function DeliverOrderPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [deliveryNotes, setDeliveryNotes] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

      // Check if user is the seller
      if (orderData.seller_id !== user.id) {
        setError('Unauthorized: You are not the seller of this order')
        return
      }

      // Check if order is in correct state
      if (orderData.state !== 'delivering') {
        setError('Order is not in delivering state')
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !order || !user) return

    setUploading(true)
    setUploadError(null)

    try {
      // Create file path: delivery-proofs/{seller_id}/{order_id}/{filename}
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${order.id}/${fileName}`

      // Upload file to delivery-proofs bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      // Update order state using server action
      console.log('Calling markOrderAsDelivered with:', {
        orderId: order.id,
        userId: user.id,
        filePath,
        deliveryNotes
      })
      
      const result = await markOrderAsDelivered(order.id, user.id, filePath, deliveryNotes)
      
      console.log('markOrderAsDelivered result:', result)
      
      if (result.error) {
        throw new Error(result.error)
      }

      setUploadSuccess(true)
      
      // Redirect to seller orders after 2 seconds
      setTimeout(() => {
        router.push('/seller/orders')
      }, 2000)

    } catch (error) {
      console.error('Error uploading delivery proof:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
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
          <Button onClick={() => router.push('/seller/orders')}>Back to Orders</Button>
        </div>
      </div>
    )
  }

  if (uploadSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">Delivery Proof Uploaded!</h2>
          <p className="text-gray-600 mb-4">
            The buyer has been notified and will confirm delivery within 7 days.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting to your orders...
          </p>
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
                  Mark as Delivered
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  Upload proof of delivery for Order #{order.id.slice(0, 8)}
                </p>
              </div>
              <Button 
                onClick={() => router.push('/seller/orders')}
                variant="outline"
              >
                Back to Orders
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
                <span className="text-sm text-gray-600">Buyer</span>
                <span className="font-medium">{getBuyerName(order.profiles)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPrice(order.total_cents)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status</span>
                <Badge className="bg-purple-100 text-purple-800">
                  {order.state.replace('_', ' ')}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Proof Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Upload Delivery Proof</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="delivery-notes" className="text-sm font-medium">
                  Delivery Notes (Optional)
                </Label>
                <Textarea
                  id="delivery-notes"
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="Add any notes about the delivery..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="delivery-proof" className="text-sm font-medium">
                  Delivery Proof *
                </Label>
                <p className="text-xs text-gray-500 mt-1 mb-2">
                  Upload a photo, receipt, or document as proof of delivery
                </p>
                <Input
                  ref={fileInputRef}
                  id="delivery-proof"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="mt-1"
                />
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-600">{uploadError}</p>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• The buyer will be notified of delivery</li>
                  <li>• They have 7 days to confirm receipt</li>
                  <li>• If confirmed, funds will be released to you</li>
                  <li>• If not confirmed, funds auto-release after 7 days</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
