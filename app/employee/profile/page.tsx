export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import ProfileEditForm from './ProfileEditForm'
import ChangePasswordForm from './ChangePasswordForm'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, username, position, department, company, start_date, birthday, cell_phone, emergency_contact_name, emergency_contact_phone, emergency_contact_relationship')
    .eq('id', user!.id)
    .single()

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">My Profile</h2>
      <p className="text-slate-500 mb-8">Update your personal and contact information.</p>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 max-w-2xl">
        <ProfileEditForm profile={profile!} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 max-w-2xl mt-6">
        <h3 className="text-base font-bold text-slate-800 mb-1">Change Password</h3>
        <p className="text-sm text-slate-500 mb-6">Update your password. You'll need to enter your current password to confirm.</p>
        <ChangePasswordForm />
      </div>
    </div>
  )
}
