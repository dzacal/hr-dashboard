import AdminSidebar from '@/components/AdminSidebar'
import NotificationBell from '@/components/NotificationBell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [{ data: profile }, { count: unreadCount }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
  ])

  // Only block pure employees — if profile is null, don't default to employee
  if (profile?.role === 'employee') redirect('/employee')

  const userRole = profile?.role ?? 'admin'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar userRole={userRole} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-end shrink-0">
          <NotificationBell userId={user.id} initialCount={unreadCount ?? 0} />
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
