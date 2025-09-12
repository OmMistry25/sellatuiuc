'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ImageUploader } from './ImageUploader'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase/client'
import { createListingSchema, ticketMetaSchema, type CreateListingInput, type TicketMetaInput } from '@/lib/validators/listing'

interface Category {
  id: string
  name: string
  slug: string
}

export function CreateListingForm() {
  const { user } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [images, setImages] = useState<Array<{ url: string; path: string }>>([])
  const [showTicketMeta, setShowTicketMeta] = useState(false)
  
  const [formData, setFormData] = useState<CreateListingInput>({
    title: '',
    description: '',
    category_id: '',
    price_cents: undefined,
    is_rental: false,
    rental_day_price_cents: undefined,
    rental_deposit_cents: undefined,
    rental_min_days: undefined,
    rental_max_days: undefined,
    condition: 'good',
    quantity: 1,
    delivery_methods: [],
    campus_location: '',
    images: []
  })

  const [ticketMeta, setTicketMeta] = useState<TicketMetaInput>({
    event_title: '',
    event_datetime: '',
    section: '',
    row: '',
    seat: '',
    barcode_format: '',
    transfer_platform: 'other'
  })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching categories:', error)
        return
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const handleInputChange = (field: string, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const handleDeliveryMethodChange = (method: 'in_person' | 'ticket_transfer' | 'barcode_upload' | 'mail', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      delivery_methods: checked
        ? [...prev.delivery_methods, method]
        : prev.delivery_methods.filter(m => m !== method)
    }))
  }

  const handleImageUploaded = (url: string, path: string) => {
    const newImage = { url, path }
    setImages(prev => [...prev, newImage])
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), newImage]
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)
    setErrors({})

    try {
      // Validate form data
      const validatedData = createListingSchema.parse({
        ...formData,
        images
      })

      // Create listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          seller_id: user.id,
          category_id: validatedData.category_id,
          title: validatedData.title,
          description: validatedData.description,
          price_cents: validatedData.price_cents,
          is_rental: validatedData.is_rental,
          rental_day_price_cents: validatedData.rental_day_price_cents,
          rental_deposit_cents: validatedData.rental_deposit_cents,
          rental_min_days: validatedData.rental_min_days,
          rental_max_days: validatedData.rental_max_days,
          condition: validatedData.condition,
          quantity: validatedData.quantity,
          delivery_methods: validatedData.delivery_methods,
          campus_location: validatedData.campus_location,
          status: 'active'
        })
        .select()
        .single()

      if (listingError) {
        console.error('Error creating listing:', listingError)
        setErrors({ submit: 'Failed to create listing' })
        return
      }

      // Create listing assets
      if (images.length > 0) {
        const assets = images.map(image => ({
          listing_id: listing.id,
          kind: 'image' as const,
          path: image.path
        }))

        const { error: assetsError } = await supabase
          .from('listing_assets')
          .insert(assets)

        if (assetsError) {
          console.error('Error creating assets:', assetsError)
        }
      }

      // Create ticket metadata if it's a ticket listing
      if (showTicketMeta && ticketMeta.event_title) {
        const validatedTicketMeta = ticketMetaSchema.parse(ticketMeta)
        
        const { error: ticketError } = await supabase
          .from('tickets_meta')
          .insert({
            listing_id: listing.id,
            ...validatedTicketMeta
          })

        if (ticketError) {
          console.error('Error creating ticket metadata:', ticketError)
        }
      }

      // Redirect to listing detail page
      router.push(`/listing/${listing.id}`)
    } catch (error) {
      if (error instanceof Error && 'issues' in error) {
        // Zod validation errors
        const fieldErrors: Record<string, string> = {}
        ;(error as { issues: Array<{ path: string[]; message: string }> }).issues.forEach((issue) => {
          fieldErrors[issue.path[0]] = issue.message
        })
        setErrors(fieldErrors)
      } else {
        console.error('Error:', error)
        setErrors({ submit: 'An error occurred. Please try again.' })
      }
    } finally {
      setLoading(false)
    }
  }

  // const selectedCategory = categories.find(c => c.id === formData.category_id)

  return (
    <div className="max-w-2xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-6">Create New Listing</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="What are you selling?"
                />
                {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description *
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="Describe your item..."
                />
                {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Category */}
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => {
                    handleInputChange('category_id', e.target.value)
                    setShowTicketMeta(!!(e.target.value && categories.find(c => c.id === e.target.value)?.slug === 'tickets'))
                  }}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
              </div>

              {/* Sale vs Rental */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_rental"
                      checked={!formData.is_rental}
                      onChange={() => handleInputChange('is_rental', false)}
                      className="mr-2"
                    />
                    Sale
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="is_rental"
                      checked={formData.is_rental}
                      onChange={() => handleInputChange('is_rental', true)}
                      className="mr-2"
                    />
                    Rental
                  </label>
                </div>
              </div>

              {/* Price */}
              {!formData.is_rental ? (
                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                    Price ($) *
                  </label>
                  <input
                    type="number"
                    id="price"
                    step="0.01"
                    min="0"
                    value={formData.price_cents ? formData.price_cents / 100 : ''}
                    onChange={(e) => handleInputChange('price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="0.00"
                  />
                  {errors.price_cents && <p className="mt-1 text-sm text-red-600">{errors.price_cents}</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="rental_day_price" className="block text-sm font-medium text-gray-700">
                      Daily Price ($) *
                    </label>
                    <input
                      type="number"
                      id="rental_day_price"
                      step="0.01"
                      min="0"
                      value={formData.rental_day_price_cents ? formData.rental_day_price_cents / 100 : ''}
                      onChange={(e) => handleInputChange('rental_day_price_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label htmlFor="rental_deposit" className="block text-sm font-medium text-gray-700">
                      Deposit ($) *
                    </label>
                    <input
                      type="number"
                      id="rental_deposit"
                      step="0.01"
                      min="0"
                      value={formData.rental_deposit_cents ? formData.rental_deposit_cents / 100 : ''}
                      onChange={(e) => handleInputChange('rental_deposit_cents', Math.round(parseFloat(e.target.value || '0') * 100))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label htmlFor="rental_min_days" className="block text-sm font-medium text-gray-700">
                      Min Days *
                    </label>
                    <input
                      type="number"
                      id="rental_min_days"
                      min="1"
                      value={formData.rental_min_days || ''}
                      onChange={(e) => handleInputChange('rental_min_days', parseInt(e.target.value || '1'))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label htmlFor="rental_max_days" className="block text-sm font-medium text-gray-700">
                      Max Days *
                    </label>
                    <input
                      type="number"
                      id="rental_max_days"
                      min="1"
                      value={formData.rental_max_days || ''}
                      onChange={(e) => handleInputChange('rental_max_days', parseInt(e.target.value || '1'))}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      placeholder="30"
                    />
                  </div>
                </div>
              )}

              {/* Condition */}
              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Condition *
                </label>
                <select
                  id="condition"
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </select>
                {errors.condition && <p className="mt-1 text-sm text-red-600">{errors.condition}</p>}
              </div>

              {/* Quantity */}
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantity
                </label>
                <input
                  type="number"
                  id="quantity"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseInt(e.target.value || '1'))}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
              </div>

              {/* Delivery Methods */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Methods *
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'in_person', label: 'In Person' },
                    { value: 'ticket_transfer', label: 'Ticket Transfer' },
                    { value: 'barcode_upload', label: 'Barcode Upload' },
                    { value: 'mail', label: 'Mail' }
                  ].map(method => (
                    <label key={method.value} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.delivery_methods.includes(method.value as 'in_person' | 'ticket_transfer' | 'barcode_upload' | 'mail')}
                        onChange={(e) => handleDeliveryMethodChange(method.value as 'in_person' | 'ticket_transfer' | 'barcode_upload' | 'mail', e.target.checked)}
                        className="mr-2"
                      />
                      {method.label}
                    </label>
                  ))}
                </div>
                {errors.delivery_methods && <p className="mt-1 text-sm text-red-600">{errors.delivery_methods}</p>}
              </div>

              {/* Campus Location */}
              <div>
                <label htmlFor="campus_location" className="block text-sm font-medium text-gray-700">
                  Campus Location
                </label>
                <input
                  type="text"
                  id="campus_location"
                  value={formData.campus_location || ''}
                  onChange={(e) => handleInputChange('campus_location', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="e.g., Illini Union, Main Library"
                />
                {errors.campus_location && <p className="mt-1 text-sm text-red-600">{errors.campus_location}</p>}
              </div>

              {/* Images */}
              <div>
                <ImageUploader onImageUploaded={handleImageUploaded} maxImages={5} />
              </div>

              {/* Ticket Metadata */}
              {showTicketMeta && (
                <div className="border-t pt-6">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Ticket Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="event_title" className="block text-sm font-medium text-gray-700">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        id="event_title"
                        value={ticketMeta.event_title}
                        onChange={(e) => setTicketMeta(prev => ({ ...prev, event_title: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., UIUC vs Michigan Football"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="event_datetime" className="block text-sm font-medium text-gray-700">
                        Event Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        id="event_datetime"
                        value={ticketMeta.event_datetime}
                        onChange={(e) => setTicketMeta(prev => ({ ...prev, event_datetime: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="section" className="block text-sm font-medium text-gray-700">
                        Section
                      </label>
                      <input
                        type="text"
                        id="section"
                        value={ticketMeta.section || ''}
                        onChange={(e) => setTicketMeta(prev => ({ ...prev, section: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., Section A"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="row" className="block text-sm font-medium text-gray-700">
                        Row
                      </label>
                      <input
                        type="text"
                        id="row"
                        value={ticketMeta.row || ''}
                        onChange={(e) => setTicketMeta(prev => ({ ...prev, row: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., Row 10"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="seat" className="block text-sm font-medium text-gray-700">
                        Seat
                      </label>
                      <input
                        type="text"
                        id="seat"
                        value={ticketMeta.seat || ''}
                        onChange={(e) => setTicketMeta(prev => ({ ...prev, seat: e.target.value }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        placeholder="e.g., Seat 15"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="transfer_platform" className="block text-sm font-medium text-gray-700">
                        Transfer Platform
                      </label>
                      <select
                        id="transfer_platform"
                        value={ticketMeta.transfer_platform || 'other'}
                        onChange={(e) => setTicketMeta(prev => ({ ...prev, transfer_platform: e.target.value as 'Ticketmaster' | 'SeatGeek' | 'other' }))}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                      >
                        <option value="Ticketmaster">Ticketmaster</option>
                        <option value="SeatGeek">SeatGeek</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Listing'}
                </Button>
              </div>

              {errors.submit && (
                <p className="text-red-600 text-sm">{errors.submit}</p>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
