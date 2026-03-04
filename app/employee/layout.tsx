import EmployeeSidebar from '@/components/EmployeeSidebar'

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <EmployeeSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
