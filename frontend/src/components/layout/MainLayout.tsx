import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main content area pushed right of sidebar */}
      <div className="flex flex-col flex-1 md:ml-64 lg:ml-72 min-h-screen">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {children}
        </main>
      </div>
    </div>
  )
}
