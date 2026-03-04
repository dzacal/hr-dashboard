import AdminSidebar from '@/components/AdminSidebar'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let userRole = 'admin'
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    userRole = profile?.role ?? 'admin'
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminSidebar userRole={userRole} />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
