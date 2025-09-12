'use client'

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import Link from "next/link";

export default function Home() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">UIUC Marketplace</h1>
            <p className="mt-2 text-gray-600">Buy, sell, and rent items on campus</p>
          </div>
          <div className="space-y-4">
            <Link href="/auth/signin">
              <Button className="w-full">Sign In</Button>
            </Link>
            <p className="text-sm text-gray-500">
              Only illinois.edu emails allowed
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">UIUC Marketplace</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/sell">
                <Button>Sell Item</Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">Profile</Button>
              </Link>
              <span className="text-sm text-gray-700">
                Welcome, {user.email}
              </span>
              <Button variant="outline" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Welcome to UIUC Marketplace!</h2>
            <p className="mt-2 text-gray-600">You&apos;re successfully signed in.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
