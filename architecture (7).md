# UIUC Marketplace - Architecture

Product: A campus-only marketplace for UIUC students with illinois.edu emails to buy, sell, and rent items such as event tickets, textbooks, iClickers, and lab gear. The flow mirrors StubHub style trades with anonymous chat, delivery verification, and escrowed payments for safe transactions.

Stack: Next.js 14 App Router, TypeScript, Supabase for Postgres + Auth + Realtime + Storage + Edge Functions, Stripe Connect for payments and escrow, shadcn/ui + Tailwind for UI, Vercel for deploy.

## High-level architecture

- Web client: Next.js 14 with server components for data reads, client components for interactive flows
- API: Next server actions and Supabase Edge Functions for secure trade logic and webhooks
- Database: Postgres on Supabase with RLS, row level audits, and RPC for sensitive mutations
- Auth: Supabase email magic link restricted to illinois.edu domain
- Payments: Stripe Connect with destination charges, separate balance for platform fee, escrow via PaymentIntents + transfers on fulfillment
- Files: Supabase Storage buckets for images, barcodes, PDFs
- Realtime: Supabase Realtime for chat, order state, and admin dashboards
- Notifications: Resend email for receipts and status updates
- Jobs: Supabase scheduled functions for timeouts, auto release, and dispute timers

## Security goals

- Only illinois.edu accounts can sign up and sign in
- Anonymous buyer and seller identity in chats until the order is closed
- All payments flow through platform escrow until delivery confirmation or timeout
- Strong RLS on every table with least-privilege policies
- Signed URLs for assets, short TTL
- Audit tables for every state change

## Data model

Schema: `public` unless noted. All tables have `id uuid pk`, `created_at`, `updated_at`, `created_by`, `updated_by` where applicable.

### Core

- `profiles`
  - `user_id uuid pk fk auth.users`
  - `email text unique`
  - `display_name text`
  - `handle text unique`
  - `campus_role text` student or staff
  - `is_verified boolean` set after domain check
  - `stripe_customer_id text`
  - `stripe_connect_id text` for sellers
  - `rating numeric` average
  - RLS: row user can select own, public fields readable

- `categories` - seed list: tickets, textbooks, iclickers, lab_equipment, other

- `listings`
  - `seller_id uuid fk profiles.user_id`
  - `category_id fk categories`
  - `title text`
  - `description text`
  - `price_cents int` for sales
  - `is_rental boolean`
  - `rental_day_price_cents int null`
  - `rental_deposit_cents int null`
  - `rental_min_days int null`
  - `rental_max_days int null`
  - `condition text` new, like_new, good, fair
  - `quantity int` default 1
  - `delivery_methods text[]` in_person, ticket_transfer, barcode_upload, mail
  - `campus_location text` optional pickup spot
  - `status text` draft, active, paused, sold, removed
  - `views int` denormalized
  - RLS:
    - `select` all where status in active or by owner
    - `insert/update/delete` by owner only

- `listing_assets`
  - `listing_id fk listings`
  - `kind text` image, barcode, pdf
  - `path text` Supabase Storage key
  - `checksum text`
  - RLS: read if listing is visible or requester is owner

- `tickets_meta` optional
  - `listing_id fk listings`
  - `event_title text`
  - `event_datetime timestamptz`
  - `section text`
  - `row text`
  - `seat text`
  - `barcode_format text`
  - `transfer_platform text` Ticketmaster, SeatGeek, other

### Trade flow

- `orders`
  - `buyer_id uuid`
  - `seller_id uuid`
  - `listing_id uuid`
  - `type text` buy, rent
  - `quantity int`
  - `rental_start date null`
  - `rental_end date null`
  - `subtotal_cents int`
  - `fees_cents int`
  - `deposit_cents int`
  - `total_cents int`
  - `stripe_payment_intent_id text`
  - `state text`
    - `initiated` payment authorized
    - `seller_accept` optional step for offers
    - `delivering` seller providing item
    - `delivered_pending_confirm` evidence uploaded
    - `completed` funds released
    - `cancelled`
    - `disputed`
  - `delivery_method text`
  - `delivery_proof_path text` storage key
  - `auto_release_at timestamptz`
  - RLS: buyer or seller can select their own orders. Public cannot.

- `order_events`
  - `order_id uuid`
  - `actor uuid`
  - `type text` created, authorized, accepted, proof_uploaded, confirmed, auto_released, cancelled, disputed, refunded, payout_sent
  - `data jsonb`

- `messages`
  - `thread_id uuid`
  - `sender_id uuid`
  - `content text`
  - `attachments jsonb[]`
  - RLS: only thread members

- `threads`
  - `order_id uuid` nullable for pre-offer chat
  - `buyer_id uuid`
  - `seller_id uuid`
  - `is_anonymous boolean` true until order close
  - Derived display names masked as Buyer and Seller

- `reviews`
  - `order_id`
  - `rater_id`
  - `ratee_id`
  - `rating int` 1 to 5
  - `comment text`
  - RLS: author can insert after completion, public can read

- `disputes`
  - `order_id`
  - `opened_by uuid`
  - `reason text`
  - `state text` open, needs_more_info, resolved_refund, resolved_release, admin_only
  - `resolution text`
  - RLS: participants and admins

### Payment and payout

- `payouts`
  - `order_id`
  - `seller_id`
  - `amount_cents int`
  - `stripe_transfer_id text`
  - `status text` pending, paid, failed

- `refunds`
  - `order_id`
  - `stripe_refund_id text`
  - `amount_cents int`

### Admin

- `admin_users` list of UUIDs
- `audit_log`
  - `actor uuid`
  - `table_name text`
  - `row_id uuid`
  - `action text`
  - `old jsonb`
  - `new jsonb`

## Storage buckets

- `listing-images` public read via signed URL, short TTL
- `delivery-proofs` private
- `chat-attachments` private
- `barcodes` private

## RLS policy sketch

- Profiles: public read of selected fields, user can update own row
- Listings: public read if active, writes by owner, soft delete into removed
- Orders: read and write by buyer or seller, admin bypass
- Threads and messages: only members can read and write
- Disputes: only parties and admins
- Assets: visibility tied to listing or order membership

## API and functions

### Supabase Edge Functions

- `create_order`
  - Input: listing_id, order type, quantity, rental dates
  - Logic:
    - Validate listing availability
    - Price calculation and fee
    - Create order row
    - Create Stripe PaymentIntent with capture later or `automatic_payment_methods`
    - Return client_secret

- `submit_delivery_proof`
  - Validate actor is seller
  - Accept upload to storage with signed URL
  - Set `delivered_pending_confirm` and `auto_release_at` T+48h

- `confirm_delivery`
  - Validate actor is buyer
  - Capture PaymentIntent and create Transfer to seller
  - Mark order completed, create payout row

- `auto_release_job` scheduled every 15 minutes
  - Find orders with state delivered_pending_confirm past auto_release_at
  - Capture and release funds to seller
  - Post event and email

- `cancel_order`
  - If state allows, cancel PaymentIntent or refund
  - Return inventory to listing

- `open_dispute`, `resolve_dispute` admin-only

- `stripe_webhook`
  - Listen for payment events, transfer payouts, refund updates, failures

### Next.js server actions

- `listings.create`, `listings.update`, `listings.search`
- `orders.start`, `orders.status`, `orders.cancel`
- `chat.send`, `chat.list`
- `profiles.me`, `profiles.update`
- `admin.resolveDispute`

## Next.js app structure

```
/app
  /(marketing)
    page.tsx
  /(app)
    layout.tsx
    page.tsx                      - home feed with search and filters
    sell/
      page.tsx                    - create listing
    listing/[id]/
      page.tsx                    - listing details
      buy/
        page.tsx                  - buy or rent form
    orders/
      page.tsx                    - my orders list
      [id]/page.tsx               - order detail with chat and status
    profile/[handle]/page.tsx
    admin/
      disputes/page.tsx
      orders/page.tsx
/api
  stripe/webhook/route.ts         - Next API route that forwards to Supabase function
/components
  ui/...
  listing/
    ListingCard.tsx
    ListingGallery.tsx
    CreateListingForm.tsx
    RentalTerms.tsx
  order/
    OrderTimeline.tsx
    DeliveryProofUploader.tsx
    ConfirmDeliveryButton.tsx
  chat/
    Thread.tsx
    Message.tsx
    Composer.tsx
  common/
    EmptyState.tsx
    DataTable.tsx
    Badge.tsx
/lib
  supabase/client.ts
  supabase/server.ts
  stripe.ts
  auth.ts
  validators/
    listing.ts
    order.ts
  price.ts
  policies.ts                    - client checks that mirror RLS
/hooks
  useUpload.ts
  useOrderChannel.ts
  useSignedUrl.ts
  useAnonymousName.ts
/styles
  globals.css
  tailwind.css
/types
  db.ts                          - generated types
  domain.ts                      - domain types
/edge-functions                 - local mirror of Supabase functions
/supabase
  /migrations
  seed.sql
```

## State management

- Server components handle reads via Supabase server client for cacheable pages
- Client components use React Query for mutations and real time data that need fast updates
- UI state such as modals and toasts live in Zustand
- Chat uses Realtime channels keyed by thread_id
- Order page subscribes to order channel and updates timeline

## Services integration

- Supabase Auth with domain allowlist `illinois.edu` using email magic links
- Stripe Connect
  - Seller onboarding via Account Links
  - PaymentIntent created at `create_order`
  - Transfer to seller on confirm or auto release
  - Application fee for platform
- Resend for email
- Link shortener optional for pickup instructions

## Delivery and verification patterns

- In person: QR code handoff confirmation. Seller shows QR, buyer scans to confirm on device. App records GPS near a campus geofence for extra confidence.
- Ticket transfer: Seller provides transfer link or uploads barcode. App checks barcode format. Buyer confirms scan success.
- Barcode upload: Stored privately and shown as masked preview. Watermark to deter reuse until completion.
- Mail or locker: Proof photo with timestamp. Buyer confirms on receipt or auto release after window.

## Domain rules

- Only campus network users with illinois.edu can sign up
- Prohibit prohibited items list
- One account per person
- Dispute window 48 hours after proof
- Rentals:
  - Deposit authorized up front
  - Return flow with second proof upload
  - Auto charge from deposit if not returned

## Observability

- Log every function execution with request id
- Per order event stream
- Metrics: GMV, take rate, conversion, dispute rate
- Admin dashboards under `/admin`

## Local development

- `supabase start`
- `cp .env.example .env.local`
- `npm run dev`
- `supabase functions serve` to run edge functions locally

## Where things live

- Trade business logic lives in Edge Functions
- Presentation logic in Next components
- Validations shared in `/lib/validators`
- State in server components and React Query
- Payments in `/lib/stripe.ts` and `stripe_webhook` function
