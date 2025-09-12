'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, MapPin, User, Calendar } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/auth'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  condition: string
  delivery_methods: string[]
  campus_location: string
  quantity: number
  status: string
  created_at: string
  profiles: {
    full_name: string
  }
  categories: {
    name: string
    slug: string
  }
  listing_assets: Array<{
    path: string
    kind: string
  }>
}

interface Category {
  id: string
  name: string
  slug: string
}

const ITEMS_PER_PAGE = 12

export default function ListingsPage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [listings, setListings] = useState<Listing[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      if (!error && data) {
        setCategories(data)
      }
    }

    fetchCategories()
  }, [])

  // Fetch listings with filters
  const fetchListings = useCallback(async (page: number = 1) => {
    setLoading(true)
    try {
      // First, get the listings with basic info
      let query = supabase
        .from('listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      // Apply search filter
      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
      }

      // Apply pagination
      const from = (page - 1) * ITEMS_PER_PAGE
      const to = from + ITEMS_PER_PAGE - 1
      query = query.range(from, to)

      const { data: listings, error: listingsError, count } = await query

      if (listingsError) {
        console.error('Error fetching listings:', listingsError)
        return
      }

      if (!listings || listings.length === 0) {
        setListings([])
        setTotalCount(0)
        setTotalPages(0)
        setCurrentPage(page)
        return
      }

      // Get unique seller IDs and category IDs
      const sellerIds = [...new Set(listings.map(l => l.seller_id))]
      const categoryIds = [...new Set(listings.map(l => l.category_id))]

      // Fetch profiles and categories
      const [profilesResult, categoriesResult, assetsResult] = await Promise.all([
        supabase.from('profiles').select('user_id, full_name').in('user_id', sellerIds),
        supabase.from('categories').select('id, name, slug').in('id', categoryIds),
        supabase.from('listing_assets').select('listing_id, path, kind').in('listing_id', listings.map(l => l.id))
      ])

      // Combine the data
      const enrichedListings = listings.map(listing => {
        const profile = profilesResult.data?.find(p => p.user_id === listing.seller_id)
        const category = categoriesResult.data?.find(c => c.id === listing.category_id)
        const assets = assetsResult.data?.filter(a => a.listing_id === listing.id) || []

        return {
          ...listing,
          profiles: profile ? { full_name: profile.full_name } : null,
          categories: category ? { name: category.name, slug: category.slug } : null,
          listing_assets: assets
        }
      })

      // Apply category filter after enrichment
      const filteredListings = selectedCategory === 'all' 
        ? enrichedListings 
        : enrichedListings.filter(l => l.categories?.slug === selectedCategory)

      setListings(filteredListings)
      setTotalCount(count || 0)
      setTotalPages(Math.ceil((count || 0) / ITEMS_PER_PAGE))
      setCurrentPage(page)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }, [searchQuery, selectedCategory])

  // Fetch listings when filters change
  useEffect(() => {
    fetchListings(1)
  }, [fetchListings])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchListings(1)
  }

  const handlePageChange = (page: number) => {
    fetchListings(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const formatPrice = (priceCents: number | null | undefined) => {
    if (!priceCents || isNaN(priceCents)) {
      return '$0.00'
    }
    const price = priceCents / 100 // Convert cents to dollars
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getImageUrl = (assets: Array<{ path: string; kind: string }>) => {
    const imageAsset = assets?.find(asset => asset.kind === 'image')
    if (imageAsset) {
      return supabase.storage.from('listing-images').getPublicUrl(imageAsset.path).data.publicUrl
    }
    return null
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 text-center">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">UIUC Marketplace</h1>
            <p className="mt-2 text-gray-600">Please sign in to browse listings</p>
          </div>
          <div className="space-y-4">
            <Link href="/auth/signin">
              <Button className="w-full">Sign In</Button>
            </Link>
          </div>
        </div>
      </div>
    )
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
              <Link href="/listings">
                <Button variant="outline">Browse Listings</Button>
              </Link>
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Browse Listings</h1>
            <p className="text-muted-foreground">Find what you&apos;re looking for on campus</p>
          </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search listings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="default">
            Search
          </Button>
        </form>

        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Category:</span>
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading...' : `${totalCount} listing${totalCount !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-t-lg" />
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-6 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No listings found</h3>
            <p>Try adjusting your search or filters</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => {
            const imageUrl = getImageUrl(listing.listing_assets)
            
            return (
              <Link key={listing.id} href={`/listing/${listing.id}`}>
                <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="aspect-square relative overflow-hidden rounded-t-lg">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt={listing.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-2">{listing.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant="secondary" className="text-xs">
                        {listing.categories?.name}
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="text-2xl font-bold text-primary mb-2">
                      {formatPrice(listing.price_cents)}
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {listing.campus_location}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {listing.profiles?.full_name}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(listing.created_at)}
                      </div>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="pt-0">
                    <div className="flex items-center justify-between w-full text-xs text-muted-foreground">
                      <span>Qty: {listing.quantity}</span>
                      <span className="capitalize">{listing.condition}</span>
                    </div>
                  </CardFooter>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-12 flex justify-center">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (currentPage <= 3) {
                  pageNum = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = currentPage - 2 + i
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                )
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
        </div>
      </main>
    </div>
  )
}
