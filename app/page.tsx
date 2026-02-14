'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '../lib/supabase'
import { User } from '@supabase/supabase-js'

type Bookmark = {
  id: number
  title: string
  url: string
  user_id: string
}

export default function Home() {
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(true)

  // Memoized fetch function to maintain performance
  const fetchBookmarks = useCallback(async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setBookmarks(data)
  }, [supabase])

  useEffect(() => {
    // 1. Initial Authentication and Data Fetching
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) fetchBookmarks()
    }

    getUser()

    // 2. ROBUST REALTIME LISTENER (Requirement #4)
    // We use a unique room ID to prevent "CLOSED" or "TIMED_OUT" errors
    const channelId = `bookmarks-sync-${Math.random().toString(36).substring(7)}`
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookmarks' 
        },
        (payload) => {
          console.log('Realtime update received:', payload)
          
          if (payload.eventType === 'INSERT') {
            const newBookmark = payload.new as Bookmark
            setBookmarks((prev) => {
              // Ensure we don't add the same bookmark twice if the UI already updated
              if (prev.some((b) => b.id === newBookmark.id)) return prev
              return [newBookmark, ...prev]
            })
          } else if (payload.eventType === 'DELETE') {
            setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
          }
        }
      )
      .subscribe((status) => {
        // Log status to F12 Console for verification
        console.log('Sync Status:', status)
      })

    // Clean up the subscription to prevent memory leaks
    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchBookmarks])

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setBookmarks([])
  }

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !url || !user) return

    // Insert new bookmark and fetch back the created row
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ title, url, user_id: user.id })
      .select()
      .single()

    if (error) {
      console.error('Add error:', error.message)
      alert('Failed to add bookmark. Check console for details.')
    } else if (data) {
      // Optimistic Update: Instantly add to local UI for a fast user experience
      setBookmarks((prev) => [data as Bookmark, ...prev])
      setTitle('')
      setUrl('')
    }
  }

  const deleteBookmark = async (id: number) => {
    const { error } = await supabase.from('bookmarks').delete().eq('id', id)
    if (error) console.error('Delete error:', error.message)
  }

  if (loading) return <div className="p-10 text-center text-gray-600">Initialising App...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-black">
      <div className="max-w-md mx-auto bg-white rounded-xl shadow-lg overflow-hidden p-6 border border-gray-100">
        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">Smart Bookmark App</h1>

        {!user ? (
          <div className="text-center">
            <p className="text-gray-500 mb-4">Securely save and sync your links in real-time.</p>
            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-medium shadow-sm"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              {/* Removed 'truncate' and 'max-width' to show the full email address */}
              <span className="text-xs text-gray-400 font-mono">{user.email}</span>
              <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-600 font-semibold uppercase tracking-wider">Sign Out</button>
            </div>

            <form onSubmit={addBookmark} className="mb-8 space-y-3">
              <input
                type="text"
                placeholder="Title (e.g., My Portfolio)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                required
              />
              <input
                type="url"
                placeholder="URL (https://...)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full border border-gray-200 p-3 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-gray-400"
                required
              />
              <button type="submit" className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-bold shadow-md">
                Add Bookmark
              </button>
            </form>

            <ul className="space-y-3">
              {bookmarks.length === 0 && <p className="text-center text-gray-400 text-sm italic">Your list is currently empty.</p>}
              {bookmarks.map((bookmark) => (
                <li key={bookmark.id} className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                  <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium truncate max-w-[200px]">
                    {bookmark.title}
                  </a>
                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="text-red-500 hover:text-red-700 text-xs font-bold px-2 py-1"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  )
}