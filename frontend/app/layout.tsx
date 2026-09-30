import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AiChatbot } from "@/components/ai-chatbot"
import { GlobalSearch } from "@/components/global-search"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "QuantifySec — Cyber Risk Intelligence Platform",
  description:
    "Convert cybersecurity data into measurable business risk intelligence. CISO & CFO dashboards, AI security analyst, attack surface monitoring.",
  keywords: ["cybersecurity", "risk intelligence", "CISO dashboard", "security analytics", "cyber risk quantification"],
  icons: {
    icon: [
      { url: "./favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "./favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "./apple-touch-icon.png",
  },
  manifest: "./site.webmanifest",
  openGraph: {
    title: "QuantifySec — Cyber Risk Intelligence Platform",
    description: "Make security measurable. Enterprise risk intelligence for CISOs and CFOs.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <AiChatbot />
          <GlobalSearch />
        </ThemeProvider>
      </body>
    </html>
  )
}
