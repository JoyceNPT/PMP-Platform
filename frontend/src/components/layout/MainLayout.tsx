import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Fixed Sidebar - only visible md+ */}
      <Sidebar />

      {/* Main content area: no offset on mobile, offset on md+ */}
      <div className="flex flex-col flex-1 min-w-0 min-h-screen md:ml-72">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 md:px-10 lg:px-12">
          {children}
        </main>
      </div>
    </div>
  )
}
