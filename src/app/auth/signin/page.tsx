'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      switch (error) {
        case 'auth_failed':
          setMessage('Authentication failed. Please try again.')
          break
        case 'session_failed':
          setMessage('Session setup failed. Please try again.')
          break
        case 'no_session':
          setMessage('No active session found. Please sign in again.')
          break
        case 'callback_failed':
          setMessage('Sign-in process failed. Please try again.')
          break
        case 'no_code':
          setMessage('The magic link is invalid or has expired. Please request a new one.')
          break
        default:
          setMessage('An error occurred during sign-in. Please try again.')
      }
    }
  }, [searchParams])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      console.log('Sending magic link to:', email)
      console.log('Redirect URL:', `${window.location.origin}/auth/callback`)
      
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      console.log('Magic link response:', { data, error })

      if (error) {
        console.error('Magic link error:', error)
        setMessage(`Error: ${error.message}`)
      } else {
        console.log('Magic link sent successfully')
        setMessage('Check your email for the login link!')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to UIUC Marketplace
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your illinois.edu email address
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSignIn}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="your.email@illinois.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <Button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </div>

          {message && (
            <div className={`text-sm text-center ${
              message.includes('Check your email') ? 'text-green-600' : 'text-red-600'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
