'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'

export default function SignInPage() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)

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

  const validateEmail = (email: string) => {
    return email.endsWith('@illinois.edu')
  }

  const validatePassword = (password: string) => {
    return password.length >= 8
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate email domain
    if (!validateEmail(email)) {
      setMessage('Please use your @illinois.edu email address.')
      setLoading(false)
      return
    }

    // Validate password
    if (!validatePassword(password)) {
      setMessage('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }

    try {
      console.log('Signing in with:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      console.log('Sign in response:', { data, error })

      if (error) {
        console.error('Sign in error:', error)
        setMessage(`Error: ${error.message}`)
      } else {
        console.log('Sign in successful')
        // Redirect will be handled by the auth state change
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setMessage('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Validate email domain
    if (!validateEmail(email)) {
      setMessage('Please use your @illinois.edu email address.')
      setLoading(false)
      return
    }

    // Validate password
    if (!validatePassword(password)) {
      setMessage('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }

    try {
      console.log('Signing up with:', email)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })

      console.log('Sign up response:', { data, error })

      if (error) {
        console.error('Sign up error:', error)
        setMessage(`Error: ${error.message}`)
      } else {
        console.log('Sign up successful')
        setMessage('Account created successfully! You can now sign in.')
        setIsSignUp(false)
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
            {isSignUp ? 'Create Account' : 'Sign in to UIUC Marketplace'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isSignUp ? 'Create your account with your illinois.edu email' : 'Enter your illinois.edu email and password'}
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={isSignUp ? handleSignUp : handleSignIn}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1"
                placeholder="your.email@illinois.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={isSignUp ? "new-password" : "current-password"}
                required
                className="mt-1"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {isSignUp && (
                <p className="mt-1 text-xs text-gray-500">
                  Password must be at least 8 characters long
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setMessage('')
              }}
            >
              {isSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </Button>
          </div>

          {message && (
            <div className={`text-sm text-center ${
              message.includes('successfully') ? 'text-green-600' : 'text-red-600'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}