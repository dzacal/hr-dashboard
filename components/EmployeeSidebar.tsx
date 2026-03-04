'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const links = [
  { href: '/employee', label: 'My Dashboard', icon: '⊞' },
  { href: '/employee/profile', label: 'My Profile', icon: '👤' },
  { href: '/employee/pto', label: 'PTO Request', icon: '📅' },
  { href: '/employee/remote', label: 'Remote Request', icon: '🏠' },
  { href: '/employee/messages', label: 'HR Messages', icon: '✉️' },
]

export default function EmployeeSidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-slate-900 min-h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-white font-bold text-xl">HR Portal</h1>
        <span className="text-slate-400 text-xs mt-1 block">Employee Dashboard</span>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map(({ href, label, icon }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white text-slate-900'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          )
        })}

        {userRole === 'both' && (
          <div className="pt-3 mt-3 border-t border-slate-700">
            <button
              onClick={() => { window.location.href = '/admin' }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <span>↔</span>
              Switch to Admin View
            </button>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          Sign Out
        </button>
      </div>
    </aside>
  )
}
