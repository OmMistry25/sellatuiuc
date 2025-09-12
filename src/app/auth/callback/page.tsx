'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Wait a bit for the page to fully load
        await new Promise(resolve => setTimeout(resolve, 100))
        
        console.log('Current URL:', window.location.href)
        console.log('Hash:', window.location.hash)
        console.log('Search:', window.location.search)
        
        // Get the URL hash parameters (magic link tokens are in the hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        console.log('Hash params:', hashParams.toString())
        console.log('Access token present:', !!accessToken)
        console.log('Refresh token present:', !!refreshToken)
        
        if (accessToken && refreshToken) {
          console.log('Setting session with tokens...')
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
          console.log('Session result:', { data, error })
          
          if (error) {
            console.error('Session error:', error)
            router.push('/auth/signin?error=session_failed')
            return
          }
          
          if (data.session) {
            console.log('Session set successfully, redirecting to home')
            router.push('/')
            return
          }
        }
        
        // Also check URL search params (some magic links use query params instead of hash)
        const searchParams = new URLSearchParams(window.location.search)
        const searchAccessToken = searchParams.get('access_token')
        const searchRefreshToken = searchParams.get('refresh_token')
        
        if (searchAccessToken && searchRefreshToken) {
          console.log('Found tokens in search params, setting session...')
          const { data, error } = await supabase.auth.setSession({
            access_token: searchAccessToken,
            refresh_token: searchRefreshToken
          })
          
          if (error) {
            console.error('Session error (search params):', error)
            router.push('/auth/signin?error=session_failed')
            return
          }
          
          if (data.session) {
            console.log('Session set successfully (search params), redirecting to home')
            router.push('/')
            return
          }
        }
        
        // Fallback: try to get existing session
        console.log('No tokens found, checking existing session...')
        const { data, error } = await supabase.auth.getSession()
        
        console.log('Auth callback - Session data:', data)
        console.log('Auth callback - Error:', error)
        
        if (error) {
          console.error('Auth error:', error)
          router.push('/auth/signin?error=auth_failed')
          return
        }

        if (data.session) {
          console.log('User authenticated, redirecting to home')
          router.push('/')
        } else {
          console.log('No session found, redirecting to sign in')
          router.push('/auth/signin?error=no_session')
        }
      } catch (error) {
        console.error('Callback error:', error)
        router.push('/auth/signin?error=callback_failed')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
