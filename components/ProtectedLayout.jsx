'use client'

import { usePathname } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function ProtectedLayout({ children }) {
  const pathname = usePathname()
  const publicRoutes = ['/', '/login']
  const isPublic = publicRoutes.includes(pathname)

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gradient-to-tr from-slate-50 via-gray-50 to-slate-100">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-72 transition-all duration-300">
          <Header />
          <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8">
            <div className="max-w-[100vw] md:w-[78vw] mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
