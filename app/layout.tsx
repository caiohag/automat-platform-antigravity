import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"
import { TooltipProvider } from "@/components/ui/tooltip"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Automat Platform",
  description: "Plataforma de agentes IA para WhatsApp e Instagram",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${plusJakarta.variable} dark`}>
      <body className="font-sans antialiased">
        <TooltipProvider>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </body>
    </html>
  )
}
