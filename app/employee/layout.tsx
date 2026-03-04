import EmployeeSidebar from '@/components/EmployeeSidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const userRole = profile?.role ?? 'employee'

  // Pure admins have no employee portal access
  if (userRole === 'admin') redirect('/admin')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <EmployeeSidebar userRole={userRole} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
