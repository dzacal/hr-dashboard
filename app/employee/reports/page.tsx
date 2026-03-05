export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: links } = await supabase
    .from('management_report_links')
    .select('id, title, url')
    .eq('employee_id', user!.id)
    .order('created_at', { ascending: true })

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Management Reports</h2>
      <p className="text-slate-500 mb-8">Documents and reports shared with you by HR.</p>

      {(!links || links.length === 0) ? (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8 text-center">
          <p className="text-slate-400 text-sm">No reports have been shared with you yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {links.map((link: any) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">📊</span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{link.title}</p>
                  <p className="text-xs text-slate-400 mt-1 truncate">{link.url}</p>
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-3 group-hover:underline">Open report →</p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
