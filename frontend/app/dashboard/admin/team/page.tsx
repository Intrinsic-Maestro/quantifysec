"use client"

import { Users, Plus, MoreHorizontal } from "lucide-react"

import { USERS } from "@/lib/users"

const team = [
  { name: USERS.CISO.name, email: USERS.CISO.email, role: USERS.CISO.role, status: "Active", lastLogin: "2h ago", mfa: true },
  { name: USERS.CFO.name, email: USERS.CFO.email, role: USERS.CFO.role, status: "Active", lastLogin: "5h ago", mfa: true },
  { name: USERS.ANALYST_1.name, email: USERS.ANALYST_1.email, role: USERS.ANALYST_1.role, status: "Active", lastLogin: "1h ago", mfa: true },
  { name: USERS.ANALYST_2.name, email: USERS.ANALYST_2.email, role: USERS.ANALYST_2.role, status: "Active", lastLogin: "30m ago", mfa: false },
  { name: USERS.ADMIN.name, email: USERS.ADMIN.email, role: USERS.ADMIN.role, status: "Active", lastLogin: "4h ago", mfa: true },
  { name: USERS.EXEC.name, email: USERS.EXEC.email, role: USERS.EXEC.role, status: "Inactive", lastLogin: "14d ago", mfa: false },
]

export default function TeamPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage team members and permissions · Demo data</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition">
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Members", value: "6", color: "text-primary" },
          { label: "Active", value: "5", color: "text-accent" },
          { label: "Admins", value: "2", color: "text-amber-500" },
          { label: "MFA Enabled", value: "4/6", color: "text-rose-500" },
        ].map((s) => (
          <div key={s.label} className="metric-card">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{s.label}</p>
            <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border"><h2 className="font-semibold">Team Members</h2></div>
        <table className="w-full data-table">
          <thead>
            <tr><th>Name</th><th>Role</th><th>Status</th><th>MFA</th><th>Last Login</th><th></th></tr>
          </thead>
          <tbody>
            {team.map((m) => (
              <tr key={m.email}>
                <td>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{m.name.split(" ").map(n => n[0]).join("")}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="info-chip border border-border bg-muted text-muted-foreground text-[11px] font-medium">{m.role}</span>
                </td>
                <td>
                  <span className={`info-chip border text-[11px] font-semibold ${
                    m.status === "Active" ? "text-accent bg-accent/10 border-accent/20" : "text-muted-foreground bg-muted border-border"
                  }`}>{m.status}</span>
                </td>
                <td>
                  <span className={`text-xs font-semibold ${m.mfa ? "text-accent" : "text-rose-500"}`}>
                    {m.mfa ? "✓ Enabled" : "✗ Disabled"}
                  </span>
                </td>
                <td className="text-xs text-muted-foreground">{m.lastLogin}</td>
                <td>
                  <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
