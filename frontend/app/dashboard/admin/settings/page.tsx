"use client"

import { Settings, Bell, Shield, Globe, Key } from "lucide-react"

export default function SettingsPage() {
  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Platform configuration · Demo data</p>
      </div>

      {[
        {
          icon: Shield,
          title: "Security Settings",
          items: [
            { label: "MFA Enforcement", desc: "Require MFA for all users", enabled: true },
            { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", enabled: true },
            { label: "IP Allowlisting", desc: "Restrict access to approved IP ranges", enabled: false },
          ],
        },
        {
          icon: Bell,
          title: "Notifications",
          items: [
            { label: "Critical Risk Alerts", desc: "Immediate notification for critical risks", enabled: true },
            { label: "Weekly Summary", desc: "Send weekly security scorecard via email", enabled: true },
            { label: "Incident Updates", desc: "Real-time incident status notifications", enabled: true },
          ],
        },
        {
          icon: Globe,
          title: "Data & Privacy",
          items: [
            { label: "Audit Log Retention", desc: "Retain audit logs for 365 days", enabled: true },
            { label: "Data Residency", desc: "US East region — GDPR compliant", enabled: null },
          ],
        },
      ].map((section) => {
        const Icon = section.icon
        return (
          <div key={section.title} className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
              <Icon className="w-[18px] h-[18px] text-primary" />
              <h2 className="font-semibold">{section.title}</h2>
            </div>
            <div className="divide-y divide-border">
              {section.items.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-6 py-4">
                  <div>
                    <p className="font-medium text-sm">{item.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                  {item.enabled !== null && (
                    <div className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                      item.enabled ? "bg-primary" : "bg-muted border border-border"
                    }`}>
                      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        item.enabled ? "translate-x-5" : "translate-x-0.5"
                      }`} />
                    </div>
                  )}
                  {item.enabled === null && (
                    <span className="text-xs text-muted-foreground font-medium">{item.desc.split("—")[1]?.trim() || "View"}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
