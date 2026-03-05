'use client'

import { useState } from 'react'
import { addReportLink, deleteReportLink } from './reportActions'

interface ReportLink {
  id: string
  title: string
  url: string
}

export default function ManagementReportsAdmin({
  employeeId,
  initialLinks,
}: {
  employeeId: string
  initialLinks: ReportLink[]
}) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !url.trim()) return
    setLoading(true)
    await addReportLink(employeeId, title.trim(), url.trim())
    setTitle('')
    setUrl('')
    setLoading(false)
  }

  async function handleRemove(linkId: string) {
    setRemoving(linkId)
    await deleteReportLink(linkId, employeeId)
    setRemoving(null)
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 lg:col-span-2">
      <h3 className="font-semibold text-slate-700 mb-4">Management Reports</h3>

      {initialLinks.length === 0 ? (
        <p className="text-sm text-slate-400 mb-4">No report links added yet.</p>
      ) : (
        <div className="space-y-2 mb-5">
          {initialLinks.map(link => (
            <div key={link.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">{link.title}</p>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-500 hover:underline truncate block max-w-sm"
                >
                  {link.url}
                </a>
              </div>
              <button
                onClick={() => handleRemove(link.id)}
                disabled={removing === link.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 shrink-0"
              >
                {removing === link.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Add New Link</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Link title (e.g. Q1 Performance Review)"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://..."
          type="url"
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !title.trim() || !url.trim()}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Adding…' : 'Add Link'}
        </button>
      </form>
    </div>
  )
}
