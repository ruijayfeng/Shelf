import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { BookmarkProvider } from "@/lib/bookmark-context"
import { AuthProvider } from "@/lib/auth-context"

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
        <AuthProvider>
          <BookmarkProvider>
            {children}
          </BookmarkProvider>
        </AuthProvider>
      </body>
    </html>
  )
}