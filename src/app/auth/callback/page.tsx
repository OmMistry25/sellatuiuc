'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash parameters (magic link tokens are in the hash)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        
        console.log('Hash params:', hashParams.toString())
        console.log('Access token present:', !!accessToken)
        console.log('Refresh token present:', !!refreshToken)
        
        if (accessToken && refreshToken) {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })
          
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
        
        // Fallback: try to get existing session
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
