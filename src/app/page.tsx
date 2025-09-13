'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Shield, CreditCard, MessageSquare, Truck, Star, Search, ArrowRight, Zap, Clock, CheckCircle, Sparkles } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function LandingPage() {
  const [searchText, setSearchText] = useState('')
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0)
  const searchExamples = ['textbooks', 'furniture', 'electronics', 'bikes', 'clothes', 'kitchen items']

  useEffect(() => {
    const interval = setInterval(() => {
      const currentExample = searchExamples[currentSearchIndex]
      let charIndex = 0
      
      const typeInterval = setInterval(() => {
        if (charIndex <= currentExample.length) {
          setSearchText(currentExample.slice(0, charIndex))
          charIndex++
        } else {
          clearInterval(typeInterval)
          setTimeout(() => {
            setCurrentSearchIndex((prev) => (prev + 1) % searchExamples.length)
          }, 1500)
        }
      }, 100)
      
      return () => clearInterval(typeInterval)
    }, 3000)

    return () => clearInterval(interval)
  }, [currentSearchIndex])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-40 right-1/3 w-60 h-60 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">UIUC Marketplace</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/signin">
                <Button variant="ghost" className="text-white hover:bg-white/10">Sign In</Button>
              </Link>
              <Link href="/auth/signin">
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <Badge className="mb-8 bg-gradient-to-r from-orange-500/20 to-red-500/20 text-orange-300 border-orange-500/30 inline-flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            🎓 For UIUC Students Only
          </Badge>
          
          <h1 className="text-5xl lg:text-7xl font-extrabold text-white mb-8 leading-tight">
            Where UIUC 
            <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent"> Buys & Sells</span>
          </h1>
          
          <p className="text-xl lg:text-2xl text-gray-300 mb-12 leading-relaxed max-w-4xl mx-auto">
            Finally, one place for everything. No more hunting through Snapchat stories or random group chats. 
            <strong className="text-white"> Your campus marketplace, done right.</strong>
          </p>

          {/* Interactive Search Demo */}
          <div className="mb-12 max-w-lg mx-auto">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchText}
                readOnly
                placeholder="Search for anything..."
                className="w-full pl-14 pr-16 py-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white text-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium tracking-wide"
              />
              <div className="absolute right-5 top-1/2 transform -translate-y-1/2">
                <div className="w-2 h-6 bg-orange-500 animate-pulse rounded"></div>
              </div>
            </div>
            <p className="text-sm text-gray-400 mt-4 text-center">Try searching for: textbooks, furniture, electronics...</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link href="/auth/signin">
              <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-0 rounded-2xl px-10 py-6 text-lg font-semibold shadow-2xl shadow-orange-500/25">
                Start Selling Today
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/listings">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white/50 text-white hover:bg-white hover:text-gray-900 rounded-2xl px-10 py-6 text-lg font-semibold backdrop-blur-md bg-white/5">
                Browse Listings
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex justify-center items-center space-x-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-gray-400">Students</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">1.2k+</div>
              <div className="text-sm text-gray-400">Items Sold</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">4.9★</div>
              <div className="text-sm text-gray-400">Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Comparison */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              The Problem Students Face
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Buying and selling on campus is scattered, frustrating, and inefficient. Sound familiar?
            </p>
          </div>

          {/* Before vs After Comparison */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Before - The Problem */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <Badge className="bg-red-100 text-red-700 mb-4">❌ Before - The Scattered Mess</Badge>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">The Current Chaos</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Snapchat Stories</h4>
                    <p className="text-gray-600 text-sm">Disappears in 24hrs, no search, screenshots required</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Search className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Instagram Posts</h4>
                    <p className="text-gray-600 text-sm">Buried in personal feeds, impossible to find later</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-red-50 rounded-xl border border-red-100">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">GroupMe/Discord</h4>
                    <p className="text-gray-600 text-sm">Messages get lost, no organization, spam-filled</p>
                  </div>
                </div>
              </div>
            </div>

            {/* After - The Solution */}
            <div className="space-y-6">
              <div className="text-center lg:text-left">
                <Badge className="bg-green-100 text-green-700 mb-4">✅ After - The UIUC Way</Badge>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">One Platform, Everything</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Search className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Smart Search</h4>
                    <p className="text-gray-600 text-sm">Find exactly what you need instantly with filters</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Secure Payments</h4>
                    <p className="text-gray-600 text-sm">Escrow protection, no more Venmo trust issues</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 p-4 bg-green-50 rounded-xl border border-green-100 hover:bg-green-100 transition-colors">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">Built-in Chat</h4>
                    <p className="text-gray-600 text-sm">Private messaging without sharing personal info</p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/auth/signin">
                  <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 rounded-xl py-6 text-lg font-semibold">
                    Join the Better Way
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gradient-to-br from-slate-900 to-purple-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
              Everything You Need,
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent"> All In One Place</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built specifically for UIUC students, with features that actually make sense
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group relative">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">UIUC Students Only</h3>
                <p className="text-gray-300 mb-6">
                  Verified .illinois.edu emails ensure you're dealing with fellow Fighting Illini. No randos, no scams.
                </p>
                <div className="flex items-center text-orange-400 group-hover:text-orange-300">
                  <span className="text-sm font-semibold">Verified Community</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Secure Payments</h3>
                <p className="text-gray-300 mb-6">
                  Stripe-powered escrow system holds payment until delivery. No more Venmo trust falls or awkward cash exchanges.
                </p>
                <div className="flex items-center text-green-400 group-hover:text-green-300">
                  <span className="text-sm font-semibold">Protected Transactions</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <MessageSquare className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Built-in Chat</h3>
                <p className="text-gray-300 mb-6">
                  Message buyers and sellers directly without sharing personal info. Keep negotiations organized and private.
                </p>
                <div className="flex items-center text-purple-400 group-hover:text-purple-300">
                  <span className="text-sm font-semibold">Private Messaging</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group relative">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Truck className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Delivery Tracking</h3>
                <p className="text-gray-300 mb-6">
                  Photo proof of delivery with automatic payment release. Know exactly when your item arrives.
                </p>
                <div className="flex items-center text-blue-400 group-hover:text-blue-300">
                  <span className="text-sm font-semibold">Proof of Delivery</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="group relative">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Rental Support</h3>
                <p className="text-gray-300 mb-6">
                  Rent textbooks, furniture, and equipment with flexible terms. Perfect for semester-long needs.
                </p>
                <div className="flex items-center text-yellow-400 group-hover:text-yellow-300">
                  <span className="text-sm font-semibold">Flexible Rentals</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="group relative">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
                <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-rose-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Reviews & Ratings</h3>
                <p className="text-gray-300 mb-6">
                  Build trust through verified transactions and honest feedback. See who you can really trust.
                </p>
                <div className="flex items-center text-pink-400 group-hover:text-pink-300">
                  <span className="text-sm font-semibold">Trust Building</span>
                  <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Dead Simple Process
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From signup to sale in minutes. No complicated steps, no weird requirements.
            </p>
          </div>
          
          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-200 via-orange-400 to-red-400 transform -translate-y-1/2"></div>
            
            <div className="grid lg:grid-cols-4 gap-8 relative">
              {/* Step 1 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-orange-500/25 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-orange-500 rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Sign Up</h3>
                <p className="text-gray-600">Use your .illinois.edu email. Takes 30 seconds.</p>
              </div>

              {/* Step 2 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/25 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-blue-500 rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">List or Browse</h3>
                <p className="text-gray-600">Post what you're selling or find what you need.</p>
              </div>

              {/* Step 3 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-green-500/25 group-hover:scale-110 transition-transform">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-green-500 rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Chat & Pay</h3>
                <p className="text-gray-600">Message securely, pay with protection.</p>
              </div>

              {/* Step 4 */}
              <div className="text-center group">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-purple-500/25 group-hover:scale-110 transition-transform">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-4 border-purple-500 rounded-full"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Done!</h3>
                <p className="text-gray-600">Get your item, leave a review, repeat.</p>
              </div>
            </div>
          </div>

          {/* Social Proof */}
          <div className="mt-16 text-center">
            <p className="text-gray-600 mb-8">Join hundreds of UIUC students already trading smart</p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <div className="flex -space-x-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-10 h-10 bg-gradient-to-r from-orange-400 to-red-400 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-bold">
                    {String.fromCharCode(65 + i)}
                  </div>
                ))}
              </div>
              <div className="text-sm text-gray-500">+495 more students</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-1/4 w-40 h-40 bg-white/10 rounded-full blur-xl"></div>
        </div>
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-6xl font-bold text-white mb-6">
            Ready to Join?
          </h2>
          <p className="text-xl lg:text-2xl text-orange-100 mb-12 leading-relaxed">
            Stop wasting time hunting through stories and group chats.<br />
            <strong className="text-white">Your campus marketplace is here.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Link href="/auth/signin">
              <Button size="lg" className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-100 border-0 rounded-2xl px-12 py-6 text-xl font-bold shadow-2xl">
                Start Selling Today
                <ArrowRight className="ml-3 w-6 h-6" />
              </Button>
            </Link>
            <Link href="/listings">
              <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-white text-white hover:bg-white hover:text-orange-600 rounded-2xl px-12 py-6 text-xl font-bold backdrop-blur-md bg-white/10">
                Browse Listings
              </Button>
            </Link>
          </div>
          
          <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-6 text-orange-200">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Free to join</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>UIUC students only</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5" />
              <span>Secure payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">UIUC Marketplace</h3>
              </div>
              <p className="text-gray-400 leading-relaxed">
                Where UIUC students buy and sell the smart way. No more scattered posts, no more trust issues.
              </p>
              <div className="mt-6 flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">IG</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">SC</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors cursor-pointer">
                  <span className="text-sm font-bold">TW</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-6">For Students</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/listings" className="hover:text-orange-400 transition-colors">Browse Listings</Link></li>
                <li><Link href="/sell" className="hover:text-orange-400 transition-colors">Sell Items</Link></li>
                <li><Link href="/auth/signin" className="hover:text-orange-400 transition-colors">Create Account</Link></li>
                <li><Link href="/dashboard" className="hover:text-orange-400 transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/help" className="hover:text-orange-400 transition-colors">Help Center</Link></li>
                <li><Link href="/contact" className="hover:text-orange-400 transition-colors">Contact Us</Link></li>
                <li><Link href="/safety" className="hover:text-orange-400 transition-colors">Safety Tips</Link></li>
                <li><Link href="/faq" className="hover:text-orange-400 transition-colors">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-6">Legal</h4>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/guidelines" className="hover:text-orange-400 transition-colors">Community Guidelines</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-400 mb-4 md:mb-0">
                <p>&copy; 2024 UIUC Marketplace. Built for Fighting Illini, by Fighting Illini.</p>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>All systems operational</span>
                </span>
                <span>Version 1.0</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
