import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { HeroHeader } from "@/components/Header"
import FooterSection from "@/components/Footer"
import ChatComponent from "@/components/chat/ChatComponent"
import ChatHeader from "@/components/chat/ChatHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

// ✅ Metadata for PWA + SEO
export const metadata: Metadata = {
  title: "GigCampus",
  description: "Join the Future of Work",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/icon.png", // For Apple devices
  },
  themeColor: "#ffffff", // replaces <meta name="theme-color">
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <HeroHeader />
        {children}
        <FooterSection />
        <ChatHeader projectId="1" />
      </body>
    </html>
  )
}
