import { redirect } from "next/navigation"

// CFO reports redirect to the shared reports generator, pre-configured for CFO
export default function CFOReportsPage() {
  redirect("/dashboard/ciso/reports")
}
