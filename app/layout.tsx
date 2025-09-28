import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { HeroHeader } from "@/components/Header";
import FooterSection from "@/components/Footer";
import ChatComponent from "@/components/chat/ChatComponent";
import ChatHeader from "@/components/chat/ChatHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GigCampus",
  description: "Join the Future of Work",
  manifest: "/manifest.json",
  icons: "/favicon.ico",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
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
  );
}
