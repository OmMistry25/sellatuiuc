'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
}

interface Thread {
  id: string
  buyer_id: string
  seller_id: string
  is_anonymous: boolean
}

interface OrderChatProps {
  orderId: string
  threadId?: string
}

export default function OrderChat({ orderId, threadId }: OrderChatProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [thread, setThread] = useState<Thread | null>(null)
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (threadId) {
      fetchThread()
      fetchMessages()
      subscribeToMessages()
    } else {
      // Try to find existing thread for this order
      findThread()
    }
  }, [threadId, orderId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const findThread = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('order_id', orderId)
        .single()

      if (!error && data) {
        setThread(data)
        fetchMessages(data.id)
        subscribeToMessages(data.id)
      }
    } catch (error) {
      console.error('Error finding thread:', error)
    }
  }

  const fetchThread = async () => {
    if (!threadId) return

    try {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('id', threadId)
        .single()

      if (!error && data) {
        setThread(data)
      }
    } catch (error) {
      console.error('Error fetching thread:', error)
    }
  }

  const fetchMessages = async (threadIdToUse?: string) => {
    const id = threadIdToUse || threadId
    if (!id) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', id)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setMessages(data)
      }
    } catch (error) {
      console.error('Error fetching messages:', error)
    }
  }

  const subscribeToMessages = (threadIdToUse?: string) => {
    const id = threadIdToUse || threadId
    if (!id) return

    const channel = supabase
      .channel(`messages:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `thread_id=eq.${id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !thread || !user || sending) return

    setSending(true)
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          sender_id: user.id,
          content: newMessage.trim()
        })

      if (error) {
        console.error('Error sending message:', error)
      } else {
        setNewMessage('')
      }
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const getMaskedName = (senderId: string) => {
    if (!thread) return 'Unknown'
    
    if (senderId === thread.buyer_id) {
      return 'Buyer'
    } else if (senderId === thread.seller_id) {
      return 'Seller'
    }
    return 'Unknown'
  }

  const isOwnMessage = (senderId: string) => {
    return user?.id === senderId
  }

  if (!thread) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-600 text-center">Loading chat...</p>
      </div>
    )
  }

  return (
    <div className="bg-white border rounded-lg">
      <div className="p-4 border-b">
        <h4 className="font-medium text-gray-900">Order Chat</h4>
        <p className="text-sm text-gray-500">
          {thread.is_anonymous ? 'Anonymous chat - names are masked' : 'Direct chat'}
        </p>
      </div>
      
      <div className="h-64 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Start the conversation!</p>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isOwnMessage(message.sender_id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-3 py-2 rounded-lg ${
                  isOwnMessage(message.sender_id)
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="text-xs opacity-75 mb-1">
                  {getMaskedName(message.sender_id)}
                </div>
                <div className="text-sm">{message.content}</div>
                <div className="text-xs opacity-75 mt-1">
                  {new Date(message.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={sendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" disabled={sending || !newMessage.trim()}>
            {sending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </form>
    </div>
  )
}
