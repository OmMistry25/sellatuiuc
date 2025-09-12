import { supabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  console.log('Callback URL:', requestUrl.toString())
  console.log('Code parameter:', code)
  console.log('All search params:', Object.fromEntries(requestUrl.searchParams))

  if (code) {
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=auth_failed`)
      }

      if (data.session) {
        console.log('Session created successfully')
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
    } catch (error) {
      console.error('Callback error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=callback_failed`)
    }
  }

  // If no code, redirect to sign in with more details
  console.log('No code found in callback URL')
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no_code&debug=${encodeURIComponent(requestUrl.toString())}`)
}
