import { BookmarkStacksDisplay } from "@/components/display/BookmarkStacksDisplay"
import { Navbar } from "@/components/layout/Navbar"

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <BookmarkStacksDisplay />
      </div>
    </main>
  )
}