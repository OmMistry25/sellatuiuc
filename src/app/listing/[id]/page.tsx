'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { createOrder } from '@/lib/actions/orders'
import OrderChat from '@/components/chat/OrderChat'

interface Listing {
  id: string
  title: string
  description: string
  price_cents: number | null
  is_rental: boolean
  rental_day_price_cents: number | null
  rental_deposit_cents: number | null
  rental_min_days: number | null
  rental_max_days: number | null
  condition: string
  quantity: number
  delivery_methods: string[]
  campus_location: string | null
  status: string
  views: number
  created_at: string
  seller_id: string
  category_id: string
  category: {
    name: string
  }
  profiles: {
    display_name: string | null
    handle: string | null
  }
}

export default function ListingDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<Array<{ url: string; path: string }>>([])
  const [order, setOrder] = useState<any>(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchListing()
    }
  }, [id])

  useEffect(() => {
    if (user && listing && user.id !== listing.seller_id) {
      checkExistingOrder()
    }
  }, [user, listing])

  const fetchListing = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          category:categories(name),
          profiles:profiles!listings_seller_id_fkey(display_name, handle)
        `)
        .eq('id', id)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('Error fetching listing:', error)
        return
      }

      setListing(data)

      // Fetch images
      const { data: assets, error: assetsError } = await supabase
        .from('listing_assets')
        .select('*')
        .eq('listing_id', id)
        .eq('kind', 'image')

      if (!assetsError && assets) {
        const imageUrls = assets.map(asset => ({
          url: supabase.storage.from('listing-images').getPublicUrl(asset.path).data.publicUrl,
          path: asset.path
        }))
        setImages(imageUrls)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkExistingOrder = async () => {
    if (!user || !listing) return

    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('listing_id', listing.id)
        .eq('buyer_id', user.id)
        .in('status', ['initiated', 'authorized', 'delivered_pending_confirm'])
        .single()

      if (!error && data) {
        setOrder(data)
      }
    } catch (error) {
      // No existing order found, which is fine
    }
  }

  const handleBuyClick = async () => {
    if (!user) {
      router.push('/auth/signin')
      return
    }

    setOrderLoading(true)
    setOrderError(null)

    try {
      const result = await createOrder(listing!.id, user.id)
      
      if (result.error) {
        setOrderError(result.error)
      } else {
        // Refresh the page to show the order timeline
        window.location.reload()
      }
    } catch (error) {
      setOrderError('An unexpected error occurred')
    } finally {
      setOrderLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading listing...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Listing not found</p>
          <Button onClick={() => router.push('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    )
  }

  const formatPrice = (cents: number | null) => {
    if (!cents) return 'Free'
    return `$${(cents / 100).toFixed(2)}`
  }

  const isOwner = user?.id === listing.seller_id

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">UIUC Marketplace</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/')}>
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Images */}
                <div>
                  {images.length > 0 ? (
                    <div className="space-y-4">
                      <Image
                        src={images[0].url}
                        alt={listing.title}
                        width={400}
                        height={256}
                        className="w-full h-64 object-cover rounded-lg"
                      />
                      {images.length > 1 && (
                        <div className="grid grid-cols-4 gap-2">
                          {images.slice(1).map((image, index) => (
                            <Image
                              key={index}
                              src={image.url}
                              alt={`${listing.title} ${index + 2}`}
                              width={64}
                              height={64}
                              className="w-full h-16 object-cover rounded"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <p className="text-gray-500">No images</p>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-6">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
                    <p className="text-lg text-gray-600 mt-2">{listing.category.name}</p>
                  </div>

                  <div>
                    <p className="text-2xl font-bold text-indigo-600">
                      {listing.is_rental ? (
                        <>
                          {formatPrice(listing.rental_day_price_cents)}/day
                          <span className="text-sm text-gray-500 block">
                            Deposit: {formatPrice(listing.rental_deposit_cents)}
                          </span>
                        </>
                      ) : (
                        formatPrice(listing.price_cents)
                      )}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Description</h3>
                    <p className="text-gray-700 mt-2">{listing.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900">Condition</h4>
                      <p className="text-gray-600 capitalize">{listing.condition.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Quantity</h4>
                      <p className="text-gray-600">{listing.quantity}</p>
                    </div>
                  </div>

                  {listing.delivery_methods.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900">Delivery Methods</h4>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {listing.delivery_methods.map(method => (
                          <span
                            key={method}
                            className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded"
                          >
                            {method.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {listing.campus_location && (
                    <div>
                      <h4 className="font-medium text-gray-900">Campus Location</h4>
                      <p className="text-gray-600">{listing.campus_location}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900">Seller</h4>
                    <p className="text-gray-600">
                      {listing.profiles.display_name || listing.profiles.handle || 'Anonymous'}
                    </p>
                  </div>

                  <div className="pt-6 border-t">
                    {isOwner ? (
                      <div className="text-center">
                        <p className="text-gray-600">This is your listing</p>
                      </div>
                    ) : order ? (
                      <div className="text-center">
                        <p className="text-green-600 font-medium">Order #{order.id.slice(0, 8)}</p>
                        <p className="text-sm text-gray-600 capitalize">Status: {order.status.replace('_', ' ')}</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Button 
                          className="w-full" 
                          size="lg"
                          onClick={handleBuyClick}
                          disabled={orderLoading}
                        >
                          {orderLoading ? 'Creating Order...' : (listing.is_rental ? 'Rent Item' : 'Buy Item')}
                        </Button>
                        {orderError && (
                          <p className="text-red-600 text-sm text-center">{orderError}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        {order && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Timeline</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">Order Created</p>
                      <p className="text-sm text-gray-500">Order #{order.id.slice(0, 8)} has been initiated</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Payment Authorization</p>
                      <p className="text-sm text-gray-500">Waiting for payment to be authorized</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Delivery</p>
                      <p className="text-sm text-gray-500">Waiting for seller to deliver the item</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Confirmation</p>
                      <p className="text-sm text-gray-500">Waiting for delivery confirmation</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Chat */}
        {order && (
          <div className="mt-8">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Chat with {isOwner ? 'Buyer' : 'Seller'}</h3>
                <OrderChat orderId={order.id} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
