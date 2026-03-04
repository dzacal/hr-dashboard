import AdminSidebar from '@/components/AdminSidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  // Only block pure employees — if profile is null, don't default to employee
  if (profile?.role === 'employee') redirect('/employee')

  const userRole = profile?.role ?? 'admin'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar userRole={userRole} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
