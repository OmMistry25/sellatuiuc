import { supabase } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'

  console.log('Callback URL:', requestUrl.toString())
  console.log('Code parameter:', code)
  console.log('All search params:', Object.fromEntries(requestUrl.searchParams))

  // Check if this is a magic link with tokens in the URL
  const accessToken = requestUrl.searchParams.get('access_token')
  const refreshToken = requestUrl.searchParams.get('refresh_token')
  
  console.log('Access token:', accessToken ? 'present' : 'not present')
  console.log('Refresh token:', refreshToken ? 'present' : 'not present')

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

  // Handle magic link with tokens in query params
  if (accessToken && refreshToken) {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken
      })
      
      if (error) {
        console.error('Session error:', error)
        return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=session_failed`)
      }

      if (data.session) {
        console.log('Session set successfully with tokens')
        return NextResponse.redirect(`${requestUrl.origin}${next}`)
      }
    } catch (error) {
      console.error('Token session error:', error)
      return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=token_failed`)
    }
  }

  // If no code or tokens, redirect to sign in with more details
  console.log('No code or tokens found in callback URL')
  return NextResponse.redirect(`${requestUrl.origin}/auth/signin?error=no_code&debug=${encodeURIComponent(requestUrl.toString())}`)
}
