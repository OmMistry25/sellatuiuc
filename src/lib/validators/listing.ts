import { z } from 'zod'

export const createListingSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description must be less than 1000 characters'),
  category_id: z.string().uuid('Please select a valid category'),
  price_cents: z.number().min(0, 'Price must be positive').optional(),
  is_rental: z.boolean().default(false),
  rental_day_price_cents: z.number().min(0, 'Daily rental price must be positive').optional(),
  rental_deposit_cents: z.number().min(0, 'Deposit must be positive').optional(),
  rental_min_days: z.number().min(1, 'Minimum rental days must be at least 1').optional(),
  rental_max_days: z.number().min(1, 'Maximum rental days must be at least 1').optional(),
  condition: z.enum(['new', 'like_new', 'good', 'fair']),
  quantity: z.number().min(1, 'Quantity must be at least 1').default(1),
  delivery_methods: z.array(z.enum(['in_person', 'ticket_transfer', 'barcode_upload', 'mail'])).min(1, 'Please select at least one delivery method'),
  campus_location: z.string().max(100, 'Campus location must be less than 100 characters').optional(),
  images: z.array(z.object({
    url: z.string().url(),
    path: z.string()
  })).min(1, 'At least one image is required')
}).refine((data) => {
  // If it's a rental, require rental fields
  if (data.is_rental) {
    return data.rental_day_price_cents && data.rental_deposit_cents && data.rental_min_days && data.rental_max_days
  }
  // If it's a sale, require price
  return data.price_cents && data.price_cents > 0
}, {
  message: 'Please provide all required pricing information',
  path: ['price_cents']
})

export const ticketMetaSchema = z.object({
  event_title: z.string().min(1, 'Event title is required').max(100, 'Event title must be less than 100 characters'),
  event_datetime: z.string().datetime('Please provide a valid date and time'),
  section: z.string().max(50, 'Section must be less than 50 characters').optional(),
  row: z.string().max(20, 'Row must be less than 20 characters').optional(),
  seat: z.string().max(20, 'Seat must be less than 20 characters').optional(),
  barcode_format: z.string().max(50, 'Barcode format must be less than 50 characters').optional(),
  transfer_platform: z.enum(['Ticketmaster', 'SeatGeek', 'other']).optional()
})

export type CreateListingInput = z.infer<typeof createListingSchema>
export type TicketMetaInput = z.infer<typeof ticketMetaSchema>
