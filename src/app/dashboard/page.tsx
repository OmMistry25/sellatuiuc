'use client'

import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, MessageSquare, Star, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
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
            <h1 className="text-4xl font-bold text-gray-900">Access Denied</h1>
            <p className="mt-2 text-gray-600">Please sign in to access your dashboard</p>
          </div>
          <Link href="/auth/signin">
            <Button className="w-full">Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-semibold text-orange-600">UIUC Marketplace</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/listings">
                <Button variant="outline">Browse Listings</Button>
              </Link>
              <Link href="/sell">
                <Button>Sell Item</Button>
              </Link>
              <Link href="/seller/orders">
                <Button variant="outline">My Orders</Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline">Profile</Button>
              </Link>
              <Link href="/admin/auto-release">
                <Button variant="outline">Admin</Button>
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
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome back!</h1>
            <p className="mt-2 text-gray-600">Manage your marketplace activities from your dashboard</p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/sell">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Package className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-lg">Sell Item</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    List a new item for sale or rent
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/listings">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">Browse Listings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Find items to buy or rent
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/seller/orders">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                    <CardTitle className="text-lg">My Orders</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    Manage your orders and messages
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>

            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <Link href="/profile">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-2">
                    <Star className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">My Profile</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription>
                    View your profile and reviews
                  </CardDescription>
                </CardContent>
              </Link>
            </Card>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                  Active Listings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-sm text-gray-600">Items you're currently selling</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <ShoppingCart className="h-5 w-5 text-blue-600 mr-2" />
                  Orders Placed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">0</div>
                <p className="text-sm text-gray-600">Items you've purchased</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center">
                  <Star className="h-5 w-5 text-yellow-600 mr-2" />
                  Rating
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">-</div>
                <p className="text-sm text-gray-600">Your seller rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Your latest marketplace interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No recent activity</p>
                <p className="text-sm">Start by browsing listings or creating your first listing!</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
