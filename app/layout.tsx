import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "quantifysec | Cyber Risk Quantification",
  description: "Next generation cyber risk quantification and optimization.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark antialiased">
      <body>
        <div className="noise-bg"></div>
        {children}
      </body>
    </html>
  );
}
