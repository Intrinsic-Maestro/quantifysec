"use client"

import Link from "next/link"
import { Shield, Github, Twitter, Linkedin } from "lucide-react"

const footerLinks = {
  Product: [
    { label: "CISO Dashboard", href: "/dashboard/ciso" },
    { label: "CFO Dashboard", href: "/dashboard/cfo" },
    { label: "AI Analyst", href: "/dashboard/ciso/ai-analyst" },
    { label: "Attack Surface", href: "/dashboard/ciso/attack-surface" },
    { label: "Audit Logs", href: "/dashboard/admin/audit-logs" },
  ],
  Solutions: [
    { label: "Financial Services", href: "#" },
    { label: "Healthcare", href: "#" },
    { label: "Technology", href: "#" },
    { label: "Government", href: "#" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Case Studies", href: "#" },
    { label: "Security Research", href: "#" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "/contact" },
    { label: "Partners", href: "#" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
    { label: "Cookie Policy", href: "#" },
    { label: "DPA", href: "#" },
    { label: "Security", href: "#" },
  ],
}

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/20">
      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Top */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-base">
                Quantify<span className="text-primary">Sec</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Enterprise cyber risk intelligence platform for CISOs and CFOs.
            </p>
            <div className="flex gap-3">
              {[
                { Icon: Github, label: "GitHub", href: "#" },
                { Icon: Twitter, label: "Twitter", href: "#" },
                { Icon: Linkedin, label: "LinkedIn", href: "#" },
              ].map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category} className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © 2026 QuantifySec, Inc. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            {["SOC 2 Type II", "ISO 27001", "GDPR Ready", "HIPAA Compliant"].map((badge) => (
              <span
                key={badge}
                className="text-xs font-medium px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
