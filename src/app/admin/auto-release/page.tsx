'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function AutoReleasePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleRunAutoRelease = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/auto-release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to run auto-release job')
      }

      setResult(data)
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Please sign in to access this page</p>
          <Button onClick={() => router.push('/auth/signin')}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Auto Release Job</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manually trigger the auto-release function for testing
                </p>
              </div>
              <Button 
                onClick={() => router.push('/')}
                variant="outline"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Auto Release Orders</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">What this does:</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• Scans for orders in 'delivered_pending_confirm' state</li>
                <li>• Finds orders where auto_release_at has passed</li>
                <li>• Captures the Stripe PaymentIntent</li>
                <li>• Updates order state to 'completed'</li>
                <li>• Creates order events for tracking</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleRunAutoRelease}
                disabled={loading}
                className="flex-1"
              >
                {loading ? 'Running Auto-Release...' : 'Run Auto-Release Job'}
              </Button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {result && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                <h4 className="text-sm font-medium text-green-800 mb-2">Job Results:</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Message:</strong> {result.message}</p>
                  <p><strong>Processed:</strong> {result.processed} orders</p>
                  {result.errors > 0 && (
                    <p><strong>Errors:</strong> {result.errors} orders failed</p>
                  )}
                  {result.errorDetails && result.errorDetails.length > 0 && (
                    <div className="mt-2">
                      <p><strong>Error Details:</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        {result.errorDetails.map((error: string, index: number) => (
                          <li key={index} className="text-xs">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
