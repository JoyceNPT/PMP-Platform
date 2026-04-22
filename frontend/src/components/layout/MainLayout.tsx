import { Sidebar } from "./Sidebar"
import { Navbar } from "./Navbar"

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main content area pushed right of sidebar */}
      <div className="flex flex-col flex-1 md:ml-72 min-h-screen">
        <Navbar />
        <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12">
          {children}
        </main>
      </div>
    </div>
  )
}
