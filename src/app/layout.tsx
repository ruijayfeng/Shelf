import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { BookmarkProvider } from "@/lib/bookmark-context"
import { AuthProvider } from "@/lib/auth-context"
import { LanguageProvider } from "@/lib/language-context"
import { ToastProvider } from "@/components/ui/toast"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Shelf - 3D Bookmark Manager",
  description: "Organize your bookmarks in beautiful 3D stacks with Shelf",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ToastProvider>
          <LanguageProvider>
            <AuthProvider>
              <BookmarkProvider>
                {children}
              </BookmarkProvider>
            </AuthProvider>
          </LanguageProvider>
        </ToastProvider>
      </body>
    </html>
  )
}