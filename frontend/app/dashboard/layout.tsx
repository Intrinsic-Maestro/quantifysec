import { DashboardTopNav } from "@/components/dashboard/topnav"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <DashboardTopNav />
      <main className="flex-1 w-full max-w-[1600px] mx-auto p-4 md:p-8 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
