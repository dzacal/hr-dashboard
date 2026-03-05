import EmployeeSidebar from '@/components/EmployeeSidebar'
import NotificationBell from '@/components/NotificationBell'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const [{ data: profile }, { data: reportLinks }, { count: unreadCount }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase
      .from('management_report_links')
      .select('id, title, url')
      .eq('employee_id', user.id)
      .order('created_at', { ascending: true }),
    supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false),
  ])

  const userRole = profile?.role ?? 'employee'

  // Pure admins have no employee portal access
  if (userRole === 'admin') redirect('/admin')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <EmployeeSidebar userRole={userRole} reportLinks={reportLinks ?? []} />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-8 h-14 flex items-center justify-end shrink-0">
          <NotificationBell userId={user.id} initialCount={unreadCount ?? 0} />
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  )
}
