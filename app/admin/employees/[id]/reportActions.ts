'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { revalidatePath } from 'next/cache'

export async function addReportLink(employeeId: string, title: string, url: string) {
  const supabase = createServiceClient()
  await supabase
    .from('management_report_links')
    .insert({ employee_id: employeeId, title, url })
  revalidatePath(`/admin/employees/${employeeId}`)
}

export async function deleteReportLink(linkId: string, employeeId: string) {
  const supabase = createServiceClient()
  await supabase
    .from('management_report_links')
    .delete()
    .eq('id', linkId)
  revalidatePath(`/admin/employees/${employeeId}`)
}
