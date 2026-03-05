'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  title: string
  body: string | null
  link: string | null
  read: boolean
  created_at: string
}

const TYPE_ICON: Record<string, string> = {
  pto_request: '📅',
  remote_request: '🏠',
  pto_decision: '✅',
  remote_decision: '✅',
  hr_message: '✉️',
  hr_reply: '💬',
  report_reminder: '📊',
}

export default function NotificationBell({
  userId,
  initialCount,
}: {
  userId: string
  initialCount: number
}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(initialCount)
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(25)
      const rows = data ?? []
      setNotifications(rows)
      setUnread(rows.filter((n) => !n.read).length)
    }
    load()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev])
          setUnread((n) => n + 1)
          playChime()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  async function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next && unread > 0) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnread(0)
    }
  }

  async function markAllRead() {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnread(0)
  }

  async function deleteAll() {
    await supabase.from('notifications').delete().eq('user_id', userId)
    setNotifications([])
    setUnread(0)
  }

  async function deleteOne(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    const target = notifications.find((n) => n.id === id)
    await supabase.from('notifications').delete().eq('id', id)
    setNotifications((prev) => prev.filter((n) => n.id !== id))
    if (target && !target.read) setUnread((u) => Math.max(0, u - 1))
  }

  function handleClick(n: Notification) {
    setOpen(false)
    if (!n.link) return
    if (n.link.startsWith('http')) {
      window.open(n.link, '_blank', 'noopener,noreferrer')
    } else {
      router.push(n.link)
    }
  }

  function playChime() {
    try {
      const ctx = new AudioContext()
      const frequencies = [880, 1100, 1320]
      frequencies.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const start = ctx.currentTime + i * 0.12
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.18, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35)
        osc.start(start)
        osc.stop(start + 0.35)
      })
    } catch {
      // AudioContext not available (e.g. SSR or blocked by browser)
    }
  }

  function timeAgo(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={toggleOpen}
        aria-label="Notifications"
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unread > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] leading-none rounded-full min-w-[16px] h-4 flex items-center justify-center font-bold px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-800 text-sm">Notifications</h3>
            {notifications.length > 0 ? (
              <div className="flex items-center gap-3">
                {unread > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={deleteAll}
                  className="text-xs text-red-500 hover:text-red-700 font-medium"
                >
                  Delete all
                </button>
              </div>
            ) : (
              <span className="text-xs text-slate-400">All caught up</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-400 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-stretch group ${!n.read ? 'bg-blue-50/60' : ''} hover:bg-slate-50 transition-colors`}
                >
                  <button
                    onClick={() => handleClick(n)}
                    className="flex-1 text-left px-4 py-3"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-base leading-none">
                        {TYPE_ICON[n.type] ?? '🔔'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!n.read ? 'font-semibold text-slate-800' : 'text-slate-700'}`}>
                          {n.title}
                        </p>
                        {n.body && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.body}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                      </div>
                      {!n.read && (
                        <span className="mt-1.5 w-2 h-2 bg-blue-500 rounded-full shrink-0" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={(e) => deleteOne(n.id, e)}
                    aria-label="Delete notification"
                    className="px-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors self-stretch flex items-center opacity-0 group-hover:opacity-100"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
