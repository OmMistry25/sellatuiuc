# UIUC Marketplace - MVP Tasks

Guiding idea: very small tasks, single concern, testable output. Work top-down by slices so that after every few tasks you can run a vertical demo.

## 0. Repo bootstrap

1. Create Next.js 14 app with TypeScript
   - Start: run `pnpm dlx create-next-app`
   - End: app builds and runs at http://localhost:3000

2. Install Tailwind and shadcn/ui
   - Start: add Tailwind config
   - End: one Button renders on home

3. Add Supabase client libraries
   - Start: `pnpm add @supabase/supabase-js`
   - End: `lib/supabase/client.ts` and `lib/supabase/server.ts` export clients

4. Add Stripe SDK and Resend
   - Start: `pnpm add stripe resend`
   - End: `lib/stripe.ts` exports initialized Stripe client

## 1. Supabase project setup

5. Create auth domain allowlist
   - Start: set email domain restriction to illinois.edu
   - End: test sign up with non-campus email fails

6. Create initial schema migration
   - Start: write SQL for profiles, categories
   - End: `supabase/migrations/0001_init.sql` applied

7. Add listings tables
   - Start: write SQL and RLS
   - End: can insert active listing as owner and read it without auth

8. Add orders and order_events tables
   - Start: write SQL and RLS
   - End: owner buyer seller can read, others denied

9. Add threads and messages tables
   - Start: write SQL and RLS
   - End: members can chat in SQL console using Realtime

10. Seed categories
   - Start: write `seed.sql`
   - End: tickets and textbooks appear in dropdown

## 2. Auth and profile

11. Magic link auth flow
   - Start: add sign in page
   - End: email sign in works with illinois.edu

12. Profile bootstrap
   - Start: create `profiles` row on first login
   - End: profile page shows display name and handle

## 3. Create listing slice

13. Image upload to Storage
   - Start: create `listing-images` bucket
   - End: signed upload works and preview shows

14. Create listing form
   - Start: build form with zod validation
   - End: valid submission inserts listing with assets

15. Listing detail page
   - Start: server component fetch by id
   - End: page shows title, price, images

16. Listings feed with filters
   - Start: search by text and category
   - End: pagination works and results change

## 4. Order and chat slice

17. Start order
   - Start: action creates `orders` row in initiated state
   - End: order timeline renders

18. Thread and anonymous chat
   - Start: create thread with masked names
   - End: realtime chat between buyer and seller works

19. Stripe PaymentIntent create
   - Start: call Edge Function `create_order`
   - End: client receives `client_secret`

20. Checkout and authorization
   - Start: integrate Stripe Elements
   - End: order shows authorized status

## 5. Delivery and confirmation

21. Seller upload delivery proof
   - Start: file input to `delivery-proofs` bucket
   - End: state moves to delivered_pending_confirm and auto_release_at set

22. Buyer confirm delivery
   - Start: button calls `confirm_delivery` function
   - End: funds captured and transfer to seller created

23. Auto release job
   - Start: scheduled function scans due orders
   - End: due orders are captured and completed

## 6. Rentals minimal

24. Rental terms support
   - Start: extend listing form with is_rental and day price
   - End: order calculates rental subtotal and deposit

25. Return confirmation
   - Start: second upload path for return proof
   - End: deposit released on confirm

## 7. Disputes and admin

26. Open dispute
   - Start: button with reason field
   - End: dispute row created and visible to admin

27. Resolve dispute
   - Start: admin page to issue refund or release
   - End: state updated and Stripe call made

## 8. Reviews

28. Leave review
   - Start: prompt after completion
   - End: review saved and rating updated

## 9. Emails

29. Resend transactional emails
   - Start: add Resend API key
   - End: email sent on order created, delivered, completed

## 10. Webhooks

30. Stripe webhook route
   - Start: Next API route forwards event to function
   - End: payment and transfer events update tables

## 11. Policies and hardening

31. Add RLS policies for every table
   - Start: compile list
   - End: tests query with unauthorized actor fails

32. Signed URL TTL checks
   - Start: set 5 minute TTL
   - End: expired link returns 403

33. Rate limiting
   - Start: add ip based limiter in Edge Function
   - End: rapid calls return 429

34. Audit logging triggers
   - Start: write pg trigger
   - End: audit_log records insert and update

## 12. QA scenarios

35. Buy ticket happy path
   - Start: seed listing
   - End: run end to end from create to payout

36. Cancel before delivery
   - Start: create order and cancel
   - End: PaymentIntent canceled and state updated

37. Dispute refund
   - Start: simulate wrong barcode
   - End: refund created and seller blocked

38. Rental not returned
   - Start: pass return date
   - End: deposit captured

## 13. Release

39. Feature flag rentals if time is tight
   - Start: env variable
   - End: rentals hidden from UI

40. Deploy to Vercel and Supabase
   - Start: add env vars in both
   - End: live URL accessible and test signup works
